-- Store community member accounts
-- Roles intentionally exclude parents, students and committee members.
-- Password text is retained because the Store administrator must be able to
-- retrieve the originally assigned password later. Keep these fields admin-only.

create sequence if not exists public.store_staff_id_seq start 1;
create sequence if not exists public.store_teacher_id_seq start 1;
create sequence if not exists public.store_account_id_seq start 1;
create sequence if not exists public.store_other_id_seq start 1;

create table if not exists public.store_staff_members (
  id uuid primary key default gen_random_uuid(),
  member_id text unique not null,
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

create table if not exists public.store_teacher_members (
  id uuid primary key default gen_random_uuid(),
  member_id text unique not null,
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

create table if not exists public.store_account_members (
  id uuid primary key default gen_random_uuid(),
  member_id text unique not null,
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

create table if not exists public.store_other_members (
  id uuid primary key default gen_random_uuid(),
  member_id text unique not null,
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

create or replace function public.generate_store_member_id()
returns trigger
language plpgsql
as $$
begin
  if tg_table_name = 'store_staff_members' and nullif(trim(new.member_id), '') is null then
    new.member_id := 'STID' || lpad(nextval('public.store_staff_id_seq')::text, 5, '0');
  elsif tg_table_name = 'store_teacher_members' and nullif(trim(new.member_id), '') is null then
    new.member_id := 'TCID' || lpad(nextval('public.store_teacher_id_seq')::text, 5, '0');
  elsif tg_table_name = 'store_account_members' and nullif(trim(new.member_id), '') is null then
    new.member_id := 'ACID' || lpad(nextval('public.store_account_id_seq')::text, 5, '0');
  elsif tg_table_name = 'store_other_members' and nullif(trim(new.member_id), '') is null then
    new.member_id := 'OTID' || lpad(nextval('public.store_other_id_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists store_staff_member_id_before_insert on public.store_staff_members;
create trigger store_staff_member_id_before_insert before insert on public.store_staff_members for each row execute function public.generate_store_member_id();
drop trigger if exists store_teacher_member_id_before_insert on public.store_teacher_members;
create trigger store_teacher_member_id_before_insert before insert on public.store_teacher_members for each row execute function public.generate_store_member_id();
drop trigger if exists store_account_member_id_before_insert on public.store_account_members;
create trigger store_account_member_id_before_insert before insert on public.store_account_members for each row execute function public.generate_store_member_id();
drop trigger if exists store_other_member_id_before_insert on public.store_other_members;
create trigger store_other_member_id_before_insert before insert on public.store_other_members for each row execute function public.generate_store_member_id();

drop trigger if exists store_staff_members_updated_at on public.store_staff_members;
create trigger store_staff_members_updated_at before update on public.store_staff_members for each row execute function public.store_touch_updated_at();
drop trigger if exists store_teacher_members_updated_at on public.store_teacher_members;
create trigger store_teacher_members_updated_at before update on public.store_teacher_members for each row execute function public.store_touch_updated_at();
drop trigger if exists store_account_members_updated_at on public.store_account_members;
create trigger store_account_members_updated_at before update on public.store_account_members for each row execute function public.store_touch_updated_at();
drop trigger if exists store_other_members_updated_at on public.store_other_members;
create trigger store_other_members_updated_at before update on public.store_other_members for each row execute function public.store_touch_updated_at();

alter table public.store_users add column if not exists member_type text;
alter table public.store_users add column if not exists member_id text;
alter table public.store_users add column if not exists access_role text;
create index if not exists store_users_member_idx on public.store_users (member_type, member_id);

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
  v_member_id text;
  v_password text;
  v_hash text;
  v_login_id text;
  v_store_user_id uuid;
  v_role text;
begin
  if not public.store_is_admin() then raise exception 'Not authorized'; end if;
  if lower(trim(p_member_type)) not in ('staff','teacher','accounts','other') then raise exception 'Invalid member type'; end if;
  if nullif(trim(p_full_name), '') is null then raise exception 'Name is required'; end if;
  if p_id is null and nullif(p_password, '') is null then raise exception 'Password is required for a new member'; end if;

  v_role := coalesce(nullif(trim(p_access_role), ''), lower(trim(p_member_type)));

  if lower(p_member_type) = 'staff' then
    if p_id is null then
      insert into public.store_staff_members (full_name,password_text,password_hash,designation,department,phone,email,details,access_role)
      values (trim(p_full_name), p_password, crypt(p_password, gen_salt('bf')), nullif(trim(p_designation),''), nullif(trim(p_department),''), nullif(trim(p_phone),''), nullif(trim(p_email),''), nullif(trim(p_details),''), v_role)
      returning id, member_id into p_id, v_member_id;
    else
      select member_id, password_text into v_member_id, v_password from public.store_staff_members where id=p_id;
      if v_member_id is null then raise exception 'Member not found'; end if;
      v_password := coalesce(nullif(p_password,''), v_password);
      update public.store_staff_members set full_name=trim(p_full_name), password_text=v_password, password_hash=case when nullif(p_password,'') is not null then crypt(p_password,gen_salt('bf')) else password_hash end, designation=nullif(trim(p_designation),''), department=nullif(trim(p_department),''), phone=nullif(trim(p_phone),''), email=nullif(trim(p_email),''), details=nullif(trim(p_details),''), access_role=v_role where id=p_id;
    end if;
  elsif lower(p_member_type) = 'teacher' then
    if p_id is null then
      insert into public.store_teacher_members (full_name,password_text,password_hash,designation,department,subject,qualification,phone,email,details,access_role)
      values (trim(p_full_name), p_password, crypt(p_password, gen_salt('bf')), nullif(trim(p_designation),''), nullif(trim(p_department),''), nullif(trim(p_subject),''), nullif(trim(p_qualification),''), nullif(trim(p_phone),''), nullif(trim(p_email),''), nullif(trim(p_details),''), v_role)
      returning id, member_id into p_id, v_member_id;
    else
      select member_id, password_text into v_member_id, v_password from public.store_teacher_members where id=p_id;
      if v_member_id is null then raise exception 'Member not found'; end if;
      v_password := coalesce(nullif(p_password,''), v_password);
      update public.store_teacher_members set full_name=trim(p_full_name), password_text=v_password, password_hash=case when nullif(p_password,'') is not null then crypt(p_password,gen_salt('bf')) else password_hash end, designation=nullif(trim(p_designation),''), department=nullif(trim(p_department),''), subject=nullif(trim(p_subject),''), qualification=nullif(trim(p_qualification),''), phone=nullif(trim(p_phone),''), email=nullif(trim(p_email),''), details=nullif(trim(p_details),''), access_role=v_role where id=p_id;
    end if;
  elsif lower(p_member_type) = 'accounts' then
    if p_id is null then
      insert into public.store_account_members (full_name,password_text,password_hash,designation,department,account_role,phone,email,details,access_role)
      values (trim(p_full_name), p_password, crypt(p_password, gen_salt('bf')), nullif(trim(p_designation),''), nullif(trim(p_department),''), nullif(trim(p_account_role),''), nullif(trim(p_phone),''), nullif(trim(p_email),''), nullif(trim(p_details),''), v_role)
      returning id, member_id into p_id, v_member_id;
    else
      select member_id, password_text into v_member_id, v_password from public.store_account_members where id=p_id;
      if v_member_id is null then raise exception 'Member not found'; end if;
      v_password := coalesce(nullif(p_password,''), v_password);
      update public.store_account_members set full_name=trim(p_full_name), password_text=v_password, password_hash=case when nullif(p_password,'') is not null then crypt(p_password,gen_salt('bf')) else password_hash end, designation=nullif(trim(p_designation),''), department=nullif(trim(p_department),''), account_role=nullif(trim(p_account_role),''), phone=nullif(trim(p_phone),''), email=nullif(trim(p_email),''), details=nullif(trim(p_details),''), access_role=v_role where id=p_id;
    end if;
  else
    if p_id is null then
      insert into public.store_other_members (full_name,password_text,password_hash,designation,department,role_title,phone,email,details,access_role)
      values (trim(p_full_name), p_password, crypt(p_password, gen_salt('bf')), nullif(trim(p_designation),''), nullif(trim(p_department),''), nullif(trim(p_role_title),''), nullif(trim(p_phone),''), nullif(trim(p_email),''), nullif(trim(p_details),''), v_role)
      returning id, member_id into p_id, v_member_id;
    else
      select member_id, password_text into v_member_id, v_password from public.store_other_members where id=p_id;
      if v_member_id is null then raise exception 'Member not found'; end if;
      v_password := coalesce(nullif(p_password,''), v_password);
      update public.store_other_members set full_name=trim(p_full_name), password_text=v_password, password_hash=case when nullif(p_password,'') is not null then crypt(p_password,gen_salt('bf')) else password_hash end, designation=nullif(trim(p_designation),''), department=nullif(trim(p_department),''), role_title=nullif(trim(p_role_title),''), phone=nullif(trim(p_phone),''), email=nullif(trim(p_email),''), details=nullif(trim(p_details),''), access_role=v_role where id=p_id;
    end if;
  end if;

  v_login_id := v_member_id;
  select id into v_store_user_id from public.store_users where lower(login_id)=lower(v_login_id) limit 1;
  if v_store_user_id is null then
    insert into public.store_users (login_id,password_hash,member_type,member_id,access_role)
    values (v_login_id, v_hash, lower(trim(p_member_type)), v_member_id, v_role)
    returning id into v_store_user_id;
  else
    update public.store_users set password_hash = case when nullif(p_password,'') is not null then crypt(p_password,gen_salt('bf')) else password_hash end, member_type=lower(trim(p_member_type)), member_id=v_member_id, access_role=v_role, is_active=true where id=v_store_user_id;
  end if;

  return jsonb_build_object('id',p_id,'member_id',v_member_id,'member_type',lower(trim(p_member_type)),'login_id',v_login_id,'access_role',v_role);
end;
$$;

create or replace function public.store_admin_list_members()
returns table (
  id uuid,
  member_id text,
  member_type text,
  full_name text,
  password_text text,
  designation text,
  department text,
  subject text,
  qualification text,
  account_role text,
  role_title text,
  phone text,
  email text,
  details text,
  access_role text,
  is_active boolean,
  created_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select id,member_id,'staff',full_name,password_text,designation,department,null::text, null::text, null::text,null::text,phone,email,details,access_role,is_active,created_at from public.store_staff_members
  union all
  select id,member_id,'teacher',full_name,password_text,designation,department,subject,qualification,null::text,null::text,phone,email,details,access_role,is_active,created_at from public.store_teacher_members
  union all
  select id,member_id,'accounts',full_name,password_text,designation,department,null::text,null::text,account_role,null::text,phone,email,details,access_role,is_active,created_at from public.store_account_members
  union all
  select id,member_id,'other',full_name,password_text,designation,department,null::text,null::text,null::text,role_title,phone,email,details,access_role,is_active,created_at from public.store_other_members
  order by created_at desc;
$$;

create or replace function public.store_admin_deactivate_member(p_member_type text, p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.store_is_admin() then raise exception 'Not authorized'; end if;
  if lower(p_member_type)='staff' then update public.store_staff_members set is_active=false where id=p_id;
  elsif lower(p_member_type)='teacher' then update public.store_teacher_members set is_active=false where id=p_id;
  elsif lower(p_member_type)='accounts' then update public.store_account_members set is_active=false where id=p_id;
  elsif lower(p_member_type)='other' then update public.store_other_members set is_active=false where id=p_id;
  else raise exception 'Invalid member type'; end if;
  update public.store_users set is_active=false where member_type=lower(p_member_type) and member_id=(case when lower(p_member_type)='staff' then (select member_id from public.store_staff_members where id=p_id) when lower(p_member_type)='teacher' then (select member_id from public.store_teacher_members where id=p_id) when lower(p_member_type)='accounts' then (select member_id from public.store_account_members where id=p_id) else (select member_id from public.store_other_members where id=p_id) end);
end;
$$;

create or replace function public.store_login(p_login_id text, p_password text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user public.store_users%rowtype;
  v_token text;
  v_full_name text;
  v_designation text;
  v_department text;
  v_subject text;
  v_class text;
  v_section text;
  v_email text;
  v_phone text;
  v_whatsapp text;
  v_member_active boolean;
begin
  select * into v_user from public.store_users where lower(login_id)=lower(trim(p_login_id)) and is_active=true limit 1;
  if v_user.id is null or crypt(p_password,v_user.password_hash) <> v_user.password_hash then raise exception 'Invalid ID or password'; end if;

  if v_user.member_type='staff' then
    select full_name,designation,department,phone,email,is_active into v_full_name,v_designation,v_department,v_phone,v_email,v_member_active from public.store_staff_members where member_id=v_user.member_id;
  elsif v_user.member_type='teacher' then
    select full_name,designation,department,subject,phone,email,is_active into v_full_name,v_designation,v_department,v_subject,v_phone,v_email,v_member_active from public.store_teacher_members where member_id=v_user.member_id;
  elsif v_user.member_type='accounts' then
    select full_name,designation,department,phone,email,is_active into v_full_name,v_designation,v_department,v_phone,v_email,v_member_active from public.store_account_members where member_id=v_user.member_id;
  elsif v_user.member_type='other' then
    select full_name,designation,department,phone,email,is_active into v_full_name,v_designation,v_department,v_phone,v_email,v_member_active from public.store_other_members where member_id=v_user.member_id;
  elsif v_user.people_profile_id is not null then
    select full_name,designation,department,email,phone,is_active,class_name,section into v_full_name,v_designation,v_department,v_email,v_phone,v_member_active,v_class,v_section from public.people_profiles where id=v_user.people_profile_id;
  end if;

  if coalesce(v_member_active,false)=false then raise exception 'This Store account is inactive'; end if;
  v_token := encode(gen_random_bytes(32),'hex');
  insert into public.store_sessions(store_user_id,token_hash,expires_at) values(v_user.id,encode(digest(v_token,'sha256'),'hex'),now()+interval '8 hours');
  return jsonb_build_object('token',v_token,'expires_at',now()+interval '8 hours','user_id',v_user.id,'profile_id',v_user.people_profile_id,'member_id',v_user.member_id,'member_type',v_user.member_type,'access_role',v_user.access_role,'full_name',v_full_name,'email',v_email,'phone',v_phone,'whatsapp',v_whatsapp,'designation',v_designation,'department',v_department,'subject',v_subject,'class_name',v_class,'section',v_section);
end;
$$;

grant execute on function public.store_admin_save_member(text,uuid,text,text,text,text,text,text,text,text,text,text,text,text) to authenticated;
grant execute on function public.store_admin_list_members() to authenticated;
grant execute on function public.store_admin_deactivate_member(text,uuid) to authenticated;
grant execute on function public.store_login(text,text) to anon, authenticated;
