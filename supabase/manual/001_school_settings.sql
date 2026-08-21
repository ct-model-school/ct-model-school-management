-- Run this manually in the Supabase SQL editor.
-- This file intentionally does not use a service-role key.

create table if not exists public.school_settings (
  id smallint primary key default 1 check (id = 1),
  theme_color text not null default '#64748b'
    check (theme_color ~ '^#[0-9A-Fa-f]{6}$'),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.school_settings enable row level security;

create or replace function public.is_school_administrator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles profile
    join public.roles role on role.id = profile.role_id
    where profile.id = auth.uid()
      and profile.is_active = true
      and lower(role.name) in ('admin', 'administrator', 'super_admin')
  );
$$;

revoke all on function public.is_school_administrator() from public;
grant execute on function public.is_school_administrator() to authenticated;

drop policy if exists "Anyone can read the school theme" on public.school_settings;
create policy "Anyone can read the school theme"
  on public.school_settings
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Administrators can manage school settings" on public.school_settings;
create policy "Administrators can manage school settings"
  on public.school_settings
  for all
  to authenticated
  using (public.is_school_administrator())
  with check (public.is_school_administrator());

insert into public.school_settings (id, theme_color)
values (1, '#64748b')
on conflict (id) do nothing;

create or replace function public.set_school_settings_updated_metadata()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

drop trigger if exists school_settings_set_updated_metadata on public.school_settings;
create trigger school_settings_set_updated_metadata
  before update on public.school_settings
  for each row
  execute function public.set_school_settings_updated_metadata();
