-- CT Model School: People & Achievements
-- Apply this file manually in Supabase SQL Editor.
-- This migration intentionally keeps all people/achievement records in one
-- reusable table so Teacher, Committee, Staff and Student achievement cards
-- can share the same public profile system.

create table if not exists public.people_profiles (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in (
    'teacher',
    'committee',
    'staff',
    'gpa5',
    'scholarship',
    'achievement'
  )),
  full_name text not null,
  photo_url text,
  designation text,
  department text,
  subject text,
  committee_name text,
  committee_position text,
  responsibility text,
  class_name text,
  section text,
  academic_year text,
  exam_name text,
  result_value text,
  achievement_type text,
  scholarship_type text,
  achievement_details text,
  short_description text,
  email text,
  phone text,
  whatsapp text,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists people_profiles_category_idx
  on public.people_profiles(category, is_active, display_order, full_name);

create or replace function public.set_people_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists people_profiles_updated_at on public.people_profiles;
create trigger people_profiles_updated_at
before update on public.people_profiles
for each row execute function public.set_people_profiles_updated_at();

alter table public.people_profiles enable row level security;

drop policy if exists "Public can view active people profiles" on public.people_profiles;
create policy "Public can view active people profiles"
on public.people_profiles
for select
using (is_active = true);

-- Admin write access is intentionally granted to authenticated users here.
-- Existing application authentication/role checks remain responsible for
-- deciding who can reach the Admin module.
drop policy if exists "Authenticated users can insert people profiles" on public.people_profiles;
create policy "Authenticated users can insert people profiles"
on public.people_profiles
for insert to authenticated
with check (true);

drop policy if exists "Authenticated users can update people profiles" on public.people_profiles;
create policy "Authenticated users can update people profiles"
on public.people_profiles
for update to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete people profiles" on public.people_profiles;
create policy "Authenticated users can delete people profiles"
on public.people_profiles
for delete to authenticated
using (true);

-- Quick-add master options. These are intentionally reusable by future
-- dynamic dropdowns and can be extended without changing the profile table.
create table if not exists public.people_master_options (
  id uuid primary key default gen_random_uuid(),
  option_group text not null,
  option_value text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique(option_group, option_value)
);

create index if not exists people_master_options_group_idx
  on public.people_master_options(option_group, is_active, display_order, option_value);

alter table public.people_master_options enable row level security;

drop policy if exists "Public can view active people master options" on public.people_master_options;
create policy "Public can view active people master options"
on public.people_master_options
for select
using (is_active = true);

drop policy if exists "Authenticated users can manage people master options" on public.people_master_options;
create policy "Authenticated users can manage people master options"
on public.people_master_options
for all to authenticated
using (true)
with check (true);

insert into public.people_master_options (option_group, option_value, display_order)
values
  ('category', 'Teacher', 10),
  ('category', 'Management Committee', 20),
  ('category', 'Staff / Employee', 30),
  ('category', 'GPA-5 Achiever', 40),
  ('category', 'Scholarship Achiever', 50),
  ('category', 'Other Achievement', 60),
  ('achievement_type', 'Academic', 10),
  ('achievement_type', 'Sports', 20),
  ('achievement_type', 'Cultural', 30),
  ('achievement_type', 'Competition', 40),
  ('achievement_type', 'Other', 50),
  ('scholarship_type', 'General Scholarship', 10),
  ('scholarship_type', 'Talent Scholarship', 20),
  ('scholarship_type', 'Government Scholarship', 30),
  ('scholarship_type', 'Other', 40)
on conflict (option_group, option_value) do nothing;

-- Storage bucket for profile photographs.
insert into storage.buckets (id, name, public)
values ('school_people', 'school_people', true)
on conflict (id) do nothing;

-- Public profile images can be read directly from the public bucket.
drop policy if exists "Public can view school people images" on storage.objects;
create policy "Public can view school people images"
on storage.objects
for select
using (bucket_id = 'school_people');

-- Authenticated Admin users may manage profile images.
drop policy if exists "Authenticated users can manage school people images" on storage.objects;
create policy "Authenticated users can manage school people images"
on storage.objects
for all to authenticated
using (bucket_id = 'school_people')
with check (bucket_id = 'school_people');
