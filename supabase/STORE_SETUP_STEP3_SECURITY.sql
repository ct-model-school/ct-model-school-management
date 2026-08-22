-- STORE SETUP STEP 3: SECURITY / GRANTS
-- Depends on STEP 1 and STEP 2.

alter table public.inventory_items enable row level security;
alter table public.inventory_stock_movements enable row level security;
alter table public.store_users enable row level security;
alter table public.store_sessions enable row level security;
alter table public.store_service_requests enable row level security;
alter table public.store_service_request_items enable row level security;
alter table public.store_staff_members enable row level security;
alter table public.store_teacher_members enable row level security;
alter table public.store_accounts_members enable row level security;

drop policy if exists inventory_items_admin_policy on public.inventory_items;
create policy inventory_items_admin_policy on public.inventory_items for all to authenticated using (public.store_is_admin()) with check (public.store_is_admin());

drop policy if exists inventory_movements_admin_policy on public.inventory_stock_movements;
create policy inventory_movements_admin_policy on public.inventory_stock_movements for all to authenticated using (public.store_is_admin()) with check (public.store_is_admin());

drop policy if exists store_users_admin_policy on public.store_users;
create policy store_users_admin_policy on public.store_users for all to authenticated using (public.store_is_admin()) with check (public.store_is_admin());

drop policy if exists store_sessions_admin_policy on public.store_sessions;
create policy store_sessions_admin_policy on public.store_sessions for all to authenticated using (public.store_is_admin()) with check (public.store_is_admin());

drop policy if exists store_sr_admin_policy on public.store_service_requests;
create policy store_sr_admin_policy on public.store_service_requests for all to authenticated using (public.store_is_admin()) with check (public.store_is_admin());

drop policy if exists store_sr_items_admin_policy on public.store_service_request_items;
create policy store_sr_items_admin_policy on public.store_service_request_items for all to authenticated using (public.store_is_admin()) with check (public.store_is_admin());

drop policy if exists store_staff_admin_policy on public.store_staff_members;
create policy store_staff_admin_policy on public.store_staff_members for all to authenticated using (public.store_is_admin()) with check (public.store_is_admin());

drop policy if exists store_teacher_admin_policy on public.store_teacher_members;
create policy store_teacher_admin_policy on public.store_teacher_members for all to authenticated using (public.store_is_admin()) with check (public.store_is_admin());

drop policy if exists store_accounts_admin_policy on public.store_accounts_members;
create policy store_accounts_admin_policy on public.store_accounts_members for all to authenticated using (public.store_is_admin()) with check (public.store_is_admin());

grant usage on schema public to anon, authenticated;
grant execute on function public.store_is_admin() to anon, authenticated;
grant execute on function public.store_admin_save_item(uuid,text,text,text,text,text,text,text,numeric,numeric) to authenticated;
grant execute on function public.store_admin_deactivate_item(uuid) to authenticated;
grant execute on function public.store_create_user(uuid,text,text) to authenticated;
grant execute on function public.store_login(text,text) to anon, authenticated;
grant execute on function public.store_logout(text) to anon, authenticated;
grant execute on function public.store_list_items(text,text) to anon, authenticated;
grant execute on function public.store_submit_sr(text,text,text,text,jsonb) to anon, authenticated;
grant execute on function public.store_get_sr(text,text) to anon, authenticated;
grant execute on function public.store_admin_list_srs(text) to authenticated;
grant execute on function public.store_admin_process_sr(uuid,text,jsonb,text) to authenticated;
grant execute on function public.store_admin_list_members(text,text) to authenticated;
grant execute on function public.store_admin_save_member(text,uuid,text,text,text,text,text,text,text,text,text,text,text,date,text,jsonb) to authenticated;
grant execute on function public.store_admin_remove_member(text,uuid) to authenticated;

-- Admin-only direct table access is intentionally limited by the policies above.
-- Do not grant anon access to member tables because passwords are administrative credentials.
