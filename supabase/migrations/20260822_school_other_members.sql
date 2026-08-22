create sequence if not exists public.school_other_id_seq start 1;
create table if not exists public.school_other_members (
  id uuid primary key default gen_random_uuid(),
  other_id text unique not null,
  full_name text not null,
  role_title text,
  department text,
  phone text,
  email text,
  details text,
  login_password text not null,
  password_hash text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create or replace function public.school_other_id_trigger() returns trigger language plpgsql as $$ begin if nullif(trim(new.other_id),'') is null then new.other_id := 'OTID' || lpad(nextval('public.school_other_id_seq')::text,5,'0'); end if; new.updated_at:=now(); return new; end; $$;
drop trigger if exists school_other_id_before_insert on public.school_other_members;
create trigger school_other_id_before_insert before insert on public.school_other_members for each row execute function public.school_other_id_trigger();
