-- Store security/runtime compatibility fix.
-- Applies after the existing Store member migrations.
--
-- Fixes:
-- 1. pgcrypto functions live in extensions schema on Supabase.
-- 2. Admin member listing must enforce Store Admin authorization.
-- 3. Final member tables need automatic STID/TCID/ACID/OTID generation.
-- 4. Store login must return the actual WhatsApp value and use hashed credentials.
-- 5. Existing Store inventory/SR schema is intentionally untouched.

create extension if not exists pgcrypto;

create sequence if not exists public.store_staff_id_seq start 1;
create sequence if not exists public.store_teacher_id_seq start 1;
create sequence if not exists public.store_account_id_seq start 1;
create sequence if not exists public.store_other_id_seq start 1;

create or replace function public.store_member_id_trigger()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if nullif(trim(new.member_id), '') is null then
    if tg_table_name = 'staff_members' then
      new.member_id := 'STID' || lpad(nextval('public.store_staff_id_seq')::text, 5, '0');
    elsif tg_table_name = 'teacher_members' then
      new.member_id := 'TCID' || lpad(nextval('public.store_teacher_id_seq')::text, 5, '0');
    elsif tg_table_name = 'account_members' then
      new.member_id := 'ACID' || lpad(nextval('public.store_account_id_seq')::text, 5, '0');
    elsif tg_table_name = 'other_members' then
      new.member_id := 'OTID' || lpad(nextval('public.store_other_id_seq')::text, 5, '0');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists staff_members_id_before_insert on public.staff_members;
create trigger staff_members_id_before_insert
before insert on public.staff_members
for each row execute function public.store_member_id_trigger();

drop trigger if exists teacher_members_id_before_insert on public.teacher_members;
create trigger teacher_members_id_before_insert
before insert on public.teacher_members
for each row execute function public.store_member_id_trigger();

drop trigger if exists account_members_id_before_insert on public.account_members;
create trigger account_members_id_before_insert
before insert on public.account_members
for each row execute function public.store_member_id_trigger();

drop trigger if exists other_members_id_before_insert on public.other_members;
create trigger other_members_id_before_insert
before insert on public.other_members
for each row execute function public.store_member_id_trigger();

-- Keep sequences ahead of any existing IDs.
select setval(
  'public.store_staff_id_seq',
  greatest(
    coalesce((select max(substring(member_id from 5)::bigint)
              from public.staff_members
              where member_id ~ '^STID[0-9]+$'), 0),
    1
  ),
  true
);

select setval(
  'public.store_teacher_id_seq',
  greatest(
    coalesce((select max(substring(member_id from 5)::bigint)
              from public.teacher_members
              where member_id ~ '^TCID[0-9]+$'), 0),
    1
  ),
  true
);

select setval(
  'public.store_account_id_seq',
  greatest(
    coalesce((select max(substring(member_id from 5)::bigint)
              from public.account_members
              where member_id ~ '^ACID[0-9]+$'), 0),
    1
  ),
  true
);

select setval(
  'public.store_other_id_seq',
  greatest(
    coalesce((select max(substring(member_id from 5)::bigint)
              from public.other_members
              where member_id ~ '^OTID[0-9]+$'), 0),
    1
  ),
  true
);

-- Existing save/reset functions use crypt()/gen_salt()/gen_random_bytes().
-- Supabase installs pgcrypto under the extensions schema.
alter function public.store_admin_save_member(
  text, uuid, text, text, text, text, text, text, text, text, text, text, text, text
) set search_path = 'extensions, public';

alter function public.store_admin_reset_member_password(text, uuid)
set search_path = 'extensions, public';

