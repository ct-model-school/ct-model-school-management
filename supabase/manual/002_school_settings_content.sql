-- Run this manually in the Supabase SQL editor after 001_school_settings.sql.
-- Extends the single school_settings record with the central content/settings
-- needed by the C.T. Model School admin and future public website.
-- Safe to re-run: every column is added only when it does not already exist.

alter table public.school_settings
  add column if not exists school_name text,
  add column if not exists school_short_name text,
  add column if not exists school_motto text,
  add column if not exists school_headline text,
  add column if not exists school_description text,
  add column if not exists established_year integer,
  add column if not exists eiin text,
  add column if not exists board text,
  add column if not exists principal_name text,
  add column if not exists principal_message text,
  add column if not exists logo_url text,
  add column if not exists favicon_url text,
  add column if not exists hero_image text,
  add column if not exists address text,
  add column if not exists phone text,
  add column if not exists whatsapp text,
  add column if not exists telephone text,
  add column if not exists email text,
  add column if not exists website text,
  add column if not exists google_map text,
  add column if not exists office_time text,
  add column if not exists facebook text,
  add column if not exists messenger text,
  add column if not exists instagram text,
  add column if not exists youtube text,
  add column if not exists linkedin text,
  add column if not exists tiktok text,
  add column if not exists hero_badge text,
  add column if not exists hero_subtitle text,
  add column if not exists hero_title text,
  add column if not exists hero_description text,
  add column if not exists hero_button_1_text text,
  add column if not exists hero_button_1_link text,
  add column if not exists hero_button_2_text text,
  add column if not exists hero_button_2_link text,
  add column if not exists show_hero boolean not null default true,
  add column if not exists hero_auto_slide boolean not null default true,
  add column if not exists hero_slide_interval integer not null default 5,
  add column if not exists hero_transition_speed integer not null default 600,
  add column if not exists hero_max_items integer not null default 5,
  add column if not exists meta_title text,
  add column if not exists meta_description text,
  add column if not exists meta_keywords text,
  add column if not exists og_image text,
  add column if not exists currency text not null default 'BDT',
  add column if not exists currency_symbol text not null default '৳',
  add column if not exists timezone text not null default 'Asia/Dhaka',
  add column if not exists maintenance_mode boolean not null default false;

-- Keep the existing row useful immediately with the values already supplied
-- for this school. Existing non-empty values are not overwritten.
update public.school_settings
set
  school_name = coalesce(nullif(school_name, ''), 'C.T. Model School'),
  school_short_name = coalesce(nullif(school_short_name, ''), 'CTMS'),
  address = coalesce(nullif(address, ''), 'Station Road, Kumira, Sitakunda, Chattogram'),
  phone = coalesce(nullif(phone, ''), '+880 1831-988846'),
  theme_color = coalesce(nullif(theme_color, ''), '#1E3A5F'),
  currency = coalesce(nullif(currency, ''), 'BDT'),
  currency_symbol = coalesce(nullif(currency_symbol, ''), '৳'),
  timezone = coalesce(nullif(timezone, ''), 'Asia/Dhaka')
where id = 1;

-- The public read policy and administrator write/RLS policy from 001 remain in force.
