-- STORE SETUP STEP 4: LOGIN ROLES + VERIFY
-- Run this last. After this step, STID/TCID/ACID credentials work as Store login accounts.

alter table public.store_users add column if not exists member_type text;
alter table public.store_users add column if not exists member_record_id uuid;
alter table public.store_users add column if not exists role_name text;
create unique index if not exists store_users_member_unique_idx on public.store_users(member_type,member_record_id) where member_record_id is not null;

-- Keep the admin-visible password only in the admin-only member tables. store_users stores only a hash.
create or replace function public.store_admin_save_member(p_member_type text,p_id uuid default null,p_full_name text default null,p_password text default null,p_role text default null,p_designation text default null,p_department text default null,p_subject text default null,p_email text default null,p_phone text default null,p_whatsapp text default null,p_nid text default null,p_address text default null,p_joining_date date default null,p_photo_url text default null,p_details jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_id text; v_record uuid; t text:=lower(trim(p_member_type)); v_login uuid;
begin
  if not public.store_is_admin() then raise exception 'Not authorized'; end if;
  if nullif(trim(p_full_name),'') is null then raise exception 'Full name is required'; end if;
  if nullif(trim(p_password),'') is null then raise exception 'Password is required'; end if;
  if p_id is null then
    if t='staff' then v_id:=public.store_generate_member_id('STID','public.store_staff_id_seq'); insert into public.store_staff_members(member_id,full_name,password_text,role,designation,department,email,phone,whatsapp,nid,address,joining_date,photo_url,details) values(v_id,trim(p_full_name),p_password,coalesce(nullif(trim(p_role),''),'Staff'),nullif(trim(p_designation),''),nullif(trim(p_department),''),nullif(trim(p_email),''),nullif(trim(p_phone),''),nullif(trim(p_whatsapp),''),nullif(trim(p_nid),''),nullif(trim(p_address),''),p_joining_date,nullif(trim(p_photo_url),''),coalesce(p_details,'{}')) returning id into v_record;
    elsif t='teacher' then v_id:=public.store_generate_member_id('TCID','public.store_teacher_id_seq'); insert into public.store_teacher_members(member_id,full_name,password_text,role,subject,designation,department,email,phone,whatsapp,nid,address,joining_date,photo_url,details) values(v_id,trim(p_full_name),p_password,coalesce(nullif(trim(p_role),''),'Teacher'),nullif(trim(p_subject),''),nullif(trim(p_designation),''),nullif(trim(p_department),''),nullif(trim(p_email),''),nullif(trim(p_phone),''),nullif(trim(p_whatsapp),''),nullif(trim(p_nid),''),nullif(trim(p_address),''),p_joining_date,nullif(trim(p_photo_url),''),coalesce(p_details,'{}')) returning id into v_record;
    elsif t='accounts' then v_id:=public.store_generate_member_id('ACID','public.store_accounts_id_seq'); insert into public.store_accounts_members(member_id,full_name,password_text,role,designation,department,email,phone,whatsapp,nid,address,joining_date,photo_url,details) values(v_id,trim(p_full_name),p_password,coalesce(nullif(trim(p_role),''),'Accounts'),coalesce(nullif(trim(p_designation),''),'Accounts'),coalesce(nullif(trim(p_department),''),'Accounts'),nullif(trim(p_email),''),nullif(trim(p_phone),''),nullif(trim(p_whatsapp),''),nullif(trim(p_nid),''),nullif(trim(p_address),''),p_joining_date,nullif(trim(p_photo_url),''),coalesce(p_details,'{}')) returning id into v_record;
    else raise exception 'Unsupported member type'; end if;
  else
    v_record:=p_id;
    if t='staff' then update public.store_staff_members set full_name=trim(p_full_name),password_text=p_password,role=coalesce(nullif(trim(p_role),''),'Staff'),designation=nullif(trim(p_designation),''),department=nullif(trim(p_department),''),email=nullif(trim(p_email),''),phone=nullif(trim(p_phone),''),whatsapp=nullif(trim(p_whatsapp),''),nid=nullif(trim(p_nid),''),address=nullif(trim(p_address),''),joining_date=p_joining_date,photo_url=nullif(trim(p_photo_url),''),details=coalesce(p_details,'{}') where id=p_id returning member_id into v_id;
    elsif t='teacher' then update public.store_teacher_members set full_name=trim(p_full_name),password_text=p_password,role=coalesce(nullif(trim(p_role),''),'Teacher'),subject=nullif(trim(p_subject),''),designation=nullif(trim(p_designation),''),department=nullif(trim(p_department),''),email=nullif(trim(p_email),''),phone=nullif(trim(p_phone),''),whatsapp=nullif(trim(p_whatsapp),''),nid=nullif(trim(p_nid),''),address=nullif(trim(p_address),''),joining_date=p_joining_date,photo_url=nullif(trim(p_photo_url),''),details=coalesce(p_details,'{}') where id=p_id returning member_id into v_id;
    elsif t='accounts' then update public.store_accounts_members set full_name=trim(p_full_name),password_text=p_password,role=coalesce(nullif(trim(p_role),''),'Accounts'),designation=nullif(trim(p_designation),''),department=coalesce(nullif(trim(p_department),''),'Accounts'),email=nullif(trim(p_email),''),phone=nullif(trim(p_phone),''),whatsapp=nullif(trim(p_whatsapp),''),nid=nullif(trim(p_nid),''),address=nullif(trim(p_address),''),joining_date=p_joining_date,photo_url=nullif(trim(p_photo_url),''),details=coalesce(p_details,'{}') where id=p_id returning member_id into v_id;
    else raise exception 'Unsupported member type'; end if;
  end if;

  insert into public.store_users(login_id,password_hash,is_active,member_type,member_record_id,role_name)
  values(lower(v_id),crypt(p_password,gen_salt('bf')),true,t,v_record,coalesce(nullif(trim(p_role),''),initcap(t)))
  on conflict (login_id) do update set password_hash=excluded.password_hash,is_active=true,member_type=excluded.member_type,member_record_id=excluded.member_record_id,role_name=excluded.role_name;

  return jsonb_build_object('member_id',v_id,'role',coalesce(nullif(trim(p_role),''),initcap(t)));
end;
$$;

create or replace function public.store_login(p_login_id text,p_password text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user public.store_users%rowtype; v_token text; v_profile public.people_profiles%rowtype; v_name text; v_email text; v_phone text; v_department text; v_designation text; v_class text; v_section text; v_photo text;
begin
  select * into v_user from public.store_users where lower(login_id)=lower(trim(p_login_id)) and is_active=true limit 1;
  if v_user.id is null or crypt(p_password,v_user.password_hash)<>v_user.password_hash then raise exception 'Invalid ID or password'; end if;
  if v_user.people_profile_id is not null then select * into v_profile from public.people_profiles where id=v_user.people_profile_id; v_name:=v_profile.full_name;v_email:=v_profile.email;v_phone:=v_profile.phone;v_department:=v_profile.department;v_designation:=v_profile.designation;v_class:=v_profile.class_name;v_section:=v_profile.section;v_photo:=v_profile.photo_url; end if;
  if v_user.member_type='staff' then select full_name,email,phone,department,designation,photo_url into v_name,v_email,v_phone,v_department,v_designation,v_photo from public.store_staff_members where id=v_user.member_record_id;
  elsif v_user.member_type='teacher' then select full_name,email,phone,department,designation,photo_url into v_name,v_email,v_phone,v_department,v_designation,v_photo from public.store_teacher_members where id=v_user.member_record_id;
  elsif v_user.member_type='accounts' then select full_name,email,phone,department,designation,photo_url into v_name,v_email,v_phone,v_department,v_designation,v_photo from public.store_accounts_members where id=v_user.member_record_id; end if;
  v_token:=encode(gen_random_bytes(32),'hex'); insert into public.store_sessions(store_user_id,token_hash,expires_at) values(v_user.id,encode(digest(v_token,'sha256'),'hex'),now()+interval '8 hours');
  return jsonb_build_object('token',v_token,'expires_at',now()+interval '8 hours','user_id',v_user.id,'profile_id',v_user.people_profile_id,'full_name',v_name,'photo_url',v_photo,'email',v_email,'phone',v_phone,'whatsapp',null,'designation',v_designation,'department',v_department,'class_name',v_class,'section',v_section,'login_id',v_user.login_id,'role',v_user.role_name,'member_type',v_user.member_type);
end;
$$;

-- Final safe verification.
do $$
begin
  if to_regclass('public.inventory_items') is null then raise exception 'STEP 1 failed: inventory_items is missing'; end if;
  if to_regclass('public.store_service_requests') is null then raise exception 'STEP 1 failed: store_service_requests is missing'; end if;
  if to_regclass('public.store_staff_members') is null then raise exception 'STEP 1 failed: store_staff_members is missing'; end if;
  if to_regclass('public.store_teacher_members') is null then raise exception 'STEP 1 failed: store_teacher_members is missing'; end if;
  if to_regclass('public.store_accounts_members') is null then raise exception 'STEP 1 failed: store_accounts_members is missing'; end if;
  if to_regprocedure('public.store_admin_save_item(uuid,text,text,text,text,text,text,text,numeric,numeric)') is null then raise exception 'STEP 2 failed: item RPC is missing'; end if;
  if to_regprocedure('public.store_admin_save_member(text,uuid,text,text,text,text,text,text,text,text,text,text,text,date,text,jsonb)') is null then raise exception 'STEP 2/4 failed: member RPC is missing'; end if;
end $$;

select 'STORE SETUP OK' as status,
to_regclass('public.inventory_items') is not null as inventory_ready,
to_regclass('public.store_service_requests') is not null as sr_ready,
to_regclass('public.store_staff_members') is not null as staff_ready,
to_regclass('public.store_teacher_members') is not null as teacher_ready,
to_regclass('public.store_accounts_members') is not null as accounts_ready,
true as login_roles_ready;
