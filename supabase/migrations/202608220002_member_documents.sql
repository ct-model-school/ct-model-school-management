-- Member profile / qualification certificate / NID document storage.
-- Apply after 202608220001_member_photos_and_list.sql.

update storage.buckets
set allowed_mime_types = array[
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'
]::text[],
file_size_limit = 5242880
where id = 'member-photos';

create table if not exists public.member_documents (
  id uuid primary key default gen_random_uuid(),
  member_id text not null,
  member_type text not null check (member_type in ('staff','teacher','accounts','other')),
  document_type text not null check (document_type in ('qualification_certificate','nid_front','nid_back')),
  file_url text not null,
  storage_path text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (member_id, document_type)
);

alter table public.member_documents enable row level security;

drop policy if exists "member_documents_authenticated_select" on public.member_documents;
drop policy if exists "member_documents_authenticated_insert" on public.member_documents;
drop policy if exists "member_documents_authenticated_update" on public.member_documents;
drop policy if exists "member_documents_authenticated_delete" on public.member_documents;

create policy "member_documents_authenticated_select"
on public.member_documents
for select to authenticated
using (true);

create policy "member_documents_authenticated_insert"
on public.member_documents
for insert to authenticated
with check (true);

create policy "member_documents_authenticated_update"
on public.member_documents
for update to authenticated
using (true)
with check (true);

create policy "member_documents_authenticated_delete"
on public.member_documents
for delete to authenticated
using (true);

-- The first migration created the image-only extension restriction. Extend it for PDF documents.
drop policy if exists "member_photos_authenticated_insert" on storage.objects;
create policy "member_photos_authenticated_insert"
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'member-photos'
  and (storage.foldername(name))[1] in ('staff', 'teacher', 'accounts', 'other')
  and storage.extension(name) in ('jpg', 'jpeg', 'png', 'webp', 'gif', 'pdf')
);

drop policy if exists "member_photos_authenticated_update" on storage.objects;
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

drop policy if exists "member_photos_authenticated_delete" on storage.objects;
create policy "member_photos_authenticated_delete"
on storage.objects
for delete to authenticated
using (
  bucket_id = 'member-photos'
  and (storage.foldername(name))[1] in ('staff', 'teacher', 'accounts', 'other')
);
