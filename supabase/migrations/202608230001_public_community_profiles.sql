create or replace function public.public_community_profiles()
returns table (
  id uuid,
  category text,
  full_name text,
  photo_url text,
  designation text,
  committee_position text,
  subject text,
  class_name text,
  section text,
  academic_year text,
  exam_name text,
  result_value text,
  scholarship_type text,
  short_description text,
  email text,
  phone text,
  whatsapp text,
  display_order integer
)
language sql
security definer
set search_path = public
as $$
  select p.id, p.category, p.full_name, p.photo_url, p.designation, p.committee_position, p.subject,
         p.class_name, p.section, p.academic_year, p.exam_name, p.result_value, p.scholarship_type,
         p.short_description, p.email, p.phone, p.whatsapp, p.display_order
  from public.people_profiles p
  where p.is_active = true

  union all

  select t.id, 'teacher', t.full_name, t.photo_url, t.designation, null, t.subject,
         null, null, null, null, null, null, null, null, null, null, 0
  from public.teacher_members t
  where t.is_active = true

  union all

  select s.id, 'staff', s.full_name, s.photo_url, s.designation, null, null,
         null, null, null, null, null, null, null, null, null, null, 0
  from public.staff_members s
  where s.is_active = true

  union all

  select a.id, 'accounts', a.full_name, a.photo_url, coalesce(a.designation, a.account_role), null, null,
         null, null, null, null, null, null, null, null, null, null, 0
  from public.account_members a
  where a.is_active = true

  union all

  select o.id, 'other', o.full_name, o.photo_url, coalesce(o.designation, o.role_title), null, null,
         null, null, null, null, null, null, null, null, null, null, 0
  from public.other_members o
  where o.is_active = true;
$$;

grant execute on function public.public_community_profiles() to anon, authenticated;
