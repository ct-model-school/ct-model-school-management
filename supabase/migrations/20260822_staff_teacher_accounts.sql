-- Dedicated profile + login tables for school-managed members.
-- Parents, students and committee members remain outside this admin-created member system.

create sequence if not exists public.school_teacher_id_seq start 1;
create sequence if not exists public.school_staff_id_seq start 1;
create sequence if not exists public.school_accounts_id_seq start 1;

create table if not exists public.school_teachers (
  id uuid primary key default gen_random_uuid(),
  teacher_id text unique not null,
  full_name text not null,
  photo_url text,
  designation text,
  subject text,
  department text,
  qualification text,
  joining_date date,
  email text,
  phone text,
  whatsapp text,
  address text,
  short_bio text,
  login_password text not null,
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.school_staff (
  id uuid primary key default gen_random_uuid(),
  staff_id text unique not null,
  full_name text not null,
  photo_url text,
  designation text,
  department text,
  qualification text,
  joining_date date,
  email text,
  phone text,
  whatsapp text,
  address text,
  short_bio text,
  login_password text not null,
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.school_accounts (
  id uuid primary key default gen_random_uuid(),
  account_id text unique not null,
  full_name text not null,
  photo_url text,
  role_name text not null,
  department text not null default 'Accounts',
  qualification text,
  joining_date date,
  email text,
  phone text,
  whatsapp text,
  address text,
  short_bio text,
  login_password text not null,
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.school_member_id_trigger()
returns trigger language plpgsql as $$
begin
  if tg_table_name = 'school_teachers' and nullif(trim(new.teacher_id),'') is null then
    new.teacher_id := 'TCID' || lpad(nextval('public.school_teacher_id_seq')::text,5,'0');
  elsif tg_table_name = 'school_staff' and nullif(trim(new.staff_id),'') is null then
    new.staff_id := 'STID' || lpad(nextval('public.school_staff_id_seq')::text,5,'0');
  elsif tg_table_name = 'school_accounts' and nullif(trim(new.account_id),'') is null then
    new.account_id := 'ACID' || lpad(nextval('public.school_accounts_id_seq')::text,5,'0');
  end if;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists school_teachers_id_before_insert on public.school_teachers;
create trigger school_teachers_id_before_insert before insert on public.school_teachers for each row execute function public.school_member_id_trigger();
drop trigger if exists school_staff_id_before_insert on public.school_staff;
create trigger school_staff_id_before_insert before insert on public.school_staff for each row execute function public.school_member_id_trigger();
drop trigger if exists school_accounts_id_before_insert on public.school_accounts;
create trigger school_accounts_id_before_insert before insert on public.school_accounts for each row execute function public.school_member_id_trigger();

create or replace function public.school_admin_add_member(
  p_member_type text,
  p_full_name text,
  p_password text,
  p_designation text default null,
  p_department text default null,
  p_subject text default null,
  p_role_name text default null,
  p_qualification text default null,
  p_joining_date date default null,
  p_email text default null,
  p_phone text default null,
  p_whatsapp text default null,
  p_address text default null,
  p_short_bio text default null,
  p_photo_url text default null
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_id uuid; v_login text; v_hash text;
begin
  if not public.store_is_admin() then raise exception 'Not authorized'; end if;
  if nullif(trim(p_full_name),'') is null or nullif(p_password,'') is null then raise exception 'Name and password are required'; end if;
  v_hash := crypt(p_password, gen_salt('bf'));
  case lower(trim(p_member_type))
    when 'teacher' then
      insert into public.school_teachers(full_name,designation,subject,department,qualification,joining_date,email,phone,whatsapp,address,short_bio,login_password,password_hash,photo_url)
      values(trim(p_full_name),nullif(trim(p_designation),''),nullif(trim(p_subject),''),nullif(trim(p_department),''),nullif(trim(p_qualification),''),p_joining_date,nullif(trim(p_email),''),nullif(trim(p_phone),''),nullif(trim(p_whatsapp),''),nullif(trim(p_address),''),nullif(trim(p_short_bio),''),p_password,v_hash,p_photo_url)
      returning id,teacher_id into v_id,v_login;
    when 'staff' then
      insert into public.school_staff(full_name,designation,department,qualification,joining_date,email,phone,whatsapp,address,short_bio,login_password,password_hash,photo_url)
      values(trim(p_full_name),nullif(trim(p_designation),''),nullif(trim(p_department),''),nullif(trim(p_qualification),''),p_joining_date,nullif(trim(p_email),''),nullif(trim(p_phone),''),nullif(trim(p_whatsapp),''),nullif(trim(p_address),''),nullif(trim(p_short_bio),''),p_password,v_hash,p_photo_url)
      returning id,staff_id into v_id,v_login;
    when 'accounts' then
      insert into public.school_accounts(full_name,role_name,department,qualification,joining_date,email,phone,whatsapp,address,short_bio,login_password,password_hash,photo_url)
      values(trim(p_full_name),coalesce(nullif(trim(p_role_name),''),'Accounts User'),coalesce(nullif(trim(p_department),''),'Accounts'),nullif(trim(p_qualification),''),p_joining_date,nullif(trim(p_email),''),nullif(trim(p_phone),''),nullif(trim(p_whatsapp),''),nullif(trim(p_address),''),nullif(trim(p_short_bio),''),p_password,v_hash,p_photo_url)
      returning id,account_id into v_id,v_login;
    else raise exception 'Invalid member type';
  end case;
  return jsonb_build_object('id',v_id,'login_id',v_login,'password',p_password,'member_type',lower(trim(p_member_type)));
end;
$$;

grant execute on function public.school_admin_add_member(text,text,text,text,text,text,text,text,date,text,text,text,text,text,text) to authenticated;
