alter table public.staff_members
  add column if not exists salary numeric(12,2),
  add column if not exists qualification text,
  add column if not exists qualification_point numeric(8,2),
  add column if not exists grade text,
  add column if not exists institute_name text;

alter table public.teacher_members
  add column if not exists salary numeric(12,2),
  add column if not exists qualification_point numeric(8,2),
  add column if not exists grade text,
  add column if not exists institute_name text;

alter table public.account_members
  add column if not exists salary numeric(12,2),
  add column if not exists qualification_point numeric(8,2),
  add column if not exists grade text,
  add column if not exists institute_name text;

-- Replace the older member-save RPC with the form fields used by the admin UI.
drop function if exists public.store_admin_save_member(text,uuid,text,text,text,text,text,text,text,text,text,text,text,text);

create or replace function public.store_admin_save_member(
  p_member_type text,
  p_id uuid default null,
  p_full_name text default null,
  p_password text default null,
  p_designation text default null,
  p_department text default null,
  p_subject text default null,
  p_qualification text default null,
  p_qualification_point numeric default null,
  p_grade text default null,
  p_institute_name text default null,
  p_salary numeric default null,
  p_account_role text default null,
  p_role_title text default null,
  p_phone text default null,
  p_email text default null,
  p_whatsapp text default null,
  p_nid text default null,
  p_address text default null,
  p_joining_date date default null,
  p_photo_url text default null,
  p_details text default null,
  p_access_role text default null
)
returns jsonb language plpgsql security definer set search_path='extensions, public' as $$
declare
  v_type text := lower(trim(p_member_type));
  v_member_id text;
  v_existing_hash text;
  v_password text := nullif(trim(p_password),'');
  v_role text := coalesce(nullif(trim(p_access_role),''),v_type);
  v_hash text;
