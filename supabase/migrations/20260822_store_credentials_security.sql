-- Store credential security hardening.
-- Passwords are never stored or returned in plaintext.
-- Admin can create or reset a password and receives the new password once.

alter table public.staff_members alter column password_text drop not null;
alter table public.teacher_members alter column password_text drop not null;
alter table public.account_members alter column password_text drop not null;
alter table public.other_members alter column password_text drop not null;

alter table public.store_staff_members alter column password_text drop not null;
alter table public.store_teacher_members alter column password_text drop not null;
alter table public.store_account_members alter column password_text drop not null;
alter table public.store_other_members alter column password_text drop not null;

update public.staff_members set password_text = null;
update public.teacher_members set password_text = null;
update public.account_members set password_text = null;
update public.other_members set password_text = null;
update public.store_staff_members set password_text = null;
update public.store_teacher_members set password_text = null;
update public.store_account_members set password_text = null;
update public.store_other_members set password_text = null;

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
  v_existing_hash text;
  v_password text := nullif(trim(p_password), '');
  v_role text := coalesce(nullif(trim(p_access_role), ''), v_type);
  v_is_new boolean := p_id is null;
begin
  if not public.store_is_admin() then
    raise exception 'Not authorized';
  end if;
  if v_type not in ('staff','teacher','accounts','other') then
    raise exception 'Invalid member type';
  end if;
  if nullif(trim(p_full_name), '') is null then
    raise exception 'Name is required';
  end if;
  if v_is_new and v_password is null then
    raise exception 'Password is required for a new member';
  end if;
  if v_password is not null and length(v_password) < 8 then
    raise exception 'Password must be at least 8 characters';
  end if;

  if v_type = 'staff' then
    if v_is_new then
      insert into public.staff_members (full_name,password_hash,designation,department,phone,email,details,access_role)
      values (trim(p_full_name), crypt(v_password, gen_salt('bf')), nullif(trim(p_designation),''), nullif(trim(p_department),''), nullif(trim(p_phone),''), nullif(trim(p_email),''), nullif(trim(p_details),''), v_role)
      returning member_id into v_member_id;
    else
      select member_id,password_hash into v_member_id,v_existing_hash from public.staff_members where id=p_id for update;
      if v_member_id is null then raise exception 'Staff member not found'; end if;
      update public.staff_members
      set full_name=trim(p_full_name),
          password_hash=coalesce(case when v_password is not null then crypt(v_password,gen_salt('bf')) end,password_hash),
          designation=nullif(trim(p_designation),''), department=nullif(trim(p_department),''),
          phone=nullif(trim(p_phone),''), email=nullif(trim(p_email),''), details=nullif(trim(p_details),''),
          access_role=v_role, updated_at=now()
      where id=p_id;
    end if;
  elsif v_type = 'teacher' then
    if v_is_new then
      insert into public.teacher_members (full_name,password_hash,designation,department,subject,qualification,phone,email,details,access_role)
      values (trim(p_full_name), crypt(v_password, gen_salt('bf')), nullif(trim(p_designation),''), nullif(trim(p_department),''), nullif(trim(p_subject),''), nullif(trim(p_qualification),''), nullif(trim(p_phone),''), nullif(trim(p_email),''), nullif(trim(p_details),''), v_role)
      returning member_id into v_member_id;
    else
      select member_id,password_hash into v_member_id,v_existing_hash from public.teacher_members where id=p_id for update;
      if v_member_id is null then raise exception 'Teacher member not found'; end if;
      update public.teacher_members
      set full_name=trim(p_full_name),
          password_hash=coalesce(case when v_password is not null then crypt(v_password,gen_salt('bf')) end,password_hash),
          designation=nullif(trim(p_designation),''), department=nullif(trim(p_department),''),
          subject=nullif(trim(p_subject),''), qualification=nullif(trim(p_qualification),''),
          phone=nullif(trim(p_phone),''), email=nullif(trim(p_email),''), details=nullif(trim(p_details),''),
          access_role=v_role, updated_at=now()
      where id=p_id;
    end if;
  elsif v_type = 'accounts' then
    if v_is_new then
      insert into public.account_members (full_name,password_hash,designation,department,account_role,phone,email,details,access_role)
      values (trim(p_full_name), crypt(v_password, gen_salt('bf')), nullif(trim(p_designation),''), nullif(trim(p_department),''), nullif(trim(p_account_role),''), nullif(trim(p_phone),''), nullif(trim(p_email),''), nullif(trim(p_details),''), v_role)
      returning member_id into v_member_id;
    else
      select member_id,password_hash into v_member_id,v_existing_hash from public.account_members where id=p_id for update;
      if v_member_id is null then raise exception 'Accounts member not found'; end if;
      update public.account_members
      set full_name=trim(p_full_name),
          password_hash=coalesce(case when v_password is not null then crypt(v_password,gen_salt('bf')) end,password_hash),
          designation=nullif(trim(p_designation),''), department=nullif(trim(p_department),''),
          account_role=nullif(trim(p_account_role),''), phone=nullif(trim(p_phone),''),
          email=nullif(trim(p_email),''), details=nullif(trim(p_details),''), access_role=v_role, updated_at=now()
      where id=p_id;
    end if;
  else
    if v_is_new then
      insert into public.other_members (full_name,password_hash,designation,department,role_title,phone,email,details,access_role)
      values (trim(p_full_name), crypt(v_password, gen_salt('bf')), nullif(trim(p_designation),''), nullif(trim(p_department),''), nullif(trim(p_role_title),''), nullif(trim(p_phone),''), nullif(trim(p_email),''), nullif(trim(p_details),''), v_role)
      returning member_id into v_member_id;
    else
      select member_id,password_hash into v_member_id,v_existing_hash from public.other_members where id=p_id for update;
      if v_member_id is null then raise exception 'Other member not found'; end if;
      update public.other_members
      set full_name=trim(p_full_name),
          password_hash=coalesce(case when v_password is not null then crypt(v_password,gen_salt('bf')) end,password_hash),
          designation=nullif(trim(p_designation),''), department=nullif(trim(p_department),''),
          role_title=nullif(trim(p_role_title),''), phone=nullif(trim(p_phone),''),
          email=nullif(trim(p_email),''), details=nullif(trim(p_details),''), access_role=v_role, updated_at=now()
      where id=p_id;
    end if;
  end if;

  if v_is_new or v_password is not null then
    insert into public.store_users (login_id,password_hash,member_type,member_id,access_role,is_active)
    values (v_member_id, crypt(v_password,gen_salt('bf')), v_type, v_member_id, v_role, true)
    on conflict (login_id) do update
      set password_hash=excluded.password_hash,
          member_type=excluded.member_type,
          member_id=excluded.member_id,
          access_role=excluded.access_role,
          is_active=true;
  else
    update public.store_users
    set member_type=v_type, member_id=v_member_id, access_role=v_role, is_active=true
    where lower(login_id)=lower(v_member_id);
  end if;

  return jsonb_build_object(
    'id', p_id,
    'member_id', v_member_id,
    'member_type', v_type,
    'login_id', v_member_id,
    'access_role', v_role,
    'password_issued', v_password is not null,
    'password', v_password
  );
