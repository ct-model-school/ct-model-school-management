-- Run manually in the Supabase SQL editor after the existing school settings and storage SQL.
-- Stores multiple public homepage hero images independently from the single school_settings row.

create table if not exists public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  storage_path text not null unique,
  alt_text text not null default 'C.T. মডেল স্কুল hero image',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists hero_slides_active_order_idx
  on public.hero_slides (is_active, sort_order, created_at);

alter table public.hero_slides enable row level security;

revoke all on table public.hero_slides from anon;
revoke all on table public.hero_slides from authenticated;
grant select on table public.hero_slides to anon, authenticated;
grant insert, update, delete on table public.hero_slides to authenticated;

drop policy if exists "Public can read active hero slides" on public.hero_slides;
create policy "Public can read active hero slides"
  on public.hero_slides
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Administrators can read all hero slides" on public.hero_slides;
create policy "Administrators can read all hero slides"
  on public.hero_slides
  for select
  to authenticated
  using (public.is_school_administrator());

drop policy if exists "Administrators can insert hero slides" on public.hero_slides;
create policy "Administrators can insert hero slides"
  on public.hero_slides
  for insert
  to authenticated
  with check (public.is_school_administrator());

drop policy if exists "Administrators can update hero slides" on public.hero_slides;
create policy "Administrators can update hero slides"
  on public.hero_slides
  for update
  to authenticated
  using (public.is_school_administrator())
  with check (public.is_school_administrator());

drop policy if exists "Administrators can delete hero slides" on public.hero_slides;
create policy "Administrators can delete hero slides"
  on public.hero_slides
  for delete
  to authenticated
  using (public.is_school_administrator());

create or replace function public.set_hero_slides_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists hero_slides_set_updated_at on public.hero_slides;
create trigger hero_slides_set_updated_at
before update on public.hero_slides
for each row execute function public.set_hero_slides_updated_at();

-- Keep school_settings.hero_image populated with the first active slide for
-- backward compatibility. The public website should use hero_slides for the
-- complete multi-image gallery.
create or replace function public.sync_primary_hero_image()
returns trigger
language plpgsql
as $$
declare
  primary_url text;
begin
  select image_url
    into primary_url
    from public.hero_slides
   where is_active = true
   order by sort_order asc, created_at asc
   limit 1;

  update public.school_settings
     set hero_image = primary_url
   where id = 1;

  return null;
end;
$$;

drop trigger if exists hero_slides_sync_primary_hero on public.hero_slides;
create trigger hero_slides_sync_primary_hero
after insert or update or delete on public.hero_slides
for each statement execute function public.sync_primary_hero_image();

-- Sync the existing gallery immediately when this SQL is run, without requiring
-- another upload or edit action.
update public.school_settings
   set hero_image = (
     select image_url
       from public.hero_slides
      where is_active = true
      order by sort_order asc, created_at asc
      limit 1
   )
 where id = 1;

-- AssetUploadPanel owns these four URLs. The main Settings form currently submits the
-- complete settings object, so preserve an existing uploaded URL when that form sends
-- an empty value. This prevents a later Save All Settings from erasing an uploaded link.
create or replace function public.preserve_school_asset_urls()
returns trigger
language plpgsql
as $$
begin
  if nullif(trim(coalesce(new.logo_url, '')), '') is null then
    new.logo_url = old.logo_url;
  end if;
  if nullif(trim(coalesce(new.favicon_url, '')), '') is null then
    new.favicon_url = old.favicon_url;
  end if;
  if nullif(trim(coalesce(new.hero_image, '')), '') is null then
    new.hero_image = old.hero_image;
  end if;
  if nullif(trim(coalesce(new.og_image, '')), '') is null then
    new.og_image = old.og_image;
  end if;
  return new;
end;
$$;

drop trigger if exists school_settings_preserve_asset_urls on public.school_settings;
create trigger school_settings_preserve_asset_urls
before update on public.school_settings
for each row execute function public.preserve_school_asset_urls();

-- Storage files remain in the existing public school-assets bucket under hero/.
-- Supabase Storage creates the logical folder automatically when the first file is uploaded.
