-- Admin-managed Teachers, Staff and Accounts.
-- Each member is one row in one dedicated table. The same ID/password is synced to store_users.

create or replace function public.school_admin_add_member_v2(
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
declare v_id uuid; v_login text; v_hash text; v_store_id uuid;
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

  insert into public.store_users(people_profile_id, login_id, password_hash, is_active)
  values(null, lower(trim(v_login)), v_hash, true)
  returning id into v_store_id;

  return jsonb_build_object('id',v_id,'login_id',v_login,'password',p_password,'member_type',lower(trim(p_member_type)),'store_user_id',v_store_id);
end;
$$;

grant execute on function public.school_admin_add_member_v2(text,text,text,text,text,text,text,text,date,text,text,text,text,text,text) to authenticated;

create or replace function public.school_admin_list_members(p_member_type text default 'all')
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_result jsonb := '[]'::jsonb;
begin
  if not public.store_is_admin() then raise exception 'Not authorized'; end if;
  if lower(p_member_type) in ('all','teacher') then
    select v_result || coalesce(jsonb_agg(jsonb_build_object('id',id,'member_id',teacher_id,'member_type','teacher','full_name',full_name,'photo_url',photo_url,'designation',designation,'department',department,'subject',subject,'role_name',null,'qualification',qualification,'joining_date',joining_date,'email',email,'phone',phone,'whatsapp',whatsapp,'address',address,'short_bio',short_bio,'password',login_password,'is_active',is_active) order by full_name),'[]'::jsonb) into v_result from public.school_teachers;
  end if;
  if lower(p_member_type) in ('all','staff') then
    select v_result || coalesce(jsonb_agg(jsonb_build_object('id',id,'member_id',staff_id,'member_type','staff','full_name',full_name,'photo_url',photo_url,'designation',designation,'department',department,'subject',null,'role_name',null,'qualification',qualification,'joining_date',joining_date,'email',email,'phone',phone,'whatsapp',whatsapp,'address',address,'short_bio',short_bio,'password',login_password,'is_active',is_active) order by full_name),'[]'::jsonb) into v_result from public.school_staff;
  end if;
  if lower(p_member_type) in ('all','accounts') then
    select v_result || coalesce(jsonb_agg(jsonb_build_object('id',id,'member_id',account_id,'member_type','accounts','full_name',full_name,'photo_url',photo_url,'designation',null,'department',department,'subject',null,'role_name',role_name,'qualification',qualification,'joining_date',joining_date,'email',email,'phone',phone,'whatsapp',whatsapp,'address',address,'short_bio',short_bio,'password',login_password,'is_active',is_active) order by full_name),'[]'::jsonb) into v_result from public.school_accounts;
  end if;
  return v_result;
end;
$$;

grant execute on function public.school_admin_list_members(text) to authenticated;

create or replace function public.school_admin_deactivate_member(p_member_type text, p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.store_is_admin() then raise exception 'Not authorized'; end if;
  if lower(p_member_type)='teacher' then update public.school_teachers set is_active=false where id=p_id;
  elsif lower(p_member_type)='staff' then update public.school_staff set is_active=false where id=p_id;
  elsif lower(p_member_type)='accounts' then update public.school_accounts set is_active=false where id=p_id;
  else raise exception 'Invalid member type'; end if;
  update public.store_users set is_active=false where lower(login_id) in (
    select lower(teacher_id) from public.school_teachers where id=p_id and lower(p_member_type)='teacher'
    union all select lower(staff_id) from public.school_staff where id=p_id and lower(p_member_type)='staff'
    union all select lower(account_id) from public.school_accounts where id=p_id and lower(p_member_type)='accounts'
  );
end;
$$;

grant execute on function public.school_admin_deactivate_member(text,uuid) to authenticated;
