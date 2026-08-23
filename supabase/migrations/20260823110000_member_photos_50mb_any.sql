-- Member photo storage policy update.
-- Keep the member-photos bucket public, allow any MIME type, and raise the
-- per-bucket file size limit to 50 MB. The application still validates the
-- profile-picture picker as an image because it is displayed as a photo.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('member-photos', 'member-photos', true, 52428800, null)
on conflict (id) do update
set public = true,
    file_size_limit = 52428800,
    allowed_mime_types = null;

-- Keep profile-photo uploads restricted to authenticated admins while the
-- bucket itself remains public for community/profile display.
drop policy if exists "Admins can upload member photos" on storage.objects;
create policy "Admins can upload member photos"
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'member-photos'
  and public.store_is_admin()
);

drop policy if exists "Admins can update member photos" on storage.objects;
create policy "Admins can update member photos"
on storage.objects
for update to authenticated
using (
  bucket_id = 'member-photos'
  and public.store_is_admin()
)
with check (
  bucket_id = 'member-photos'
  and public.store_is_admin()
);

drop policy if exists "Admins can delete member photos" on storage.objects;
create policy "Admins can delete member photos"
on storage.objects
for delete to authenticated
using (
  bucket_id = 'member-photos'
  and public.store_is_admin()
);

-- Public read access is required because member profile pictures are public
-- community/profile data.
drop policy if exists "member_photos_public_read" on storage.objects;
create policy "member_photos_public_read"
on storage.objects
for select
using (bucket_id = 'member-photos');
