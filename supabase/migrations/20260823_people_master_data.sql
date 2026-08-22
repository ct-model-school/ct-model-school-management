-- CT Model School: People & Achievements foundation
-- Apply manually in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.school_master_data (
  id uuid primary key default gen_random_uuid(),
  master_type text not null check (master_type in ('class','section','department','subject','designation','committee','committee_position','achievement_type','exam','academic_year','scholarship_type','status')),
  value text not null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (master_type, value)
);

create index if not exists school_master_data_lookup_idx on public.school_master_data(master_type, is_active, sort_order, value);

insert into public.school_master_data(master_type,value,sort_order) values
('class','Play',10),('class','Nursery',20),('class','KG',30),('class','1',40),('class','2',50),('class','3',60),('class','4',70),('class','5',80),('class','6',90),('class','7',100),('class','8',110),('class','9',120),('class','10',130),('class','SSC',140),('class','HSC',150),
('section','A',10),('section','B',20),('section','C',30),('section','D',40),('section','E',50),
('status','Active',10),('status','Inactive',20),
('achievement_type','Academic',10),('achievement_type','Sports',20),('achievement_type','Cultural',30),('achievement_type','Competition',40),('achievement_type','Other',50),
('scholarship_type','General Scholarship',10),('scholarship_type','Talent Scholarship',20),('scholarship_type','Government Scholarship',30),('scholarship_type','Other',40),
('exam','SSC',10),('exam','HSC',20),('exam','JSC',30),('exam','Annual Examination',40),('exam','Other',50)
on conflict (master_type,value) do nothing;

create table if not exists public.people_profiles (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('teacher','committee','staff','gpa5','scholarship','achievement')),
  full_name text not null,
  photo_url text,
  designation text,
  department text,
  subject text,
  committee_name text,
  committee_position text,
  responsibility text,
  job_title text,
  class_name text,
  section text,
  academic_year text,
  exam_name text,
  result_value text,
  achievement_type text,
  scholarship_type text,
  achievement_year text,
  achievement_details text,
  short_description text,
  email text,
  phone text,
  whatsapp text,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists people_profiles_category_idx on public.people_profiles(category,is_active,display_order);
create index if not exists people_profiles_name_idx on public.people_profiles(lower(full_name));

create or replace function public.people_profiles_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at=now(); return new; end; $$;

drop trigger if exists people_profiles_updated_at on public.people_profiles;
create trigger people_profiles_updated_at before update on public.people_profiles for each row execute function public.people_profiles_updated_at();

grant select on public.people_profiles to anon, authenticated;
grant select on public.school_master_data to anon, authenticated;
