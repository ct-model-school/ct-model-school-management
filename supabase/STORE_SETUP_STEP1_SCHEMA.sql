-- CT Model School Management
-- STORE SETUP STEP 1: SCHEMA
-- Run only after reviewing all four steps.
-- This step creates the complete Store/SR data foundation and staff/teacher/accounts member tables.

create extension if not exists pgcrypto;

create sequence if not exists public.inventory_item_code_seq start 1;
create sequence if not exists public.store_sr_number_seq start 1;
create sequence if not exists public.store_staff_id_seq start 1;
create sequence if not exists public.store_teacher_id_seq start 1;
create sequence if not exists public.store_accounts_id_seq start 1;

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

create index if not exists inventory_stock_movements_item_idx on public.inventory_stock_movements(item_id, created_at desc);

create table if not exists public.store_users (
  id uuid primary key default gen_random_uuid(),
  people_profile_id uuid references public.people_profiles(id) on delete set null,
  login_id text unique not null,
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists store_users_people_profile_idx on public.store_users(people_profile_id);

create table if not exists public.store_sessions (
  id uuid primary key default gen_random_uuid(),
  store_user_id uuid not null references public.store_users(id) on delete cascade,
  token_hash text unique not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

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

create table if not exists public.store_service_request_items (
  id uuid primary key default gen_random_uuid(),
  service_request_id uuid not null references public.store_service_requests(id) on delete cascade,
  item_id uuid not null references public.inventory_items(id) on delete restrict,
  requested_quantity numeric(14,2) not null check (requested_quantity > 0),
  issued_quantity numeric(14,2) not null default 0 check (issued_quantity >= 0),
  item_note text,
  created_at timestamptz not null default now(),
  unique(service_request_id, item_id),
  check (issued_quantity <= requested_quantity)
);

create table if not exists public.store_staff_members (
  id uuid primary key default gen_random_uuid(),
  member_id text unique not null,
  full_name text not null,
  password_text text not null,
  role text not null default 'Staff',
  designation text,
  department text,
  email text,
  phone text,
  whatsapp text,
  nid text,
  address text,
  joining_date date,
  photo_url text,
  details jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_teacher_members (
  id uuid primary key default gen_random_uuid(),
  member_id text unique not null,
  full_name text not null,
  password_text text not null,
  role text not null default 'Teacher',
  subject text,
  designation text,
  department text,
  email text,
  phone text,
  whatsapp text,
  nid text,
  address text,
  joining_date date,
  photo_url text,
  details jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.store_accounts_members (
  id uuid primary key default gen_random_uuid(),
  member_id text unique not null,
  full_name text not null,
  password_text text not null,
  role text not null default 'Accounts',
  designation text,
  department text default 'Accounts',
  email text,
  phone text,
  whatsapp text,
  nid text,
  address text,
  joining_date date,
  photo_url text,
  details jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists store_staff_active_idx on public.store_staff_members(is_active);
create index if not exists store_teacher_active_idx on public.store_teacher_members(is_active);
create index if not exists store_accounts_active_idx on public.store_accounts_members(is_active);

create or replace function public.store_generate_member_id(p_prefix text, p_sequence text)
returns text
language plpgsql
as $$
declare v_number bigint;
begin
  execute format('select nextval(%L)', p_sequence) into v_number;
  return p_prefix || lpad(v_number::text, 5, '0');
end;
$$;

create or replace function public.store_inventory_code_before_insert()
returns trigger language plpgsql as $$
begin
  if nullif(trim(new.item_code), '') is null then
    new.item_code := 'ITM-' || lpad(nextval('public.inventory_item_code_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists inventory_items_code_before_insert on public.inventory_items;
create trigger inventory_items_code_before_insert before insert on public.inventory_items
for each row execute function public.store_inventory_code_before_insert();

create or replace function public.store_sr_number_before_insert()
returns trigger language plpgsql as $$
begin
  if nullif(trim(new.sr_number), '') is null then
    new.sr_number := 'SR-' || to_char(current_date,'YYYY') || '-' || lpad(nextval('public.store_sr_number_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists store_service_requests_number_before_insert on public.store_service_requests;
create trigger store_service_requests_number_before_insert before insert on public.store_service_requests
for each row execute function public.store_sr_number_before_insert();

create or replace function public.store_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end;
$$;

