-- Fix member creation after pgcrypto was moved to the extensions schema.
-- Keep profile photos public because only the profile picture is public community data.
-- Member documents must use a separate private bucket when document uploads are enabled.

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
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_type text := lower(trim(p_member_type));
  v_member_id text;
  v_existing_hash text;
  v_password text := nullif(trim(p_password), '');
  v_role text := coalesce(nullif(trim(p_access_role), ''), v_type);
  v_hash text;
begin
  if not public.store_is_admin() then raise exception 'Not authorized'; end if;
  if v_type not in ('staff', 'teacher', 'accounts', 'other') then raise exception 'Invalid member type'; end if;
  if nullif(trim(p_full_name), '') is null then raise exception 'Name is required'; end if;
  if p_id is null and v_password is null then raise exception 'Password is required for a new member'; end if;
  if v_password is not null and length(v_password) < 8 then raise exception 'Password must be at least 8 characters'; end if;

  if v_type = 'staff' then
    if p_id is null then
      insert into public.staff_members(full_name,password_hash,designation,department,phone,email,whatsapp,nid,address,joining_date,photo_url,details,access_role,salary)
      values(trim(p_full_name),extensions.crypt(v_password,extensions.gen_salt('bf')),nullif(trim(p_designation),''),nullif(trim(p_department),''),nullif(trim(p_phone),''),nullif(trim(p_email),''),nullif(trim(p_whatsapp),''),nullif(trim(p_nid),''),nullif(trim(p_address),''),p_joining_date,nullif(trim(p_photo_url),''),nullif(trim(p_details),''),v_role,p_salary)
      returning member_id,password_hash into v_member_id,v_hash;
    else
      select member_id,password_hash into v_member_id,v_existing_hash from public.staff_members where id=p_id for update;
      if v_member_id is null then raise exception 'Staff member not found'; end if;
      v_hash := coalesce(case when v_password is not null then extensions.crypt(v_password,extensions.gen_salt('bf')) end,v_existing_hash);
      update public.staff_members set full_name=trim(p_full_name),password_hash=v_hash,designation=nullif(trim(p_designation),''),department=nullif(trim(p_department),''),phone=nullif(trim(p_phone),''),email=nullif(trim(p_email),''),whatsapp=nullif(trim(p_whatsapp),''),nid=nullif(trim(p_nid),''),address=nullif(trim(p_address),''),joining_date=p_joining_date,photo_url=nullif(trim(p_photo_url),''),details=nullif(trim(p_details),''),access_role=v_role,salary=p_salary,updated_at=now() where id=p_id;
    end if;
  elsif v_type = 'teacher' then
    if p_id is null then
      insert into public.teacher_members(full_name,password_hash,designation,department,subject,qualification,qualification_point,grade,institute_name,phone,email,whatsapp,nid,address,joining_date,photo_url,details,access_role,salary)
      values(trim(p_full_name),extensions.crypt(v_password,extensions.gen_salt('bf')),nullif(trim(p_designation),''),nullif(trim(p_department),''),nullif(trim(p_subject),''),nullif(trim(p_qualification),''),p_qualification_point,nullif(trim(p_grade),''),nullif(trim(p_institute_name),''),nullif(trim(p_phone),''),nullif(trim(p_email),''),nullif(trim(p_whatsapp),''),nullif(trim(p_nid),''),nullif(trim(p_address),''),p_joining_date,nullif(trim(p_photo_url),''),nullif(trim(p_details),''),v_role,p_salary)
      returning member_id,password_hash into v_member_id,v_hash;
    else
      select member_id,password_hash into v_member_id,v_existing_hash from public.teacher_members where id=p_id for update;
      if v_member_id is null then raise exception 'Teacher member not found'; end if;
      v_hash := coalesce(case when v_password is not null then extensions.crypt(v_password,extensions.gen_salt('bf')) end,v_existing_hash);
      update public.teacher_members set full_name=trim(p_full_name),password_hash=v_hash,designation=nullif(trim(p_designation),''),department=nullif(trim(p_department),''),subject=nullif(trim(p_subject),''),qualification=nullif(trim(p_qualification),''),qualification_point=p_qualification_point,grade=nullif(trim(p_grade),''),institute_name=nullif(trim(p_institute_name),''),phone=nullif(trim(p_phone),''),email=nullif(trim(p_email),''),whatsapp=nullif(trim(p_whatsapp),''),nid=nullif(trim(p_nid),''),address=nullif(trim(p_address),''),joining_date=p_joining_date,photo_url=nullif(trim(p_photo_url),''),details=nullif(trim(p_details),''),access_role=v_role,salary=p_salary,updated_at=now() where id=p_id;
    end if;
  elsif v_type = 'accounts' then
    if p_id is null then
      insert into public.account_members(full_name,password_hash,designation,department,account_role,qualification,qualification_point,grade,institute_name,phone,email,whatsapp,nid,address,joining_date,photo_url,details,access_role,salary)
      values(trim(p_full_name),extensions.crypt(v_password,extensions.gen_salt('bf')),nullif(trim(p_designation),''),nullif(trim(p_department),''),nullif(trim(p_account_role),''),nullif(trim(p_qualification),''),p_qualification_point,nullif(trim(p_grade),''),nullif(trim(p_institute_name),''),nullif(trim(p_phone),''),nullif(trim(p_email),''),nullif(trim(p_whatsapp),''),nullif(trim(p_nid),''),nullif(trim(p_address),''),p_joining_date,nullif(trim(p_photo_url),''),nullif(trim(p_details),''),v_role,p_salary)
      returning member_id,password_hash into v_member_id,v_hash;
    else
      select member_id,password_hash into v_member_id,v_existing_hash from public.account_members where id=p_id for update;
      if v_member_id is null then raise exception 'Accounts member not found'; end if;
      v_hash := coalesce(case when v_password is not null then extensions.crypt(v_password,extensions.gen_salt('bf')) end,v_existing_hash);
      update public.account_members set full_name=trim(p_full_name),password_hash=v_hash,designation=nullif(trim(p_designation),''),department=nullif(trim(p_department),''),account_role=nullif(trim(p_account_role),''),qualification=nullif(trim(p_qualification),''),qualification_point=p_qualification_point,grade=nullif(trim(p_grade),''),institute_name=nullif(trim(p_institute_name),''),phone=nullif(trim(p_phone),''),email=nullif(trim(p_email),''),whatsapp=nullif(trim(p_whatsapp),''),nid=nullif(trim(p_nid),''),address=nullif(trim(p_address),''),joining_date=p_joining_date,photo_url=nullif(trim(p_photo_url),''),details=nullif(trim(p_details),''),access_role=v_role,salary=p_salary,updated_at=now() where id=p_id;
    end if;
  else
    if p_id is null then
      insert into public.other_members(full_name,password_hash,designation,department,role_title,phone,email,whatsapp,nid,address,joining_date,photo_url,details,access_role)
      values(trim(p_full_name),extensions.crypt(v_password,extensions.gen_salt('bf')),nullif(trim(p_designation),''),nullif(trim(p_department),''),nullif(trim(p_role_title),''),nullif(trim(p_phone),''),nullif(trim(p_email),''),nullif(trim(p_whatsapp),''),nullif(trim(p_nid),''),nullif(trim(p_address),''),p_joining_date,nullif(trim(p_photo_url),''),nullif(trim(p_details),''),v_role)
      returning member_id,password_hash into v_member_id,v_hash;
    else
      select member_id,password_hash into v_member_id,v_existing_hash from public.other_members where id=p_id for update;
      if v_member_id is null then raise exception 'Other member not found'; end if;
      v_hash := coalesce(case when v_password is not null then extensions.crypt(v_password,extensions.gen_salt('bf')) end,v_existing_hash);
      update public.other_members set full_name=trim(p_full_name),password_hash=v_hash,designation=nullif(trim(p_designation),''),department=nullif(trim(p_department),''),role_title=nullif(trim(p_role_title),''),phone=nullif(trim(p_phone),''),email=nullif(trim(p_email),''),whatsapp=nullif(trim(p_whatsapp),''),nid=nullif(trim(p_nid),''),address=nullif(trim(p_address),''),joining_date=p_joining_date,photo_url=nullif(trim(p_photo_url),''),details=nullif(trim(p_details),''),access_role=v_role,updated_at=now() where id=p_id;
    end if;
  end if;

  insert into public.store_users(login_id,password_hash,member_type,member_id,access_role,is_active)
  values(lower(v_member_id),v_hash,v_type,v_member_id,v_role,true)
  on conflict(login_id) do update set password_hash=excluded.password_hash,member_type=excluded.member_type,member_id=excluded.member_id,access_role=excluded.access_role,is_active=true;

  return jsonb_build_object('id',p_id,'member_id',v_member_id,'member_type',v_type,'login_id',v_member_id,'access_role',v_role);
end;
$$;

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('member-photos','member-photos',true,2097152,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=2097152,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

drop policy if exists "Admins can upload member photos" on storage.objects;
create policy "Admins can upload member photos" on storage.objects for insert to authenticated
with check (bucket_id='member-photos' and public.store_is_admin());

drop policy if exists "Admins can update member photos" on storage.objects;
create policy "Admins can update member photos" on storage.objects for update to authenticated
using (bucket_id='member-photos' and public.store_is_admin())
with check (bucket_id='member-photos' and public.store_is_admin());

drop policy if exists "Admins can delete member photos" on storage.objects;
create policy "Admins can delete member photos" on storage.objects for delete to authenticated
using (bucket_id='member-photos' and public.store_is_admin());
