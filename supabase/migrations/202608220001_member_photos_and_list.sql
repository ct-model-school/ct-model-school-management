-- Member photo storage and member list RPC
-- Run this migration against the ct-model-school Supabase project.

insert into storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
values ('member-photos', 'member-photos', true, array['image/*']::text[], 2097152)
on conflict (id) do update
set public = excluded.public,
    allowed_mime_types = excluded.allowed_mime_types,
    file_size_limit = excluded.file_size_limit;

-- Public bucket: images can be displayed directly by the admin UI.
-- Upload/update/delete remain restricted to authenticated users.
drop policy if exists "member_photos_authenticated_insert" on storage.objects;
drop policy if exists "member_photos_authenticated_update" on storage.objects;
drop policy if exists "member_photos_authenticated_delete" on storage.objects;

create policy "member_photos_authenticated_insert"
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'member-photos'
  and (storage.foldername(name))[1] in ('staff', 'teacher', 'accounts', 'other')
  and storage.extension(name) in ('jpg', 'jpeg', 'png', 'webp', 'gif')
);

create policy "member_photos_authenticated_update"
on storage.objects
for update to authenticated
using (
  bucket_id = 'member-photos'
  and (storage.foldername(name))[1] in ('staff', 'teacher', 'accounts', 'other')
)
with check (
  bucket_id = 'member-photos'
  and (storage.foldername(name))[1] in ('staff', 'teacher', 'accounts', 'other')
);

create policy "member_photos_authenticated_delete"
on storage.objects
for delete to authenticated
using (
  bucket_id = 'member-photos'
  and (storage.foldername(name))[1] in ('staff', 'teacher', 'accounts', 'other')
);

-- Keep the admin list RPC aligned with the members UI.
drop function if exists public.store_admin_list_members(text, text);

create or replace function public.store_admin_list_members(
  p_member_type text default 'staff',
  p_search text default null
)
returns setof jsonb
language plpgsql
security definer
set search_path = 'public'
as $$
declare
  r record;
  q text := lower(trim(coalesce(p_search, '')));
  t text := lower(trim(coalesce(p_member_type, 'staff')));
begin
  if not public.store_is_admin() then
    raise exception 'Not authorized';
  end if;

  if t not in ('all', 'staff', 'teacher', 'accounts', 'other') then
    raise exception 'Invalid member type';
  end if;

  if t in ('all', 'staff') then
    for r in
      select id, member_id, full_name, role, designation, department,
             null::text as subject, qualification, qualification_point, grade,
             institute_name, null::text as account_role, role_title, salary,
             phone, email, whatsapp, nid, address, joining_date, photo_url,
             details, is_active, created_at
      from public.staff_members
      where is_active = true
        and (q = '' or lower(concat_ws(' ', member_id, full_name, role, designation, department, qualification, institute_name, email, phone)) like '%' || q || '%')
      order by created_at desc
    loop
      return next jsonb_build_object(
        'member_type','staff','id',r.id,'member_id',r.member_id,'full_name',r.full_name,
        'role',r.role,'designation',r.designation,'department',r.department,'subject',r.subject,
        'qualification',r.qualification,'qualification_point',r.qualification_point,'grade',r.grade,
        'institute_name',r.institute_name,'account_role',r.account_role,'role_title',r.role_title,
        'salary',r.salary,'phone',r.phone,'email',r.email,'whatsapp',r.whatsapp,'nid',r.nid,
        'address',r.address,'joining_date',r.joining_date,'photo_url',r.photo_url,'details',r.details,
        'is_active',r.is_active
      );
    end loop;
  end if;

  if t in ('all', 'teacher') then
    for r in
      select id, member_id, full_name, role, designation, department, subject,
             qualification, qualification_point, grade, institute_name,
             null::text as account_role, role_title, salary, phone, email,
             whatsapp, nid, address, joining_date, photo_url, details,
             is_active, created_at
      from public.teacher_members
      where is_active = true
        and (q = '' or lower(concat_ws(' ', member_id, full_name, role, designation, department, subject, qualification, institute_name, email, phone)) like '%' || q || '%')
      order by created_at desc
    loop
      return next jsonb_build_object(
        'member_type','teacher','id',r.id,'member_id',r.member_id,'full_name',r.full_name,
        'role',r.role,'designation',r.designation,'department',r.department,'subject',r.subject,
        'qualification',r.qualification,'qualification_point',r.qualification_point,'grade',r.grade,
        'institute_name',r.institute_name,'account_role',r.account_role,'role_title',r.role_title,
        'salary',r.salary,'phone',r.phone,'email',r.email,'whatsapp',r.whatsapp,'nid',r.nid,
        'address',r.address,'joining_date',r.joining_date,'photo_url',r.photo_url,'details',r.details,
        'is_active',r.is_active
      );
    end loop;
  end if;

  if t in ('all', 'accounts') then
    for r in
      select id, member_id, full_name, role, designation, department,
             null::text as subject, qualification, qualification_point, grade,
             institute_name, account_role, role_title, salary, phone, email,
             whatsapp, nid, address, joining_date, photo_url, details,
             is_active, created_at
      from public.account_members
      where is_active = true
        and (q = '' or lower(concat_ws(' ', member_id, full_name, role, designation, department, account_role, qualification, institute_name, email, phone)) like '%' || q || '%')
      order by created_at desc
    loop
      return next jsonb_build_object(
        'member_type','accounts','id',r.id,'member_id',r.member_id,'full_name',r.full_name,
        'role',r.role,'designation',r.designation,'department',r.department,'subject',r.subject,
        'qualification',r.qualification,'qualification_point',r.qualification_point,'grade',r.grade,
        'institute_name',r.institute_name,'account_role',r.account_role,'role_title',r.role_title,
        'salary',r.salary,'phone',r.phone,'email',r.email,'whatsapp',r.whatsapp,'nid',r.nid,
        'address',r.address,'joining_date',r.joining_date,'photo_url',r.photo_url,'details',r.details,
        'is_active',r.is_active
      );
    end loop;
  end if;

  if t in ('all', 'other') then
    for r in
      select id, member_id, full_name, role, designation, department,
             null::text as subject, qualification, qualification_point, grade,
             institute_name, null::text as account_role, role_title, salary,
             phone, email, whatsapp, nid, address, joining_date, photo_url,
             details, is_active, created_at
      from public.other_members
      where is_active = true
        and (q = '' or lower(concat_ws(' ', member_id, full_name, role, designation, department, role_title, email, phone)) like '%' || q || '%')
      order by created_at desc
    loop
      return next jsonb_build_object(
        'member_type','other','id',r.id,'member_id',r.member_id,'full_name',r.full_name,
        'role',r.role,'designation',r.designation,'department',r.department,'subject',r.subject,
        'qualification',r.qualification,'qualification_point',r.qualification_point,'grade',r.grade,
        'institute_name',r.institute_name,'account_role',r.account_role,'role_title',r.role_title,
        'salary',r.salary,'phone',r.phone,'email',r.email,'whatsapp',r.whatsapp,'nid',r.nid,
        'address',r.address,'joining_date',r.joining_date,'photo_url',r.photo_url,'details',r.details,
        'is_active',r.is_active
      );
    end loop;
  end if;
end;
$$;

grant execute on function public.store_admin_list_members(text, text) to authenticated;
