-- CT Model School: People & Achievements permission fix v2
-- Run this once in Supabase SQL Editor.
-- The browser client needs BOTH table grants and RLS policies.

grant usage on schema public to anon, authenticated;
grant select on table public.people_profiles to anon;
grant select, insert, update, delete on table public.people_profiles to authenticated;
grant select on table public.people_master_options to anon;
grant select, insert, update, delete on table public.people_master_options to authenticated;

alter table public.people_profiles enable row level security;
alter table public.people_master_options enable row level security;

drop policy if exists "Public can view active people profiles" on public.people_profiles;
create policy "Public can view active people profiles"
on public.people_profiles for select to anon, authenticated
using (is_active = true);

drop policy if exists "Authenticated users can insert people profiles" on public.people_profiles;
create policy "Authenticated users can insert people profiles"
on public.people_profiles for insert to authenticated
with check (true);

drop policy if exists "Authenticated users can update people profiles" on public.people_profiles;
create policy "Authenticated users can update people profiles"
on public.people_profiles for update to authenticated
using (true) with check (true);

drop policy if exists "Authenticated users can delete people profiles" on public.people_profiles;
create policy "Authenticated users can delete people profiles"
on public.people_profiles for delete to authenticated
using (true);

drop policy if exists "Public can view active people master options" on public.people_master_options;
create policy "Public can view active people master options"
on public.people_master_options for select to anon, authenticated
using (is_active = true);

drop policy if exists "Authenticated users can manage people master options" on public.people_master_options;
create policy "Authenticated users can manage people master options"
on public.people_master_options for all to authenticated
using (true) with check (true);

-- Profile photo bucket access.
drop policy if exists "Public can view school people images" on storage.objects;
create policy "Public can view school people images"
on storage.objects for select to anon, authenticated
using (bucket_id = 'school_people');

drop policy if exists "Authenticated users can manage school people images" on storage.objects;
create policy "Authenticated users can manage school people images"
on storage.objects for all to authenticated
using (bucket_id = 'school_people')
with check (bucket_id = 'school_people');