-- Admin-only member list. No password field is ever returned.
create or replace function public.store_admin_list_members()
returns table(
  id uuid,
  member_id text,
  member_type text,
  full_name text,
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
language plpgsql
security definer
set search_path = 'public'
as $$
begin
  if not public.store_is_admin() then
    raise exception 'Not authorized';
  end if;

  return query
    select id, member_id, 'staff'::text, full_name, designation, department,
           null::text, null::text, null::text, null::text,
           phone, email, details, access_role, is_active, created_at
    from public.staff_members

    union all

    select id, member_id, 'teacher'::text, full_name, designation, department,
           subject, qualification, null::text, null::text,
           phone, email, details, access_role, is_active, created_at
    from public.teacher_members

    union all

    select id, member_id, 'accounts'::text, full_name, designation, department,
           null::text, null::text, account_role, null::text,
           phone, email, details, access_role, is_active, created_at
    from public.account_members

    union all

    select id, member_id, 'other'::text, full_name, designation, department,
           null::text, null::text, null::text, role_title,
           phone, email, details, access_role, is_active, created_at
    from public.other_members

    order by created_at desc;
end;
$$;

grant execute on function public.store_admin_list_members() to authenticated;

-- Replace Store login with explicitly qualified pgcrypto calls.
create or replace function public.store_login(
  p_login_id text,
  p_password text
)
returns jsonb
language plpgsql
security definer
set search_path = 'public'
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
  v_access_role text;
begin
  select *
  into v_user
  from public.store_users
  where lower(login_id) = lower(trim(p_login_id))
    and is_active = true
  limit 1;

  if v_user.id is null
     or v_user.password_hash is null
     or extensions.crypt(p_password, v_user.password_hash) <> v_user.password_hash then
    raise exception 'Invalid ID or password';
  end if;

  if v_user.member_type = 'staff' then
    select full_name, designation, department, email, phone, whatsapp, access_role
    into v_full_name, v_designation, v_department, v_email, v_phone, v_whatsapp, v_access_role
    from public.staff_members
    where member_id = v_user.member_id
      and is_active = true;

  elsif v_user.member_type = 'teacher' then
    select full_name, designation, department, subject, email, phone, whatsapp, access_role
    into v_full_name, v_designation, v_department, v_subject, v_email, v_phone, v_whatsapp, v_access_role
    from public.teacher_members
    where member_id = v_user.member_id
      and is_active = true;

  elsif v_user.member_type = 'accounts' then
    select full_name, designation, department, account_role, email, phone, whatsapp, access_role
    into v_full_name, v_designation, v_department, v_subject, v_email, v_phone, v_whatsapp, v_access_role
    from public.account_members
    where member_id = v_user.member_id
      and is_active = true;

  elsif v_user.member_type = 'other' then
    select full_name, designation, department, role_title, email, phone, whatsapp, access_role
    into v_full_name, v_designation, v_department, v_subject, v_email, v_phone, v_whatsapp, v_access_role
    from public.other_members
    where member_id = v_user.member_id
      and is_active = true;
  end if;

  if v_full_name is null then
    raise exception 'Store account is inactive or profile is unavailable';
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.store_sessions (
    store_user_id,
    token_hash,
    expires_at
  )
  values (
    v_user.id,
    encode(extensions.digest(v_token, 'sha256'), 'hex'),
    now() + interval '8 hours'
  );

  update public.store_sessions
  set last_seen_at = now()
  where store_user_id = v_user.id
    and expires_at > now();

  return jsonb_build_object(
    'token', v_token,
    'expires_at', now() + interval '8 hours',
    'user_id', v_user.id,
    'profile_id', null,
    'full_name', v_full_name,
    'photo_url', null,
    'email', v_email,
    'phone', v_phone,
    'whatsapp', v_whatsapp,
    'designation', coalesce(v_designation, v_subject),
    'department', v_department,
    'class_name', null,
    'section', null,
    'member_type', v_user.member_type,
    'access_role', coalesce(v_user.access_role, v_access_role)
  );
end;
$$;

grant execute on function public.store_login(text, text) to anon, authenticated;

-- Verify the security-sensitive functions exist with the expected signatures.
do $$
begin
  if to_regprocedure('public.store_is_admin()') is null then
    raise exception 'store_is_admin() is missing';
  end if;
  if to_regprocedure('public.store_admin_list_members()') is null then
    raise exception 'store_admin_list_members() is missing';
  end if;
  if to_regprocedure('public.store_admin_save_member(text,uuid,text,text,text,text,text,text,text,text,text,text,text,text)') is null then
    raise exception 'store_admin_save_member() is missing';
  end if;
  if to_regprocedure('public.store_admin_reset_member_password(text,uuid)') is null then
    raise exception 'store_admin_reset_member_password() is missing';
  end if;
  if to_regprocedure('public.store_login(text,text)') is null then
    raise exception 'store_login() is missing';
  end if;
end $$;
