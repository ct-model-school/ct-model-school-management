-- STORE SETUP STEP 4: FINAL LOGIN ROLES + OTHER MEMBERS + VERIFY
-- Run this LAST. Steps 1-3 must already be successful.

create sequence if not exists public.store_other_id_seq start 1;
create table if not exists public.store_other_members (
  id uuid primary key default gen_random_uuid(),
  member_id text unique not null,
  full_name text not null,
  password_text text not null,
  role text not null default 'Other',
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

create index if not exists store_other_active_idx on public.store_other_members(is_active);

alter table public.store_users add column if not exists member_type text;
alter table public.store_users add column if not exists member_record_id uuid;
alter table public.store_users add column if not exists role_name text;
create unique index if not exists store_users_member_unique_idx on public.store_users(member_type,member_record_id) where member_record_id is not null;

-- Admin list: staff / teacher / accounts / other. Password is returned only through this admin RPC.
create or replace function public.store_admin_list_members(p_member_type text default 'all',p_search text default null)
returns setof jsonb language plpgsql security definer set search_path='' as $$
declare r record; q text:=lower(trim(coalesce(p_search,''))); t text:=lower(trim(p_member_type));
begin
 if not public.store_is_admin() then raise exception 'Not authorized'; end if;
 if t in ('all','staff') then for r in select id,member_id,full_name,password_text,role,designation,department,email,phone,is_active from public.store_staff_members where q='' or lower(member_id||' '||full_name||' '||coalesce(designation,'')||' '||coalesce(department,'')) like '%'||q||'%' order by full_name loop return next jsonb_build_object('member_type','staff','id',r.id,'member_id',r.member_id,'full_name',r.full_name,'password_text',r.password_text,'role',r.role,'designation',r.designation,'department',r.department,'email',r.email,'phone',r.phone,'is_active',r.is_active); end loop; end if;
 if t in ('all','teacher') then for r in select id,member_id,full_name,password_text,role,subject,designation,department,email,phone,is_active from public.store_teacher_members where q='' or lower(member_id||' '||full_name||' '||coalesce(subject,'')||' '||coalesce(designation,'')) like '%'||q||'%' order by full_name loop return next jsonb_build_object('member_type','teacher','id',r.id,'member_id',r.member_id,'full_name',r.full_name,'password_text',r.password_text,'role',r.role,'subject',r.subject,'designation',r.designation,'department',r.department,'email',r.email,'phone',r.phone,'is_active',r.is_active); end loop; end if;
 if t in ('all','accounts') then for r in select id,member_id,full_name,password_text,role,designation,department,email,phone,is_active from public.store_accounts_members where q='' or lower(member_id||' '||full_name||' '||coalesce(designation,'')) like '%'||q||'%' order by full_name loop return next jsonb_build_object('member_type','accounts','id',r.id,'member_id',r.member_id,'full_name',r.full_name,'password_text',r.password_text,'role',r.role,'designation',r.designation,'department',r.department,'email',r.email,'phone',r.phone,'is_active',r.is_active); end loop; end if;
 if t in ('all','other') then for r in select id,member_id,full_name,password_text,role,designation,department,email,phone,is_active from public.store_other_members where q='' or lower(member_id||' '||full_name||' '||coalesce(role,'')||' '||coalesce(department,'')) like '%'||q||'%' order by full_name loop return next jsonb_build_object('member_type','other','id',r.id,'member_id',r.member_id,'full_name',r.full_name,'password_text',r.password_text,'role',r.role,'designation',r.designation,'department',r.department,'email',r.email,'phone',r.phone,'is_active',r.is_active); end loop; end if;
end; $$;

-- Create/update member and automatically create/update the matching login account.
create or replace function public.store_admin_save_member(p_member_type text,p_id uuid default null,p_full_name text default null,p_password text default null,p_role text default null,p_designation text default null,p_department text default null,p_subject text default null,p_email text default null,p_phone text default null,p_whatsapp text default null,p_nid text default null,p_address text default null,p_joining_date date default null,p_photo_url text default null,p_details jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare t text:=lower(trim(p_member_type)); v_id text; v_record uuid; v_role text;
begin
 if not public.store_is_admin() then raise exception 'Not authorized'; end if;
 if nullif(trim(p_full_name),'') is null or nullif(trim(p_password),'') is null then raise exception 'Full name and password are required'; end if;
 v_role:=coalesce(nullif(trim(p_role),''),initcap(t));
 if p_id is null then
  if t='staff' then v_id:=public.store_generate_member_id('STID','public.store_staff_id_seq'); insert into public.store_staff_members(member_id,full_name,password_text,role,designation,department,email,phone,whatsapp,nid,address,joining_date,photo_url,details) values(v_id,trim(p_full_name),p_password,v_role,nullif(trim(p_designation),''),nullif(trim(p_department),''),nullif(trim(p_email),''),nullif(trim(p_phone),''),nullif(trim(p_whatsapp),''),nullif(trim(p_nid),''),nullif(trim(p_address),''),p_joining_date,nullif(trim(p_photo_url),''),coalesce(p_details,'{}')) returning id into v_record;
  elsif t='teacher' then v_id:=public.store_generate_member_id('TCID','public.store_teacher_id_seq'); insert into public.store_teacher_members(member_id,full_name,password_text,role,subject,designation,department,email,phone,whatsapp,nid,address,joining_date,photo_url,details) values(v_id,trim(p_full_name),p_password,v_role,nullif(trim(p_subject),''),nullif(trim(p_designation),''),nullif(trim(p_department),''),nullif(trim(p_email),''),nullif(trim(p_phone),''),nullif(trim(p_whatsapp),''),nullif(trim(p_nid),''),nullif(trim(p_address),''),p_joining_date,nullif(trim(p_photo_url),''),coalesce(p_details,'{}')) returning id into v_record;
  elsif t='accounts' then v_id:=public.store_generate_member_id('ACID','public.store_accounts_id_seq'); insert into public.store_accounts_members(member_id,full_name,password_text,role,designation,department,email,phone,whatsapp,nid,address,joining_date,photo_url,details) values(v_id,trim(p_full_name),p_password,v_role,coalesce(nullif(trim(p_designation),''),'Accounts'),coalesce(nullif(trim(p_department),''),'Accounts'),nullif(trim(p_email),''),nullif(trim(p_phone),''),nullif(trim(p_whatsapp),''),nullif(trim(p_nid),''),nullif(trim(p_address),''),p_joining_date,nullif(trim(p_photo_url),''),coalesce(p_details,'{}')) returning id into v_record;
  elsif t='other' then v_id:=public.store_generate_member_id('OTID','public.store_other_id_seq'); insert into public.store_other_members(member_id,full_name,password_text,role,designation,department,email,phone,whatsapp,nid,address,joining_date,photo_url,details) values(v_id,trim(p_full_name),p_password,v_role,nullif(trim(p_designation),''),nullif(trim(p_department),''),nullif(trim(p_email),''),nullif(trim(p_phone),''),nullif(trim(p_whatsapp),''),nullif(trim(p_nid),''),nullif(trim(p_address),''),p_joining_date,nullif(trim(p_photo_url),''),coalesce(p_details,'{}')) returning id into v_record;
  else raise exception 'Unsupported member type'; end if;
 else
  v_record:=p_id;
  if t='staff' then update public.store_staff_members set full_name=trim(p_full_name),password_text=p_password,role=v_role,designation=nullif(trim(p_designation),''),department=nullif(trim(p_department),''),email=nullif(trim(p_email),''),phone=nullif(trim(p_phone),''),whatsapp=nullif(trim(p_whatsapp),''),nid=nullif(trim(p_nid),''),address=nullif(trim(p_address),''),joining_date=p_joining_date,photo_url=nullif(trim(p_photo_url),''),details=coalesce(p_details,'{}') where id=p_id returning member_id into v_id;
  elsif t='teacher' then update public.store_teacher_members set full_name=trim(p_full_name),password_text=p_password,role=v_role,subject=nullif(trim(p_subject),''),designation=nullif(trim(p_designation),''),department=nullif(trim(p_department),''),email=nullif(trim(p_email),''),phone=nullif(trim(p_phone),''),whatsapp=nullif(trim(p_whatsapp),''),nid=nullif(trim(p_nid),''),address=nullif(trim(p_address),''),joining_date=p_joining_date,photo_url=nullif(trim(p_photo_url),''),details=coalesce(p_details,'{}') where id=p_id returning member_id into v_id;
  elsif t='accounts' then update public.store_accounts_members set full_name=trim(p_full_name),password_text=p_password,role=v_role,designation=nullif(trim(p_designation),''),department=coalesce(nullif(trim(p_department),''),'Accounts'),email=nullif(trim(p_email),''),phone=nullif(trim(p_phone),''),whatsapp=nullif(trim(p_whatsapp),''),nid=nullif(trim(p_nid),''),address=nullif(trim(p_address),''),joining_date=p_joining_date,photo_url=nullif(trim(p_photo_url),''),details=coalesce(p_details,'{}') where id=p_id returning member_id into v_id;
  elsif t='other' then update public.store_other_members set full_name=trim(p_full_name),password_text=p_password,role=v_role,designation=nullif(trim(p_designation),''),department=nullif(trim(p_department),''),email=nullif(trim(p_email),''),phone=nullif(trim(p_phone),''),whatsapp=nullif(trim(p_whatsapp),''),nid=nullif(trim(p_nid),''),address=nullif(trim(p_address),''),joining_date=p_joining_date,photo_url=nullif(trim(p_photo_url),''),details=coalesce(p_details,'{}') where id=p_id returning member_id into v_id;
  else raise exception 'Unsupported member type'; end if;
 end if;
 insert into public.store_users(login_id,password_hash,is_active,member_type,member_record_id,role_name) values(lower(v_id),crypt(p_password,gen_salt('bf')),true,t,v_record,v_role) on conflict(login_id) do update set password_hash=excluded.password_hash,is_active=true,member_type=excluded.member_type,member_record_id=excluded.member_record_id,role_name=excluded.role_name;
 return jsonb_build_object('member_id',v_id,'role',v_role);
end; $$;

create or replace function public.store_admin_remove_member(p_member_type text,p_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare t text:=lower(trim(p_member_type)); v_login text;
begin
 if not public.store_is_admin() then raise exception 'Not authorized'; end if;
 if t='staff' then update public.store_staff_members set is_active=false where id=p_id returning member_id into v_login;
 elsif t='teacher' then update public.store_teacher_members set is_active=false where id=p_id returning member_id into v_login;
 elsif t='accounts' then update public.store_accounts_members set is_active=false where id=p_id returning member_id into v_login;
 elsif t='other' then update public.store_other_members set is_active=false where id=p_id returning member_id into v_login;
 else raise exception 'Unsupported member type'; end if;
 update public.store_users set is_active=false where lower(login_id)=lower(v_login);
end; $$;

create or replace function public.store_login(p_login_id text,p_password text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare u public.store_users%rowtype; tok text; n text; em text; ph text; wa text; dep text; des text; subj text; cls text; sec text; photo text;
begin
 select * into u from public.store_users where lower(login_id)=lower(trim(p_login_id)) and is_active=true limit 1;
 if u.id is null or crypt(p_password,u.password_hash)<>u.password_hash then raise exception 'Invalid ID or password'; end if;
 if u.member_type='staff' then select full_name,email,phone,whatsapp,department,designation,photo_url into n,em,ph,wa,dep,des,photo from public.store_staff_members where id=u.member_record_id;
 elsif u.member_type='teacher' then select full_name,email,phone,whatsapp,department,designation,photo_url into n,em,ph,wa,dep,des,photo from public.store_teacher_members where id=u.member_record_id;
 elsif u.member_type='accounts' then select full_name,email,phone,whatsapp,department,designation,photo_url into n,em,ph,wa,dep,des,photo from public.store_accounts_members where id=u.member_record_id;
 elsif u.member_type='other' then select full_name,email,phone,whatsapp,department,designation,photo_url into n,em,ph,wa,dep,des,photo from public.store_other_members where id=u.member_record_id; end if;
 if u.people_profile_id is not null then select full_name,email,phone,whatsapp,department,designation,class_name,section,photo_url into n,em,ph,wa,dep,des,cls,sec,photo from public.people_profiles where id=u.people_profile_id; end if;
 tok:=encode(gen_random_bytes(32),'hex'); insert into public.store_sessions(store_user_id,token_hash,expires_at) values(u.id,encode(digest(tok,'sha256'),'hex'),now()+interval '8 hours');
 return jsonb_build_object('token',tok,'expires_at',now()+interval '8 hours','user_id',u.id,'profile_id',u.people_profile_id,'full_name',n,'photo_url',photo,'email',em,'phone',ph,'whatsapp',wa,'designation',des,'department',dep,'class_name',cls,'section',sec,'login_id',u.login_id,'role',u.role_name,'member_type',u.member_type);
end; $$;

-- Admin-only member table access.
alter table public.store_other_members enable row level security;
drop policy if exists store_other_admin_policy on public.store_other_members;
create policy store_other_admin_policy on public.store_other_members for all to authenticated using(public.store_is_admin()) with check(public.store_is_admin());

grant execute on function public.store_admin_list_members(text,text) to authenticated;
grant execute on function public.store_admin_save_member(text,uuid,text,text,text,text,text,text,text,text,text,text,text,date,text,jsonb) to authenticated;
grant execute on function public.store_admin_remove_member(text,uuid) to authenticated;
grant execute on function public.store_login(text,text) to anon,authenticated;

create or replace view public.store_inventory_status as
select i.*,case when i.current_stock<=0 then 'Out of Stock' when i.reorder_level>0 and i.current_stock<=i.reorder_level then 'Low Stock' else 'In Stock' end as stock_status from public.inventory_items i;
grant select on public.store_inventory_status to authenticated;

do $$
begin
 if to_regclass('public.inventory_items') is null then raise exception 'STEP 1 failed'; end if;
 if to_regclass('public.store_service_requests') is null then raise exception 'STEP 1 failed'; end if;
 if to_regclass('public.store_staff_members') is null or to_regclass('public.store_teacher_members') is null or to_regclass('public.store_accounts_members') is null or to_regclass('public.store_other_members') is null then raise exception 'Member tables missing'; end if;
 if to_regprocedure('public.store_admin_save_item(uuid,text,text,text,text,text,text,text,numeric,numeric)') is null then raise exception 'STEP 2 item RPC missing'; end if;
end $$;

select 'STORE SETUP OK' as status,true as inventory_ready,true as sr_ready,true as staff_ready,true as teacher_ready,true as accounts_ready,true as other_ready,true as login_roles_ready;