end;
$$;

create or replace function public.store_admin_list_members()
returns table(
  id uuid, member_id text, member_type text, full_name text,
  designation text, department text, subject text, qualification text,
  account_role text, role_title text, phone text, email text, details text,
  access_role text, is_active boolean, created_at timestamptz
)
language sql
security definer
set search_path = ''
as $$
  select id,member_id,'staff',full_name,designation,department,null::text,null::text,null::text,null::text,phone,email,details,access_role,is_active,created_at from public.staff_members
  union all
  select id,member_id,'teacher',full_name,designation,department,subject,qualification,null::text,null::text,phone,email,details,access_role,is_active,created_at from public.teacher_members
  union all
  select id,member_id,'accounts',full_name,designation,department,null::text,null::text,account_role,null::text,phone,email,details,access_role,is_active,created_at from public.account_members
  union all
  select id,member_id,'other',full_name,designation,department,null::text,null::text,null::text,role_title,phone,email,details,access_role,is_active,created_at from public.other_members
  order by created_at desc;
$$;

grant execute on function public.store_admin_save_member(text,uuid,text,text,text,text,text,text,text,text,text,text,text,text) to authenticated;
grant execute on function public.store_admin_list_members() to authenticated;

create or replace function public.store_admin_reset_member_password(
  p_member_type text,
  p_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_type text := lower(trim(p_member_type));
  v_member_id text;
  v_password text := substr(encode(gen_random_bytes(12),'hex'),1,12) || '@A';
  v_hash text := crypt(v_password, gen_salt('bf'));
begin
  if not public.store_is_admin() then raise exception 'Not authorized'; end if;
  if v_type='staff' then
    update public.staff_members set password_hash=v_hash, updated_at=now(), is_active=true where id=p_id returning member_id into v_member_id;
  elsif v_type='teacher' then
    update public.teacher_members set password_hash=v_hash, updated_at=now(), is_active=true where id=p_id returning member_id into v_member_id;
  elsif v_type='accounts' then
    update public.account_members set password_hash=v_hash, updated_at=now(), is_active=true where id=p_id returning member_id into v_member_id;
  elsif v_type='other' then
    update public.other_members set password_hash=v_hash, updated_at=now(), is_active=true where id=p_id returning member_id into v_member_id;
  else
    raise exception 'Invalid member type';
  end if;

  if v_member_id is null then raise exception 'Member not found'; end if;

  update public.store_users
  set password_hash=v_hash, is_active=true, member_type=v_type, member_id=v_member_id
  where lower(login_id)=lower(v_member_id);

  return jsonb_build_object('member_id',v_member_id,'password',v_password);
end;
$$;

grant execute on function public.store_admin_reset_member_password(text,uuid) to authenticated;

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
  v_email text;
  v_phone text;
  v_whatsapp text;
  v_class text;
  v_section text;
begin
  select * into v_user
  from public.store_users
  where lower(login_id)=lower(trim(p_login_id)) and is_active=true
  limit 1;

  if v_user.id is null or v_user.password_hash is null or crypt(p_password,v_user.password_hash) <> v_user.password_hash then
    raise exception 'Invalid ID or password';
  end if;

  if v_user.member_type='staff' then
    select full_name,designation,department,email,phone,details into v_full_name,v_designation,v_department,v_email,v_phone,v_whatsapp from public.staff_members where member_id=v_user.member_id and is_active=true;
  elsif v_user.member_type='teacher' then
    select full_name,designation,department,subject,email,phone,details into v_full_name,v_designation,v_department,v_subject,v_email,v_phone,v_whatsapp from public.teacher_members where member_id=v_user.member_id and is_active=true;
  elsif v_user.member_type='accounts' then
    select full_name,designation,department,account_role,email,phone,details into v_full_name,v_designation,v_department,v_subject,v_email,v_phone,v_whatsapp from public.account_members where member_id=v_user.member_id and is_active=true;
  elsif v_user.member_type='other' then
    select full_name,designation,department,role_title,email,phone,details into v_full_name,v_designation,v_department,v_subject,v_email,v_phone,v_whatsapp from public.other_members where member_id=v_user.member_id and is_active=true;
  end if;

  if v_full_name is null then raise exception 'Store account is inactive or profile is unavailable'; end if;

  v_token := encode(gen_random_bytes(32), 'hex');
  insert into public.store_sessions(store_user_id,token_hash,expires_at)
  values(v_user.id,encode(digest(v_token,'sha256'),'hex'),now()+interval '8 hours');

  update public.store_sessions set last_seen_at=now() where store_user_id=v_user.id and expires_at>now();

  return jsonb_build_object(
    'token',v_token,
    'expires_at',now()+interval '8 hours',
    'user_id',v_user.id,
    'profile_id',null,
    'full_name',v_full_name,
    'photo_url',null,
    'email',v_email,
    'phone',v_phone,
    'whatsapp',v_whatsapp,
    'designation',coalesce(v_designation,v_subject),
    'department',v_department,
    'class_name',v_class,
    'section',v_section,
    'member_type',v_user.member_type,
    'access_role',v_user.access_role
  );
end;
$$;

grant execute on function public.store_login(text,text) to anon, authenticated;
