-- Final Store Member structure
-- Exact tables requested by the project:
-- staff_members, teacher_members, account_members, other_members
-- Parents, students and committee members are intentionally excluded.

create extension if not exists pgcrypto;

create sequence if not exists public.store_staff_id_seq start 1;
create sequence if not exists public.store_teacher_id_seq start 1;
create sequence if not exists public.store_account_id_seq start 1;
create sequence if not exists public.store_other_id_seq start 1;

-- If the earlier draft migration was already applied, preserve its data by renaming.
do $$
begin
  if to_regclass('public.store_staff_members') is not null and to_regclass('public.staff_members') is null then
    alter table public.store_staff_members rename to staff_members;
  end if;
  if to_regclass('public.store_teacher_members') is not null and to_regclass('public.teacher_members') is null then
    alter table public.store_teacher_members rename to teacher_members;
  end if;
  if to_regclass('public.store_account_members') is not null and to_regclass('public.account_members') is null then
    alter table public.store_account_members rename to account_members;
  end if;
  if to_regclass('public.store_other_members') is not null and to_regclass('public.other_members') is null then
    alter table public.store_other_members rename to other_members;
  end if;
end $$;

create table if not exists public.staff_members (
  id uuid primary key default gen_random_uuid(),
  member_id text unique,
  full_name text not null,
  password_text text not null,
  password_hash text not null,
  designation text,
  department text,
  phone text,
  email text,
  details text,
  access_role text not null default 'staff',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.teacher_members (
  id uuid primary key default gen_random_uuid(),
  member_id text unique,
  full_name text not null,
  password_text text not null,
  password_hash text not null,
  designation text,
  department text,
  subject text,
  qualification text,
  phone text,
  email text,
  details text,
  access_role text not null default 'teacher',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.account_members (
  id uuid primary key default gen_random_uuid(),
  member_id text unique,
  full_name text not null,
  password_text text not null,
  password_hash text not null,
  designation text,
  department text,
  account_role text,
  phone text,
  email text,
  details text,
  access_role text not null default 'accounts',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.other_members (
  id uuid primary key default gen_random_uuid(),
  member_id text unique,
  full_name text not null,
  password_text text not null,
  password_hash text not null,
  designation text,
  department text,
  role_title text,
  phone text,
  email text,
  details text,
  access_role text not null default 'other',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Make sure any pre-existing rows from the draft schema keep their IDs.
update public.staff_members set member_id = 'STID' || lpad(nextval('public.store_staff_id_seq')::text,5,'0') where nullif(trim(member_id),'') is null;
update public.teacher_members set member_id = 'TCID' || lpad(nextval('public.store_teacher_id_seq')::text,5,'0') where nullif(trim(member_id),'') is null;
update public.account_members set member_id = 'ACID' || lpad(nextval('public.store_account_id_seq')::text,5,'0') where nullif(trim(member_id),'') is null;
update public.other_members set member_id = 'OTID' || lpad(nextval('public.store_other_id_seq')::text,5,'0') where nullif(trim(member_id),'') is null;

create or replace function public.store_member_id_trigger()
returns trigger
language plpgsql
as $$
begin
  if nullif(trim(new.member_id),'') is null then
    if tg_table_name = 'staff_members' then
      new.member_id := 'STID' || lpad(nextval('public.store_staff_id_seq')::text,5,'0');
    elsif tg_table_name = 'teacher_members' then
      new.member_id := 'TCID' || lpad(nextval('public.store_teacher_id_seq')::text,5,'0');
    elsif tg_table_name = 'account_members' then
      new.member_id := 'ACID' || lpad(nextval('public.store_account_id_seq')::text,5,'0');
    elsif tg_table_name = 'other_members' then
      new.member_id := 'OTID' || lpad(nextval('public.store_other_id_seq')::text,5,'0');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists staff_members_id_before_insert on public.staff_members;
create trigger staff_members_id_before_insert before insert on public.staff_members for each row execute function public.store_member_id_trigger();
drop trigger if exists teacher_members_id_before_insert on public.teacher_members;
create trigger teacher_members_id_before_insert before insert on public.teacher_members for each row execute function public.store_member_id_trigger();
drop trigger if exists account_members_id_before_insert on public.account_members;
create trigger account_members_id_before_insert before insert on public.account_members for each row execute function public.store_member_id_trigger();
drop trigger if exists other_members_id_before_insert on public.other_members;
create trigger other_members_id_before_insert before insert on public.other_members for each row execute function public.store_member_id_trigger();

-- Admin-only member management RPC.
create or replace function public.store_admin_save_member(
  p_member_type text,
  p_id uuid default null,
  p_full_name text default null,
  p_password text default null,
  p_designation text default null,
  p_department text default null,
  p_subject text default null,
  p_qualification text default null,
  p_account_role text default null,
  p_role_title text default null,
  p_phone text default null,
  p_email text default null,
  p_details text default null,
  p_access_role text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_type text := lower(trim(p_member_type));
  v_member_id text;
  v_password text;
  v_hash text;
  v_role text := coalesce(nullif(trim(p_access_role),''), lower(trim(p_member_type)));
begin
  if not public.store_is_admin() then raise exception 'Not authorized'; end if;
  if v_type not in ('staff','teacher','accounts','other') then raise exception 'Invalid member type'; end if;
  if nullif(trim(p_full_name),'') is null then raise exception 'Name is required'; end if;
  if p_id is null and nullif(trim(p_password),'') is null then raise exception 'Password is required for a new member'; end if;

  if v_type='staff' then
    if p_id is null then
      insert into public.staff_members(full_name,password_text,password_hash,designation,department,phone,email,details,access_role)
      values(trim(p_full_name),p_password,crypt(p_password,gen_salt('bf')),nullif(trim(p_designation),''),nullif(trim(p_department),''),nullif(trim(p_phone),''),nullif(trim(p_email),''),nullif(trim(p_details),''),v_role)
      returning member_id into v_member_id;
    else
      select member_id,password_text into v_member_id,v_password from public.staff_members where id=p_id;
      if v_member_id is null then raise exception 'Staff member not found'; end if;
      update public.staff_members set full_name=trim(p_full_name),password_text=coalesce(nullif(trim(p_password),''),password_text),password_hash=case when nullif(trim(p_password),'') is null then password_hash else crypt(p_password,gen_salt('bf')) end,designation=nullif(trim(p_designation),''),department=nullif(trim(p_department),''),phone=nullif(trim(p_phone),''),email=nullif(trim(p_email),''),details=nullif(trim(p_details),''),access_role=v_role,updated_at=now() where id=p_id;
    end if;
  elsif v_type='teacher' then
    if p_id is null then
      insert into public.teacher_members(full_name,password_text,password_hash,designation,department,subject,qualification,phone,email,details,access_role)
      values(trim(p_full_name),p_password,crypt(p_password,gen_salt('bf')),nullif(trim(p_designation),''),nullif(trim(p_department),''),nullif(trim(p_subject),''),nullif(trim(p_qualification),''),nullif(trim(p_phone),''),nullif(trim(p_email),''),nullif(trim(p_details),''),v_role)
      returning member_id into v_member_id;
    else
      select member_id,password_text into v_member_id,v_password from public.teacher_members where id=p_id;
      if v_member_id is null then raise exception 'Teacher member not found'; end if;
      update public.teacher_members set full_name=trim(p_full_name),password_text=coalesce(nullif(trim(p_password),''),password_text),password_hash=case when nullif(trim(p_password),'') is null then password_hash else crypt(p_password,gen_salt('bf')) end,designation=nullif(trim(p_designation),''),department=nullif(trim(p_department),''),subject=nullif(trim(p_subject),''),qualification=nullif(trim(p_qualification),''),phone=nullif(trim(p_phone),''),email=nullif(trim(p_email),''),details=nullif(trim(p_details),''),access_role=v_role,updated_at=now() where id=p_id;
    end if;
  elsif v_type='accounts' then
    if p_id is null then
      insert into public.account_members(full_name,password_text,password_hash,designation,department,account_role,phone,email,details,access_role)
      values(trim(p_full_name),p_password,crypt(p_password,gen_salt('bf')),nullif(trim(p_designation),''),nullif(trim(p_department),''),nullif(trim(p_account_role),''),nullif(trim(p_phone),''),nullif(trim(p_email),''),nullif(trim(p_details),''),v_role)
      returning member_id into v_member_id;
    else
      select member_id,password_text into v_member_id,v_password from public.account_members where id=p_id;
      if v_member_id is null then raise exception 'Accounts member not found'; end if;
      update public.account_members set full_name=trim(p_full_name),password_text=coalesce(nullif(trim(p_password),''),password_text),password_hash=case when nullif(trim(p_password),'') is null then password_hash else crypt(p_password,gen_salt('bf')) end,designation=nullif(trim(p_designation),''),department=nullif(trim(p_department),''),account_role=nullif(trim(p_account_role),''),phone=nullif(trim(p_phone),''),email=nullif(trim(p_email),''),details=nullif(trim(p_details),''),access_role=v_role,updated_at=now() where id=p_id;
    end if;
  else
    if p_id is null then
      insert into public.other_members(full_name,password_text,password_hash,designation,department,role_title,phone,email,details,access_role)
      values(trim(p_full_name),p_password,crypt(p_password,gen_salt('bf')),nullif(trim(p_designation),''),nullif(trim(p_department),''),nullif(trim(p_role_title),''),nullif(trim(p_phone),''),nullif(trim(p_email),''),nullif(trim(p_details),''),v_role)
      returning member_id into v_member_id;
    else
      select member_id,password_text into v_member_id,v_password from public.other_members where id=p_id;
      if v_member_id is null then raise exception 'Other member not found'; end if;
      update public.other_members set full_name=trim(p_full_name),password_text=coalesce(nullif(trim(p_password),''),password_text),password_hash=case when nullif(trim(p_password),'') is null then password_hash else crypt(p_password,gen_salt('bf')) end,designation=nullif(trim(p_designation),''),department=nullif(trim(p_department),''),role_title=nullif(trim(p_role_title),''),phone=nullif(trim(p_phone),''),email=nullif(trim(p_email),''),details=nullif(trim(p_details),''),access_role=v_role,updated_at=now() where id=p_id;
    end if;
  end if;

  v_password := coalesce(nullif(trim(p_password),''), v_password);
  v_hash := case when nullif(v_password,'') is null then null else crypt(v_password,gen_salt('bf')) end;

  insert into public.store_users(login_id,password_hash,member_type,member_id,access_role,is_active)
  values(v_member_id,v_hash,v_type,v_member_id,v_role,true)
  on conflict (login_id) do update set password_hash=coalesce(excluded.password_hash,public.store_users.password_hash),member_type=excluded.member_type,member_id=excluded.member_id,access_role=excluded.access_role,is_active=true;

  return jsonb_build_object('id',p_id,'member_id',v_member_id,'member_type',v_type,'login_id',v_member_id,'access_role',v_role);
end;
$$;

create or replace function public.store_admin_list_members()
returns table(id uuid,member_id text,member_type text,full_name text,password_text text,designation text,department text,subject text,qualification text,account_role text,role_title text,phone text,email text,details text,access_role text,is_active boolean,created_at timestamptz)
language sql security definer set search_path=''
as $$
 select id,member_id,'staff',full_name,password_text,designation,department,null::text,null::text,null::text,null::text,phone,email,details,access_role,is_active,created_at from public.staff_members
 union all
 select id,member_id,'teacher',full_name,password_text,designation,department,subject,qualification,null::text,null::text,phone,email,details,access_role,is_active,created_at from public.teacher_members
 union all
 select id,member_id,'accounts',full_name,password_text,designation,department,null::text,null::text,account_role,null::text,phone,email,details,access_role,is_active,created_at from public.account_members
 union all
 select id,member_id,'other',full_name,password_text,designation,department,null::text,null::text,null::text,role_title,phone,email,details,access_role,is_active,created_at from public.other_members
 order by created_at desc;
$$;

grant execute on function public.store_admin_save_member(text,uuid,text,text,text,text,text,text,text,text,text,text,text,text) to authenticated;
grant execute on function public.store_admin_list_members() to authenticated;

-- Replace Store login so these four member tables are the source of profile data.
create or replace function public.store_login(p_login_id text,p_password text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare
  v_user public.store_users%rowtype;
  v_token text := encode(gen_random_bytes(32),'hex');
  v_name text; v_designation text; v_department text; v_email text; v_phone text; v_subject text; v_role text;
  v_profile_id uuid;
begin
  select * into v_user from public.store_users where lower(login_id)=lower(trim(p_login_id)) and is_active=true limit 1;
  if v_user.id is null or v_user.password_hash is null or crypt(p_password,v_user.password_hash) <> v_user.password_hash then raise exception 'Invalid ID or password'; end if;

  if v_user.member_type='staff' then select full_name,designation,department,email,phone,access_role into v_name,v_designation,v_department,v_email,v_phone,v_role from public.staff_members where member_id=v_user.member_id and is_active=true;
  elsif v_user.member_type='teacher' then select full_name,designation,department,email,phone,access_role,subject into v_name,v_designation,v_department,v_email,v_phone,v_role,v_subject from public.teacher_members where member_id=v_user.member_id and is_active=true;
  elsif v_user.member_type='accounts' then select full_name,designation,department,email,phone,access_role into v_name,v_designation,v_department,v_email,v_phone,v_role from public.account_members where member_id=v_user.member_id and is_active=true;
  elsif v_user.member_type='other' then select full_name,designation,department,email,phone,access_role into v_name,v_designation,v_department,v_email,v_phone,v_role from public.other_members where member_id=v_user.member_id and is_active=true;
  else
    select id,full_name,designation,department,email,phone,whatsapp,class_name,section into v_profile_id,v_name,v_designation,v_department,v_email,v_phone,v_phone,v_department,v_department from public.people_profiles where id=v_user.profile_id;
  end if;

  if v_name is null then raise exception 'Member profile is inactive or missing'; end if;
  insert into public.store_sessions(token_hash,store_user_id,expires_at,last_seen_at) values(encode(digest(v_token,'sha256'),'hex'),v_user.id,now()+interval '8 hours',now());
  return jsonb_build_object('token',v_token,'user_id',v_user.id,'profile_id',v_profile_id,'full_name',v_name,'designation',v_designation,'department',v_department,'email',v_email,'phone',v_phone,'whatsapp',null,'subject',v_subject,'class_name',null,'section',null,'member_id',v_user.member_id,'access_role',coalesce(v_role,v_user.access_role));
end;
$$;

grant execute on function public.store_login(text,text) to anon,authenticated;