begin
  if not public.store_is_admin() then raise exception 'Not authorized'; end if;
  if v_type not in ('staff','teacher','accounts','other') then raise exception 'Invalid member type'; end if;
  if nullif(trim(p_full_name),'') is null then raise exception 'Name is required'; end if;
  if p_id is null and v_password is null then raise exception 'Password is required for a new member'; end if;
  if v_password is not null and length(v_password)<8 then raise exception 'Password must be at least 8 characters'; end if;

  if v_type='staff' then
    if p_id is null then
      insert into public.staff_members(full_name,password_hash,designation,department,phone,email,whatsapp,nid,address,joining_date,photo_url,details,access_role,salary)
      values(trim(p_full_name),crypt(v_password,gen_salt('bf')),nullif(trim(p_designation),''),nullif(trim(p_department),''),nullif(trim(p_phone),''),nullif(trim(p_email),''),nullif(trim(p_whatsapp),''),nullif(trim(p_nid),''),nullif(trim(p_address),''),p_joining_date,nullif(trim(p_photo_url),''),nullif(trim(p_details),''),v_role,p_salary)
      returning member_id,password_hash into v_member_id,v_hash;
    else
      select member_id,password_hash into v_member_id,v_existing_hash from public.staff_members where id=p_id for update;
      if v_member_id is null then raise exception 'Staff member not found'; end if;
      v_hash:=coalesce(case when v_password is not null then crypt(v_password,gen_salt('bf')) end,v_existing_hash);
      update public.staff_members set full_name=trim(p_full_name),password_hash=v_hash,designation=nullif(trim(p_designation),''),department=nullif(trim(p_department),''),phone=nullif(trim(p_phone),''),email=nullif(trim(p_email),''),whatsapp=nullif(trim(p_whatsapp),''),nid=nullif(trim(p_nid),''),address=nullif(trim(p_address),''),joining_date=p_joining_date,photo_url=nullif(trim(p_photo_url),''),details=nullif(trim(p_details),''),access_role=v_role,salary=p_salary,updated_at=now() where id=p_id;
    end if;
  elsif v_type='teacher' then
    if p_id is null then
      insert into public.teacher_members(full_name,password_hash,designation,department,subject,qualification,qualification_point,grade,institute_name,phone,email,whatsapp,nid,address,joining_date,photo_url,details,access_role,salary)
      values(trim(p_full_name),crypt(v_password,gen_salt('bf')),nullif(trim(p_designation),''),nullif(trim(p_department),''),nullif(trim(p_subject),''),nullif(trim(p_qualification),''),p_qualification_point,nullif(trim(p_grade),''),nullif(trim(p_institute_name),''),nullif(trim(p_phone),''),nullif(trim(p_email),''),nullif(trim(p_whatsapp),''),nullif(trim(p_nid),''),nullif(trim(p_address),''),p_joining_date,nullif(trim(p_photo_url),''),nullif(trim(p_details),''),v_role,p_salary)
      returning member_id,password_hash into v_member_id,v_hash;
    else
      select member_id,password_hash into v_member_id,v_existing_hash from public.teacher_members where id=p_id for update;
      if v_member_id is null then raise exception 'Teacher member not found'; end if;
      v_hash:=coalesce(case when v_password is not null then crypt(v_password,gen_salt('bf')) end,v_existing_hash);
      update public.teacher_members set full_name=trim(p_full_name),password_hash=v_hash,designation=nullif(trim(p_designation),''),department=nullif(trim(p_department),''),subject=nullif(trim(p_subject),''),qualification=nullif(trim(p_qualification),''),qualification_point=p_qualification_point,grade=nullif(trim(p_grade),''),institute_name=nullif(trim(p_institute_name),''),phone=nullif(trim(p_phone),''),email=nullif(trim(p_email),''),whatsapp=nullif(trim(p_whatsapp),''),nid=nullif(trim(p_nid),''),address=nullif(trim(p_address),''),joining_date=p_joining_date,photo_url=nullif(trim(p_photo_url),''),details=nullif(trim(p_details),''),access_role=v_role,salary=p_salary,updated_at=now() where id=p_id;
    end if;
  elsif v_type='accounts' then
    if p_id is null then
      insert into public.account_members(full_name,password_hash,designation,department,account_role,qualification,qualification_point,grade,institute_name,phone,email,whatsapp,nid,address,joining_date,photo_url,details,access_role,salary)
      values(trim(p_full_name),crypt(v_password,gen_salt('bf')),nullif(trim(p_designation),''),nullif(trim(p_department),''),nullif(trim(p_account_role),''),nullif(trim(p_qualification),''),p_qualification_point,nullif(trim(p_grade),''),nullif(trim(p_institute_name),''),nullif(trim(p_phone),''),nullif(trim(p_email),''),nullif(trim(p_whatsapp),''),nullif(trim(p_nid),''),nullif(trim(p_address),''),p_joining_date,nullif(trim(p_photo_url),''),nullif(trim(p_details),''),v_role,p_salary)
      returning member_id,password_hash into v_member_id,v_hash;
    else
      select member_id,password_hash into v_member_id,v_existing_hash from public.account_members where id=p_id for update;
      if v_member_id is null then raise exception 'Accounts member not found'; end if;
      v_hash:=coalesce(case when v_password is not null then crypt(v_password,gen_salt('bf')) end,v_existing_hash);
      update public.account_members set full_name=trim(p_full_name),password_hash=v_hash,designation=nullif(trim(p_designation),''),department=nullif(trim(p_department),''),account_role=nullif(trim(p_account_role),''),qualification=nullif(trim(p_qualification),''),qualification_point=p_qualification_point,grade=nullif(trim(p_grade),''),institute_name=nullif(trim(p_institute_name),''),phone=nullif(trim(p_phone),''),email=nullif(trim(p_email),''),whatsapp=nullif(trim(p_whatsapp),''),nid=nullif(trim(p_nid),''),address=nullif(trim(p_address),''),joining_date=p_joining_date,photo_url=nullif(trim(p_photo_url),''),details=nullif(trim(p_details),''),access_role=v_role,salary=p_salary,updated_at=now() where id=p_id;
    end if;
  else
    if p_id is null then
      insert into public.other_members(full_name,password_hash,designation,department,role_title,phone,email,whatsapp,nid,address,joining_date,photo_url,details,access_role)
      values(trim(p_full_name),crypt(v_password,gen_salt('bf')),nullif(trim(p_designation),''),nullif(trim(p_department),''),nullif(trim(p_role_title),''),nullif(trim(p_phone),''),nullif(trim(p_email),''),nullif(trim(p_whatsapp),''),nullif(trim(p_nid),''),nullif(trim(p_address),''),p_joining_date,nullif(trim(p_photo_url),''),nullif(trim(p_details),''),v_role)
      returning member_id,password_hash into v_member_id,v_hash;
    else
      select member_id,password_hash into v_member_id,v_existing_hash from public.other_members where id=p_id for update;
      if v_member_id is null then raise exception 'Other member not found'; end if;
      v_hash:=coalesce(case when v_password is not null then crypt(v_password,gen_salt('bf')) end,v_existing_hash);
      update public.other_members set full_name=trim(p_full_name),password_hash=v_hash,designation=nullif(trim(p_designation),''),department=nullif(trim(p_department),''),role_title=nullif(trim(p_role_title),''),phone=nullif(trim(p_phone),''),email=nullif(trim(p_email),''),whatsapp=nullif(trim(p_whatsapp),''),nid=nullif(trim(p_nid),''),address=nullif(trim(p_address),''),joining_date=p_joining_date,photo_url=nullif(trim(p_photo_url),''),details=nullif(trim(p_details),''),access_role=v_role,updated_at=now() where id=p_id;
    end if;
  end if;

  insert into public.store_users(login_id,password_hash,member_type,member_id,access_role,is_active)
  values(lower(v_member_id),v_hash,v_type,v_member_id,v_role,true)
  on conflict(login_id) do update set password_hash=excluded.password_hash,member_type=excluded.member_type,member_id=excluded.member_id,access_role=excluded.access_role,is_active=true;

  return jsonb_build_object('id',p_id,'member_id',v_member_id,'member_type',v_type,'login_id',v_member_id,'access_role',v_role);
