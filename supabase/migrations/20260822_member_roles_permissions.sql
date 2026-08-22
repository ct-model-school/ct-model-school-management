-- Configurable member access roles.
-- Role permissions are stored as JSONB so the admin can enable/disable module access without changing code.

create table if not exists public.member_roles (
  id uuid primary key default gen_random_uuid(),
  role_name text not null unique,
  permissions jsonb not null default '{}'::jsonb,
  is_system boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists member_roles_active_idx on public.member_roles(is_active, role_name);

alter table public.member_roles enable row level security;

revoke all on public.member_roles from public, anon;
grant select, insert, update, delete on public.member_roles to authenticated;

drop policy if exists member_roles_admin_all on public.member_roles;
create policy member_roles_admin_all on public.member_roles
  for all to authenticated
  using (public.store_is_admin())
  with check (public.store_is_admin());

insert into public.member_roles(role_name, permissions, is_system)
values
  ('Staff', '{"dashboard":true,"students":false,"parents":false,"people":false,"teachers":false,"accounts":false,"store_members":false,"inventory":false,"notices":true,"results":false}'::jsonb, true),
  ('Teacher', '{"dashboard":true,"students":true,"parents":true,"people":true,"teachers":false,"accounts":false,"store_members":false,"inventory":false,"notices":true,"results":true}'::jsonb, true),
  ('Accounts', '{"dashboard":true,"students":false,"parents":false,"people":false,"teachers":false,"accounts":true,"store_members":false,"inventory":false,"notices":true,"results":false}'::jsonb, true),
  ('Other', '{"dashboard":true,"students":false,"parents":false,"people":false,"teachers":false,"accounts":false,"store_members":false,"inventory":false,"notices":false,"results":false}'::jsonb, true)
on conflict (role_name) do nothing;

create or replace function public.store_admin_list_member_roles()
returns setof public.member_roles
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.store_is_admin() then raise exception 'Not authorized'; end if;
  return query
    select * from public.member_roles
    where is_active = true
    order by is_system desc, lower(role_name);
end;
$$;

grant execute on function public.store_admin_list_member_roles() to authenticated;

create or replace function public.store_admin_save_member_role(
  p_id uuid default null,
  p_role_name text default null,
  p_permissions jsonb default '{}'::jsonb
)
returns public.member_roles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.member_roles;
  v_name text := nullif(trim(p_role_name), '');
begin
  if not public.store_is_admin() then raise exception 'Not authorized'; end if;
  if v_name is null then raise exception 'Role name is required'; end if;
  if p_id is null then
    insert into public.member_roles(role_name, permissions, is_system, is_active)
    values(v_name, coalesce(p_permissions, '{}'::jsonb), false, true)
    returning * into v_role;
  else
    update public.member_roles
    set role_name = v_name,
        permissions = coalesce(p_permissions, '{}'::jsonb),
        updated_at = now()
    where id = p_id
    returning * into v_role;
    if v_role.id is null then raise exception 'Role not found'; end if;
  end if;
  return v_role;
exception when unique_violation then
  raise exception 'A role with this name already exists';
end;
$$;

grant execute on function public.store_admin_save_member_role(uuid,text,jsonb) to authenticated;

create or replace function public.store_admin_remove_member_role(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.member_roles;
  v_name text;
  v_used bigint := 0;
begin
  if not public.store_is_admin() then raise exception 'Not authorized'; end if;
  select * into v_role from public.member_roles where id = p_id for update;
  if v_role.id is null then raise exception 'Role not found'; end if;
  if v_role.is_system then raise exception 'System roles cannot be removed'; end if;
  v_name := v_role.role_name;

  select count(*) into v_used from public.staff_members where access_role = v_name;
  select v_used + count(*) into v_used from public.teacher_members where access_role = v_name;
  select v_used + count(*) into v_used from public.account_members where access_role = v_name;
  select v_used + count(*) into v_used from public.other_members where access_role = v_name;

  if v_used > 0 then
    raise exception 'Role is assigned to % member(s). Reassign those members before removing the role.', v_used;
  end if;

  delete from public.member_roles where id = p_id;
end;
$$;

grant execute on function public.store_admin_remove_member_role(uuid) to authenticated;
