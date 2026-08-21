-- Run this manually in the Supabase SQL editor after the existing school_settings SQL.
-- Fixes Data API table privileges so the existing RLS policies can actually evaluate.
-- RLS remains the authorization layer: public users can only SELECT, while
-- authenticated users are still restricted by the existing administrator policy.

revoke all on table public.school_settings from anon;
revoke all on table public.school_settings from authenticated;

grant select on table public.school_settings to anon;
grant select, insert, update, delete on table public.school_settings to authenticated;

-- Keep the administrator write policy explicit and idempotent.
drop policy if exists "Administrators can manage school settings" on public.school_settings;
create policy "Administrators can manage school settings"
  on public.school_settings
  for all
  to authenticated
  using ((select public.is_school_administrator()))
  with check ((select public.is_school_administrator()));