end;
$$;

drop function if exists public.store_admin_list_members();
create or replace function public.store_admin_list_members(p_member_type text default 'all',p_search text default null)
returns table(id uuid,member_id text,member_type text,full_name text,designation text,department text,subject text,qualification text,qualification_point numeric,grade text,institute_name text,account_role text,role_title text,salary numeric,phone text,email text,whatsapp text,nid text,address text,joining_date date,photo_url text,details text,access_role text,is_active boolean,created_at timestamptz)
language plpgsql security definer set search_path='public' as $$
declare q text:=lower(trim(coalesce(p_search,''))); t text:=lower(trim(coalesce(p_member_type,'all')));
begin
 if not public.store_is_admin() then raise exception 'Not authorized'; end if;
 return query
 select s.id,s.member_id,'staff',s.full_name,s.designation,s.department,s.subject,s.qualification,s.qualification_point,s.grade,s.institute_name,s.account_role,s.role_title,s.salary,s.phone,s.email,s.whatsapp,s.nid,s.address,s.joining_date,s.photo_url,s.details,s.access_role,s.is_active,s.created_at from public.staff_members s where (t='all' or t='staff') and (q='' or lower(concat_ws(' ',s.member_id,s.full_name,s.role,s.designation,s.department,s.email,s.phone)) like '%'||q||'%')
 union all
 select x.id,x.member_id,'teacher',x.full_name,x.designation,x.department,x.subject,x.qualification,x.qualification_point,x.grade,x.institute_name,x.account_role,x.role_title,x.salary,x.phone,x.email,x.whatsapp,x.nid,x.address,x.joining_date,x.photo_url,x.details,x.access_role,x.is_active,x.created_at from public.teacher_members x where (t='all' or t='teacher') and (q='' or lower(concat_ws(' ',x.member_id,x.full_name,x.role,x.designation,x.department,x.subject,x.qualification,x.institute_name,x.email,x.phone)) like '%'||q||'%')
 union all
 select a.id,a.member_id,'accounts',a.full_name,a.designation,a.department,a.subject,a.qualification,a.qualification_point,a.grade,a.institute_name,a.account_role,a.role_title,a.salary,a.phone,a.email,a.whatsapp,a.nid,a.address,a.joining_date,a.photo_url,a.details,a.access_role,a.is_active,a.created_at from public.account_members a where (t='all' or t='accounts') and (q='' or lower(concat_ws(' ',a.member_id,a.full_name,a.role,a.account_role,a.designation,a.department,a.qualification,a.institute_name,a.email,a.phone)) like '%'||q||'%')
 union all
 select o.id,o.member_id,'other',o.full_name,o.designation,o.department,o.subject,o.qualification,null::numeric,null::text,null::text,o.account_role,o.role_title,null::numeric,o.phone,o.email,o.whatsapp,o.nid,o.address,o.joining_date,o.photo_url,o.details,o.access_role,o.is_active,o.created_at from public.other_members o where (t='all' or t='other') and (q='' or lower(concat_ws(' ',o.member_id,o.full_name,o.role,o.role_title,o.designation,o.department,o.email,o.phone)) like '%'||q||'%')
 order by created_at desc;
end;
$$;