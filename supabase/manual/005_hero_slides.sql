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

-- Storage files remain in the existing public school-assets bucket under hero/.
-- Supabase Storage creates the logical folder automatically when the first file is uploaded.
