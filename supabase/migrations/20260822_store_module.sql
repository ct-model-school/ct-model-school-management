-- CT Model School Management
-- Store / SR module foundation
-- Apply this migration in Supabase SQL Editor before using the Store UI.

create extension if not exists pgcrypto;

create sequence if not exists public.inventory_item_code_seq start 1;
create sequence if not exists public.store_sr_number_seq start 1;

create table if not exists public.inventory_items (
  id uuid primary key default gen_random_uuid(),
  item_code text unique not null,
  item_name text not null,
  item_type text,
  specification text,
  brand text,
  model text,
  unit text not null default 'pcs',
  details text,
  current_stock numeric(14,2) not null default 0 check (current_stock >= 0),
  reorder_level numeric(14,2) not null default 0 check (reorder_level >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inventory_items_name_idx on public.inventory_items (lower(item_name));
create index if not exists inventory_items_type_idx on public.inventory_items (lower(item_type));
create index if not exists inventory_items_active_idx on public.inventory_items (is_active);

create or replace function public.generate_inventory_item_code()
returns trigger
language plpgsql
as $$
begin
  if nullif(trim(new.item_code), '') is null then
    new.item_code := 'ITM-' || lpad(nextval('public.inventory_item_code_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists inventory_items_code_before_insert on public.inventory_items;
create trigger inventory_items_code_before_insert
before insert on public.inventory_items
for each row execute function public.generate_inventory_item_code();

create table if not exists public.inventory_stock_movements (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.inventory_items(id) on delete restrict,
  movement_type text not null check (movement_type in ('opening','add','issue','return','adjustment')),
  quantity numeric(14,2) not null check (quantity > 0),
  reference_type text,
  reference_id uuid,
  note text,
  performed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists inventory_stock_movements_item_idx on public.inventory_stock_movements (item_id, created_at desc);

create table if not exists public.store_users (
  id uuid primary key default gen_random_uuid(),
  people_profile_id uuid references public.people_profiles(id) on delete set null,
  login_id text unique not null,
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists store_users_people_profile_idx on public.store_users (people_profile_id);
create index if not exists store_users_active_idx on public.store_users (is_active);

create table if not exists public.store_sessions (
  id uuid primary key default gen_random_uuid(),
  store_user_id uuid not null references public.store_users(id) on delete cascade,
  token_hash text unique not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists store_sessions_user_idx on public.store_sessions (store_user_id);
create index if not exists store_sessions_expiry_idx on public.store_sessions (expires_at);

create table if not exists public.store_service_requests (
  id uuid primary key default gen_random_uuid(),
  sr_number text unique not null,
  store_user_id uuid not null references public.store_users(id) on delete restrict,
  class_name text,
  department text,
  request_details text,
  status text not null default 'pending' check (status in ('pending','approved','partially_issued','issued','rejected')),
  admin_note text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz,
  processed_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create index if not exists store_service_requests_number_idx on public.store_service_requests (sr_number);
create index if not exists store_service_requests_status_idx on public.store_service_requests (status);
create index if not exists store_service_requests_user_idx on public.store_service_requests (store_user_id, requested_at desc);

create or replace function public.generate_store_sr_number()
returns trigger
language plpgsql
as $$
begin
  if nullif(trim(new.sr_number), '') is null then
    new.sr_number := 'SR-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('public.store_sr_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists store_service_requests_number_before_insert on public.store_service_requests;
create trigger store_service_requests_number_before_insert
before insert on public.store_service_requests
for each row execute function public.generate_store_sr_number();

create table if not exists public.store_service_request_items (
  id uuid primary key default gen_random_uuid(),
  service_request_id uuid not null references public.store_service_requests(id) on delete cascade,
  item_id uuid not null references public.inventory_items(id) on delete restrict,
  requested_quantity numeric(14,2) not null check (requested_quantity > 0),
  issued_quantity numeric(14,2) not null default 0 check (issued_quantity >= 0),
  item_note text,
  created_at timestamptz not null default now(),
  unique (service_request_id, item_id),
  check (issued_quantity <= requested_quantity)
);

create index if not exists store_sr_items_request_idx on public.store_service_request_items (service_request_id);
create index if not exists store_sr_items_item_idx on public.store_service_request_items (item_id);

create or replace view public.inventory_item_status as
select
  i.id,
  i.item_code,
  i.item_name,
  i.item_type,
  i.specification,
  i.brand,
  i.model,
  i.unit,
  i.details,
  i.current_stock,
  i.reorder_level,
  case
    when i.current_stock <= 0 then 'Out of Stock'
    when i.reorder_level > 0 and i.current_stock <= i.reorder_level then 'Low Stock'
    else 'In Stock'
  end as stock_status,
  i.is_active,
  i.created_at,
  i.updated_at
from public.inventory_items i;

create or replace function public.store_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists inventory_items_updated_at on public.inventory_items;
create trigger inventory_items_updated_at
before update on public.inventory_items
for each row execute function public.store_touch_updated_at();

drop trigger if exists store_users_updated_at on public.store_users;
create trigger store_users_updated_at
before update on public.store_users
for each row execute function public.store_touch_updated_at();

drop trigger if exists store_service_requests_updated_at on public.store_service_requests;
create trigger store_service_requests_updated_at
before update on public.store_service_requests
for each row execute function public.store_touch_updated_at();

create or replace function public.store_is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active = true
  );
$$;

create or replace function public.store_create_user(
  p_people_profile_id uuid,
  p_login_id text,
  p_password text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.store_is_admin() then
    raise exception 'Not authorized';
  end if;

  if nullif(trim(p_login_id), '') is null or nullif(p_password, '') is null then
    raise exception 'Login ID and password are required';
  end if;

  insert into public.store_users (people_profile_id, login_id, password_hash)
  values (p_people_profile_id, lower(trim(p_login_id)), crypt(p_password, gen_salt('bf')))
  returning id into v_id;

  return v_id;
end;
$$;

create or replace function public.store_login(
  p_login_id text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user public.store_users%rowtype;
  v_token text;
  v_profile public.people_profiles%rowtype;
begin
  select * into v_user
  from public.store_users
  where lower(login_id) = lower(trim(p_login_id))
    and is_active = true
  limit 1;

  if v_user.id is null or crypt(p_password, v_user.password_hash) <> v_user.password_hash then
    raise exception 'Invalid ID or password';
  end if;

  v_token := encode(gen_random_bytes(32), 'hex');

  insert into public.store_sessions (store_user_id, token_hash, expires_at)
  values (v_user.id, encode(digest(v_token, 'sha256'), 'hex'), now() + interval '8 hours');

  if v_user.people_profile_id is not null then
    select * into v_profile
    from public.people_profiles
    where id = v_user.people_profile_id;
  end if;

  return jsonb_build_object(
    'token', v_token,
    'expires_at', now() + interval '8 hours',
    'user_id', v_user.id,
    'profile_id', v_user.people_profile_id,
    'full_name', v_profile.full_name,
    'photo_url', v_profile.photo_url,
    'email', v_profile.email,
    'phone', v_profile.phone,
    'whatsapp', v_profile.whatsapp,
    'designation', v_profile.designation,
    'department', v_profile.department,
    'class_name', v_profile.class_name,
    'section', v_profile.section
  );
end;
$$;

create or replace function public.store_logout(p_token text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.store_sessions
  where token_hash = encode(digest(p_token, 'sha256'), 'hex');
$$;

create or replace function public.store_submit_sr(
  p_token text,
  p_class_name text,
  p_department text,
  p_request_details text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.store_sessions%rowtype;
  v_request public.store_service_requests%rowtype;
  v_item jsonb;
  v_item_id uuid;
  v_qty numeric;
  v_stock numeric;
  v_name text;
  v_count integer := 0;
begin
  select * into v_session
  from public.store_sessions
  where token_hash = encode(digest(p_token, 'sha256'), 'hex')
    and expires_at > now()
  limit 1;

  if v_session.id is null then
    raise exception 'Store session expired. Please login again.';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'At least one item is required';
  end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_item_id := (v_item->>'item_id')::uuid;
    v_qty := (v_item->>'quantity')::numeric;

    if v_qty is null or v_qty <= 0 then
      raise exception 'Invalid item quantity';
    end if;

    select current_stock, item_name into v_stock, v_name
    from public.inventory_items
    where id = v_item_id and is_active = true
    for update;

    if v_stock is null then
      raise exception 'Item not found or inactive';
    end if;

    if v_qty > v_stock then
      raise exception 'Insufficient stock for %', v_name;
    end if;

    v_count := v_count + 1;
  end loop;

  insert into public.store_service_requests (store_user_id, class_name, department, request_details)
  values (v_session.store_user_id, nullif(trim(p_class_name), ''), nullif(trim(p_department), ''), nullif(trim(p_request_details), ''))
  returning * into v_request;

  for v_item in select * from jsonb_array_elements(p_items) loop
    insert into public.store_service_request_items (service_request_id, item_id, requested_quantity, item_note)
    values (
      v_request.id,
      (v_item->>'item_id')::uuid,
      (v_item->>'quantity')::numeric,
      nullif(v_item->>'note', '')
    );
  end loop;

  update public.store_sessions
  set last_seen_at = now()
  where id = v_session.id;

  return jsonb_build_object('id', v_request.id, 'sr_number', v_request.sr_number, 'status', v_request.status);
end;
$$;

create or replace function public.store_admin_process_sr(
  p_request_id uuid,
  p_action text,
  p_issue_items jsonb default '[]'::jsonb,
  p_admin_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request public.store_service_requests%rowtype;
  v_row record;
  v_issue jsonb;
  v_issue_qty numeric;
  v_item_id uuid;
  v_remaining numeric;
  v_stock numeric;
  v_total_requested numeric := 0;
  v_total_issued numeric := 0;
begin
  if not public.store_is_admin() then
    raise exception 'Not authorized';
  end if;

  select * into v_request
  from public.store_service_requests
  where id = p_request_id
  for update;

  if v_request.id is null then
    raise exception 'SR not found';
  end if;

  if lower(p_action) = 'reject' then
    update public.store_service_requests
    set status = 'rejected', admin_note = nullif(trim(p_admin_note), ''), processed_at = now(), processed_by = auth.uid()
    where id = p_request_id;
    return jsonb_build_object('status', 'rejected', 'sr_number', v_request.sr_number);
  end if;

  if lower(p_action) = 'approve' then
    update public.store_service_requests
    set status = 'approved', admin_note = nullif(trim(p_admin_note), ''), processed_at = now(), processed_by = auth.uid()
    where id = p_request_id;
    return jsonb_build_object('status', 'approved', 'sr_number', v_request.sr_number);
  end if;

  if lower(p_action) <> 'issue' then
    raise exception 'Invalid action';
  end if;

  if jsonb_typeof(p_issue_items) <> 'array' then
    raise exception 'Issue quantities must be an array';
  end if;

  for v_issue in select * from jsonb_array_elements(p_issue_items) loop
    v_item_id := (v_issue->>'item_id')::uuid;
    v_issue_qty := coalesce((v_issue->>'quantity')::numeric, 0);

    if v_issue_qty <= 0 then
      continue;
    end if;

    select sri.requested_quantity - sri.issued_quantity, ii.current_stock
      into v_remaining, v_stock
    from public.store_service_request_items sri
    join public.inventory_items ii on ii.id = sri.item_id
    where sri.service_request_id = p_request_id
      and sri.item_id = v_item_id
    for update of sri, ii;

    if v_remaining is null then
      raise exception 'Requested item not found in SR';
    end if;

    if v_issue_qty > v_remaining then
      raise exception 'Issue quantity exceeds remaining requested quantity';
    end if;

    if v_issue_qty > v_stock then
      raise exception 'Insufficient stock while issuing item';
    end if;

    update public.store_service_request_items
    set issued_quantity = issued_quantity + v_issue_qty
    where service_request_id = p_request_id and item_id = v_item_id;

    update public.inventory_items
    set current_stock = current_stock - v_issue_qty
    where id = v_item_id;

    insert into public.inventory_stock_movements (
      item_id, movement_type, quantity, reference_type, reference_id, note, performed_by
    ) values (
      v_item_id, 'issue', v_issue_qty, 'store_service_request', p_request_id,
      nullif(trim(p_admin_note), ''), auth.uid()
    );
  end loop;

  select coalesce(sum(requested_quantity), 0), coalesce(sum(issued_quantity), 0)
    into v_total_requested, v_total_issued
  from public.store_service_request_items
  where service_request_id = p_request_id;

  update public.store_service_requests
  set status = case
      when v_total_issued = 0 then 'approved'
      when v_total_issued >= v_total_requested then 'issued'
      else 'partially_issued'
    end,
    admin_note = nullif(trim(p_admin_note), ''),
    processed_at = now(),
    processed_by = auth.uid()
  where id = p_request_id;

  return jsonb_build_object(
    'status', case when v_total_issued >= v_total_requested then 'issued' when v_total_issued > 0 then 'partially_issued' else 'approved' end,
    'sr_number', v_request.sr_number,
    'requested_quantity', v_total_requested,
    'issued_quantity', v_total_issued
  );
end;
$$;

alter table public.inventory_items enable row level security;
alter table public.inventory_stock_movements enable row level security;
alter table public.store_users enable row level security;
alter table public.store_sessions enable row level security;
alter table public.store_service_requests enable row level security;
alter table public.store_service_request_items enable row level security;

-- Admin users use the authenticated Supabase session. Store users use the RPCs above,
-- so their password/session tables are never directly exposed to the browser.
drop policy if exists inventory_items_admin_select on public.inventory_items;
create policy inventory_items_admin_select on public.inventory_items for select to authenticated using ((select public.store_is_admin()));

drop policy if exists inventory_items_admin_insert on public.inventory_items;
create policy inventory_items_admin_insert on public.inventory_items for insert to authenticated with check ((select public.store_is_admin()));

drop policy if exists inventory_items_admin_update on public.inventory_items;
create policy inventory_items_admin_update on public.inventory_items for update to authenticated using ((select public.store_is_admin())) with check ((select public.store_is_admin()));

drop policy if exists inventory_items_admin_delete on public.inventory_items;
create policy inventory_items_admin_delete on public.inventory_items for delete to authenticated using ((select public.store_is_admin()));

drop policy if exists inventory_stock_movements_admin_all on public.inventory_stock_movements;
create policy inventory_stock_movements_admin_all on public.inventory_stock_movements for all to authenticated using ((select public.store_is_admin())) with check ((select public.store_is_admin()));

drop policy if exists store_service_requests_admin_all on public.store_service_requests;
create policy store_service_requests_admin_all on public.store_service_requests for all to authenticated using ((select public.store_is_admin())) with check ((select public.store_is_admin()));

drop policy if exists store_service_request_items_admin_all on public.store_service_request_items;
create policy store_service_request_items_admin_all on public.store_service_request_items for all to authenticated using ((select public.store_is_admin())) with check ((select public.store_is_admin()));

revoke all on public.store_users from anon, authenticated;
revoke all on public.store_sessions from anon, authenticated;
revoke all on public.inventory_item_status from anon, authenticated;
grant execute on function public.store_login(text,text) to anon, authenticated;
grant execute on function public.store_logout(text) to anon, authenticated;
grant execute on function public.store_submit_sr(text,text,text,text,jsonb) to anon, authenticated;
grant execute on function public.store_create_user(uuid,text,text) to authenticated;
grant execute on function public.store_admin_process_sr(uuid,text,jsonb,text) to authenticated;

comment on table public.inventory_items is 'Master list of store/inventory items. Item code is generated automatically.';
comment on table public.store_service_requests is 'User Service Requests submitted by community members.';
comment on table public.store_service_request_items is 'Items and requested/issued quantities for each SR.';
comment on table public.store_users is 'Store-only user credentials linked to a school people profile. Passwords are stored as bcrypt hashes.';
