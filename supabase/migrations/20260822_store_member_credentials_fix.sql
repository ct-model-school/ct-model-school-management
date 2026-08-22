-- Store member credential hardening and Admin UI compatibility.
--
-- This migration intentionally does NOT change Inventory or Service Request tables.
-- It replaces the member-save RPC so plaintext passwords are never stored.
-- A newly created/updated password is returned only once to the Admin UI.

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
set search_path = 'public'
as $$
declare
  v_type text := lower(trim(p_member_type));
  v_member_id text;
  v_existing_hash text;
  v_password text := nullif(trim(p_password), '');
  v_role text := coalesce(nullif(trim(p_access_role), ''), v_type);
  v_hash text;
  v_is_new boolean := p_id is null;
begin
  if not public.store_is_admin() then
    raise exception 'Not authorized';
  end if;

  if v_type not in ('staff', 'teacher', 'accounts', 'other') then
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

  -- STAFF
  if v_type = 'staff' then
    if p_id is null then
      insert into public.staff_members (
        full_name, password_text, password_hash,
        designation, department, phone, email, details, access_role
      ) values (
        trim(p_full_name), null, extensions.crypt(v_password, extensions.gen_salt('bf')),
        nullif(trim(p_designation), ''), nullif(trim(p_department), ''),
        nullif(trim(p_phone), ''), nullif(trim(p_email), ''),
        nullif(trim(p_details), ''), v_role
      ) returning member_id, password_hash into v_member_id, v_hash;
    else
      select member_id, password_hash
        into v_member_id, v_existing_hash
      from public.staff_members
      where id = p_id
      for update;

      if v_member_id is null then raise exception 'Staff member not found'; end if;

      v_hash := coalesce(
        case when v_password is not null
             then extensions.crypt(v_password, extensions.gen_salt('bf'))
        end,
        v_existing_hash
      );

      update public.staff_members
      set full_name = trim(p_full_name),
          password_text = null,
          password_hash = v_hash,
          designation = nullif(trim(p_designation), ''),
          department = nullif(trim(p_department), ''),
          phone = nullif(trim(p_phone), ''),
          email = nullif(trim(p_email), ''),
          details = nullif(trim(p_details), ''),
          access_role = v_role,
          updated_at = now()
      where id = p_id;
    end if;

  -- TEACHER
  elsif v_type = 'teacher' then
    if p_id is null then
      insert into public.teacher_members (
        full_name, password_text, password_hash,
        designation, department, subject, qualification,
        phone, email, details, access_role
      ) values (
        trim(p_full_name), null, extensions.crypt(v_password, extensions.gen_salt('bf')),
        nullif(trim(p_designation), ''), nullif(trim(p_department), ''),
        nullif(trim(p_subject), ''), nullif(trim(p_qualification), ''),
        nullif(trim(p_phone), ''), nullif(trim(p_email), ''),
        nullif(trim(p_details), ''), v_role
      ) returning member_id, password_hash into v_member_id, v_hash;
    else
      select member_id, password_hash
        into v_member_id, v_existing_hash
      from public.teacher_members
      where id = p_id
      for update;

      if v_member_id is null then raise exception 'Teacher member not found'; end if;

      v_hash := coalesce(
        case when v_password is not null
             then extensions.crypt(v_password, extensions.gen_salt('bf'))
        end,
        v_existing_hash
      );

      update public.teacher_members
      set full_name = trim(p_full_name),
          password_text = null,
          password_hash = v_hash,
          designation = nullif(trim(p_designation), ''),
          department = nullif(trim(p_department), ''),
          subject = nullif(trim(p_subject), ''),
          qualification = nullif(trim(p_qualification), ''),
          phone = nullif(trim(p_phone), ''),
          email = nullif(trim(p_email), ''),
          details = nullif(trim(p_details), ''),
          access_role = v_role,
          updated_at = now()
      where id = p_id;
    end if;

  -- ACCOUNTS
  elsif v_type = 'accounts' then
    if p_id is null then
      insert into public.account_members (
        full_name, password_text, password_hash,
        designation, department, account_role,
        phone, email, details, access_role
      ) values (
        trim(p_full_name), null, extensions.crypt(v_password, extensions.gen_salt('bf')),
        nullif(trim(p_designation), ''), nullif(trim(p_department), ''),
        nullif(trim(p_account_role), ''),
        nullif(trim(p_phone), ''), nullif(trim(p_email), ''),
        nullif(trim(p_details), ''), v_role
      ) returning member_id, password_hash into v_member_id, v_hash;
    else
      select member_id, password_hash
        into v_member_id, v_existing_hash
      from public.account_members
      where id = p_id
      for update;

      if v_member_id is null then raise exception 'Accounts member not found'; end if;

      v_hash := coalesce(
        case when v_password is not null
             then extensions.crypt(v_password, extensions.gen_salt('bf'))
        end,
        v_existing_hash
      );

      update public.account_members
      set full_name = trim(p_full_name),
          password_text = null,
          password_hash = v_hash,
          designation = nullif(trim(p_designation), ''),
          department = nullif(trim(p_department), ''),
          account_role = nullif(trim(p_account_role), ''),
          phone = nullif(trim(p_phone), ''),
          email = nullif(trim(p_email), ''),
          details = nullif(trim(p_details), ''),
          access_role = v_role,
          updated_at = now()
      where id = p_id;
    end if;

  -- OTHER
  else
    if p_id is null then
      insert into public.other_members (
        full_name, password_text, password_hash,
        designation, department, role_title,
        phone, email, details, access_role
      ) values (
        trim(p_full_name), null, extensions.crypt(v_password, extensions.gen_salt('bf')),
        nullif(trim(p_designation), ''), nullif(trim(p_department), ''),
        nullif(trim(p_role_title), ''),
        nullif(trim(p_phone), ''), nullif(trim(p_email), ''),
        nullif(trim(p_details), ''), v_role
      ) returning member_id, password_hash into v_member_id, v_hash;
    else
      select member_id, password_hash
        into v_member_id, v_existing_hash
      from public.other_members
      where id = p_id
      for update;

      if v_member_id is null then raise exception 'Other member not found'; end if;

      v_hash := coalesce(
        case when v_password is not null
             then extensions.crypt(v_password, extensions.gen_salt('bf'))
        end,
        v_existing_hash
      );

      update public.other_members
      set full_name = trim(p_full_name),
          password_text = null,
          password_hash = v_hash,
          designation = nullif(trim(p_designation), ''),
          department = nullif(trim(p_department), ''),
          role_title = nullif(trim(p_role_title), ''),
          phone = nullif(trim(p_phone), ''),
          email = nullif(trim(p_email), ''),
          details = nullif(trim(p_details), ''),
          access_role = v_role,
          updated_at = now()
      where id = p_id;
    end if;
  end if;

  -- Keep the Store login account synchronized with the member record.
  insert into public.store_users (
    login_id,
    password_hash,
    member_type,
    member_id,
    access_role,
    is_active
  ) values (
    lower(v_member_id),
    v_hash,
    v_type,
    v_member_id,
    v_role,
    true
  )
  on conflict (login_id) do update
  set password_hash = excluded.password_hash,
      member_type = excluded.member_type,
      member_id = excluded.member_id,
      access_role = excluded.access_role,
      is_active = true;

  -- Password is returned only for this Admin operation, never stored plaintext.
  return jsonb_build_object(
    'id', p_id,
    'member_id', v_member_id,
    'member_type', v_type,
    'login_id', v_member_id,
    'access_role', v_role,
    'password', case when v_password is not null then v_password else null end
  );
end;
$$;

revoke all on function public.store_admin_save_member(
  text, uuid, text, text, text, text, text, text, text, text, text, text, text, text
) from public;

grant execute on function public.store_admin_save_member(
  text, uuid, text, text, text, text, text, text, text, text, text, text, text, text
) to authenticated;

-- Existing rows must never retain plaintext credentials.
update public.staff_members set password_text = null where password_text is not null;
update public.teacher_members set password_text = null where password_text is not null;
update public.account_members set password_text = null where password_text is not null;
update public.other_members set password_text = null where password_text is not null;
