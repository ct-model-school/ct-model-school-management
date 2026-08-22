create or replace function public.school_admin_update_member(
  p_member_type text,
  p_id uuid,
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
declare v_login text; v_hash text;
begin
  if not public.store_is_admin() then raise exception 'Not authorized'; end if;
  v_hash := case when nullif(p_password,'') is null then null else crypt(p_password,gen_salt('bf')) end;
  if lower(p_member_type)='teacher' then
    update public.school_teachers set full_name=trim(p_full_name), designation=nullif(trim(p_designation),''), department=nullif(trim(p_department),''), subject=nullif(trim(p_subject),''), qualification=nullif(trim(p_qualification),''), joining_date=p_joining_date, email=nullif(trim(p_email),''), phone=nullif(trim(p_phone),''), whatsapp=nullif(trim(p_whatsapp),''), address=nullif(trim(p_address),''), short_bio=nullif(trim(p_short_bio),''), photo_url=p_photo_url, login_password=coalesce(nullif(p_password,''),login_password), password_hash=coalesce(v_hash,password_hash), updated_at=now() where id=p_id returning teacher_id into v_login;
  elsif lower(p_member_type)='staff' then
    update public.school_staff set full_name=trim(p_full_name), designation=nullif(trim(p_designation),''), department=nullif(trim(p_department),''), qualification=nullif(trim(p_qualification),''), joining_date=p_joining_date, email=nullif(trim(p_email),''), phone=nullif(trim(p_phone),''), whatsapp=nullif(trim(p_whatsapp),''), address=nullif(trim(p_address),''), short_bio=nullif(trim(p_short_bio),''), photo_url=p_photo_url, login_password=coalesce(nullif(p_password,''),login_password), password_hash=coalesce(v_hash,password_hash), updated_at=now() where id=p_id returning staff_id into v_login;
  elsif lower(p_member_type)='accounts' then
    update public.school_accounts set full_name=trim(p_full_name), role_name=coalesce(nullif(trim(p_role_name),''),role_name), department=coalesce(nullif(trim(p_department),''),department), qualification=nullif(trim(p_qualification),''), joining_date=p_joining_date, email=nullif(trim(p_email),''), phone=nullif(trim(p_phone),''), whatsapp=nullif(trim(p_whatsapp),''), address=nullif(trim(p_address),''), short_bio=nullif(trim(p_short_bio),''), photo_url=p_photo_url, login_password=coalesce(nullif(p_password,''),login_password), password_hash=coalesce(v_hash,password_hash), updated_at=now() where id=p_id returning account_id into v_login;
  else raise exception 'Invalid member type'; end if;
  if v_login is null then raise exception 'Member not found'; end if;
  if nullif(p_password,'') is not null then update public.store_users set password_hash=v_hash, is_active=true, updated_at=now() where lower(login_id)=lower(v_login); end if;
  return jsonb_build_object('member_id',v_login);
end;
$$;

grant execute on function public.school_admin_update_member(text,uuid,text,text,text,text,text,text,text,date,text,text,text,text,text,text) to authenticated;
