-- Run manually in the Supabase SQL editor after 001_school_settings.sql and 002_school_settings_content.sql.
-- Public assets are readable by the public website; only school administrators can upload, replace or delete them.
-- Folder paths are created automatically by Supabase Storage when the first file is uploaded.

insert into storage.buckets (id, name, public)
values ('school-assets', 'school-assets', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read school assets" on storage.objects;
create policy "Public can read school assets"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'school-assets');

drop policy if exists "Administrators can upload school assets" on storage.objects;
create policy "Administrators can upload school assets"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'school-assets'
    and public.is_school_administrator()
  );

drop policy if exists "Administrators can update school assets" on storage.objects;
create policy "Administrators can update school assets"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'school-assets'
    and public.is_school_administrator()
  )
  with check (
    bucket_id = 'school-assets'
    and public.is_school_administrator()
  );

drop policy if exists "Administrators can delete school assets" on storage.objects;
create policy "Administrators can delete school assets"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'school-assets'
    and public.is_school_administrator()
  );

-- Expected logical folders used by Admin Settings:
-- branding/  -> logo and favicon
-- hero/      -> public homepage hero images
-- seo/       -> Open Graph / social sharing images
