-- Final security and sequence pass for Store Members.

select setval('public.store_staff_id_seq', greatest(coalesce((select max(nullif(regexp_replace(member_id,'^STID','') ,'')::bigint) from public.staff_members where member_id ~ '^STID[0-9]+$'),0),1), true);
select setval('public.store_teacher_id_seq', greatest(coalesce((select max(nullif(regexp_replace(member_id,'^TCID','') ,'')::bigint) from public.teacher_members where member_id ~ '^TCID[0-9]+$'),0),1), true);
select setval('public.store_account_id_seq', greatest(coalesce((select max(nullif(regexp_replace(member_id,'^ACID','') ,'')::bigint) from public.account_members where member_id ~ '^ACID[0-9]+$'),0),1), true);
select setval('public.store_other_id_seq', greatest(coalesce((select max(nullif(regexp_replace(member_id,'^OTID','') ,'')::bigint) from public.other_members where member_id ~ '^OTID[0-9]+$'),0),1), true);

create or replace function public.store_admin_list_members()
returns table(id uuid,member_id text,member_type text,full_name text,password_text text,designation text,department text,subject text,qualification text,account_role text,role_title text,phone text,email text,details text,access_role text,is_active boolean,created_at timestamptz)
language plpgsql security definer set search_path=''
as $$
begin
  if not public.store_is_admin() then raise exception 'Not authorized'; end if;
  return query
  select id,member_id,'staff',full_name,password_text,designation,department,null::text,null::text,null::text,null::text,phone,email,details,access_role,is_active,created_at from public.staff_members
  union all
  select id,member_id,'teacher',full_name,password_text,designation,department,subject,qualification,null::text,null::text,phone,email,details,access_role,is_active,created_at from public.teacher_members
  union all
  select id,member_id,'accounts',full_name,password_text,designation,department,null::text,null::text,account_role,null::text,phone,email,details,access_role,is_active,created_at from public.account_members
  union all
  select id,member_id,'other',full_name,password_text,designation,department,null::text,null::text,null::text,role_title,phone,email,details,access_role,is_active,created_at from public.other_members
  order by created_at desc;
end;
$$;

create or replace function public.store_admin_deactivate_member(p_member_type text,p_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare v_member_id text;
begin
  if not public.store_is_admin() then raise exception 'Not authorized'; end if;
  if lower(p_member_type)='staff' then update public.staff_members set is_active=false,updated_at=now() where id=p_id returning member_id into v_member_id;
  elsif lower(p_member_type)='teacher' then update public.teacher_members set is_active=false,updated_at=now() where id=p_id returning member_id into v_member_id;
  elsif lower(p_member_type)='accounts' then update public.account_members set is_active=false,updated_at=now() where id=p_id returning member_id into v_member_id;
  elsif lower(p_member_type)='other' then update public.other_members set is_active=false,updated_at=now() where id=p_id returning member_id into v_member_id;
  else raise exception 'Invalid member type'; end if;
  if v_member_id is null then raise exception 'Member not found'; end if;
  update public.store_users set is_active=false where member_type=lower(p_member_type) and member_id=v_member_id;
end;
$$;

grant execute on function public.store_admin_list_members() to authenticated;
grant execute on function public.store_admin_deactivate_member(text,uuid) to authenticated;
