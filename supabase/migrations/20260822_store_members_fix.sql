-- Fixes credential synchronization for role-specific Store member accounts.
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
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_member_id text;
  v_old_password text;
  v_password text;
  v_store_user_id uuid;
  v_role text;
begin
  if not public.store_is_admin() then raise exception 'Not authorized'; end if;
  if lower(trim(p_member_type)) not in ('staff','teacher','accounts','other') then raise exception 'Invalid member type'; end if;
  if nullif(trim(p_full_name),'') is null then raise exception 'Name is required'; end if;
  if p_id is null and nullif(p_password,'') is null then raise exception 'Password is required for a new member'; end if;
  v_role := coalesce(nullif(trim(p_access_role),''), lower(trim(p_member_type)));

  if lower(p_member_type)='staff' then
    if p_id is null then
      insert into public.store_staff_members(full_name,password_text,password_hash,designation,department,phone,email,details,access_role)
      values(trim(p_full_name),p_password,crypt(p_password,gen_salt('bf')),nullif(trim(p_designation),''),nullif(trim(p_department),''),nullif(trim(p_phone),''),nullif(trim(p_email),''),nullif(trim(p_details),''),v_role)
      returning id,member_id into p_id,v_member_id;
    else
      select member_id,password_text into v_member_id,v_old_password from public.store_staff_members where id=p_id;
      if v_member_id is null then raise exception 'Member not found'; end if;
      v_password:=coalesce(nullif(p_password,''),v_old_password);
      update public.store_staff_members set full_name=trim(p_full_name),password_text=v_password,password_hash=case when nullif(p_password,'') is not null then crypt(p_password,gen_salt('bf')) else password_hash end,designation=nullif(trim(p_designation),''),department=nullif(trim(p_department),''),phone=nullif(trim(p_phone),''),email=nullif(trim(p_email),''),details=nullif(trim(p_details),''),access_role=v_role where id=p_id;
    end if;
  elsif lower(p_member_type)='teacher' then
    if p_id is null then
      insert into public.store_teacher_members(full_name,password_text,password_hash,designation,department,subject,qualification,phone,email,details,access_role)
      values(trim(p_full_name),p_password,crypt(p_password,gen_salt('bf')),nullif(trim(p_designation),''),nullif(trim(p_department),''),nullif(trim(p_subject),''),nullif(trim(p_qualification),''),nullif(trim(p_phone),''),nullif(trim(p_email),''),nullif(trim(p_details),''),v_role)
      returning id,member_id into p_id,v_member_id;
    else
      select member_id,password_text into v_member_id,v_old_password from public.store_teacher_members where id=p_id;
      if v_member_id is null then raise exception 'Member not found'; end if;
      v_password:=coalesce(nullif(p_password,''),v_old_password);
      update public.store_teacher_members set full_name=trim(p_full_name),password_text=v_password,password_hash=case when nullif(p_password,'') is not null then crypt(p_password,gen_salt('bf')) else password_hash end,designation=nullif(trim(p_designation),''),department=nullif(trim(p_department),''),subject=nullif(trim(p_subject),''),qualification=nullif(trim(p_qualification),''),phone=nullif(trim(p_phone),''),email=nullif(trim(p_email),''),details=nullif(trim(p_details),''),access_role=v_role where id=p_id;
    end if;
  elsif lower(p_member_type)='accounts' then
    if p_id is null then
      insert into public.store_account_members(full_name,password_text,password_hash,designation,department,account_role,phone,email,details,access_role)
      values(trim(p_full_name),p_password,crypt(p_password,gen_salt('bf')),nullif(trim(p_designation),''),nullif(trim(p_department),''),nullif(trim(p_account_role),''),nullif(trim(p_phone),''),nullif(trim(p_email),''),nullif(trim(p_details),''),v_role)
      returning id,member_id into p_id,v_member_id;
    else
      select member_id,password_text into v_member_id,v_old_password from public.store_account_members where id=p_id;
      if v_member_id is null then raise exception 'Member not found'; end if;
      v_password:=coalesce(nullif(p_password,''),v_old_password);
      update public.store_account_members set full_name=trim(p_full_name),password_text=v_password,password_hash=case when nullif(p_password,'') is not null then crypt(p_password,gen_salt('bf')) else password_hash end,designation=nullif(trim(p_designation),''),department=nullif(trim(p_department),''),account_role=nullif(trim(p_account_role),''),phone=nullif(trim(p_phone),''),email=nullif(trim(p_email),''),details=nullif(trim(p_details),''),access_role=v_role where id=p_id;
    end if;
  else
    if p_id is null then
      insert into public.store_other_members(full_name,password_text,password_hash,designation,department,role_title,phone,email,details,access_role)
      values(trim(p_full_name),p_password,crypt(p_password,gen_salt('bf')),nullif(trim(p_designation),''),nullif(trim(p_department),''),nullif(trim(p_role_title),''),nullif(trim(p_phone),''),nullif(trim(p_email),''),nullif(trim(p_details),''),v_role)
      returning id,member_id into p_id,v_member_id;
    else
      select member_id,password_text into v_member_id,v_old_password from public.store_other_members where id=p_id;
      if v_member_id is null then raise exception 'Member not found'; end if;
      v_password:=coalesce(nullif(p_password,''),v_old_password);
      update public.store_other_members set full_name=trim(p_full_name),password_text=v_password,password_hash=case when nullif(p_password,'') is not null then crypt(p_password,gen_salt('bf')) else password_hash end,designation=nullif(trim(p_designation),''),department=nullif(trim(p_department),''),role_title=nullif(trim(p_role_title),''),phone=nullif(trim(p_phone),''),email=nullif(trim(p_email),''),details=nullif(trim(p_details),''),access_role=v_role where id=p_id;
    end if;
  end if;

  v_password:=coalesce(nullif(p_password,''),v_old_password);
  select id into v_store_user_id from public.store_users where lower(login_id)=lower(v_member_id) limit 1;
  if v_store_user_id is null then
    insert into public.store_users(login_id,password_hash,member_type,member_id,access_role)
    values(v_member_id,crypt(v_password,gen_salt('bf')),lower(trim(p_member_type)),v_member_id,v_role);
  else
    update public.store_users set password_hash=case when nullif(p_password,'') is not null then crypt(p_password,gen_salt('bf')) else password_hash end,member_type=lower(trim(p_member_type)),member_id=v_member_id,access_role=v_role,is_active=true where id=v_store_user_id;
  end if;

  return jsonb_build_object('id',p_id,'member_id',v_member_id,'member_type',lower(trim(p_member_type)),'login_id',v_member_id,'access_role',v_role);
end;
$$;

grant execute on function public.store_admin_save_member(text,uuid,text,text,text,text,text,text,text,text,text,text,text,text) to authenticated;
