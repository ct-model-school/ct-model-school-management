-- STORE SETUP STEP 4: VERIFY / FINALIZE
-- Depends on STEP 1, 2 and 3.
-- Run this last. It performs only safe verification and creates the status view.

create or replace view public.store_inventory_status as
select i.id,i.item_code,i.item_name,i.item_type,i.specification,i.brand,i.model,i.unit,i.details,i.current_stock,i.reorder_level,
case when i.current_stock<=0 then 'Out of Stock' when i.reorder_level>0 and i.current_stock<=i.reorder_level then 'Low Stock' else 'In Stock' end as stock_status,
i.is_active,i.created_at,i.updated_at from public.inventory_items i;

grant select on public.store_inventory_status to authenticated;

do $$
begin
  if to_regclass('public.inventory_items') is null then raise exception 'STEP 1 failed: inventory_items is missing'; end if;
  if to_regclass('public.store_service_requests') is null then raise exception 'STEP 1 failed: store_service_requests is missing'; end if;
  if to_regclass('public.store_staff_members') is null then raise exception 'STEP 1 failed: store_staff_members is missing'; end if;
  if to_regclass('public.store_teacher_members') is null then raise exception 'STEP 1 failed: store_teacher_members is missing'; end if;
  if to_regclass('public.store_accounts_members') is null then raise exception 'STEP 1 failed: store_accounts_members is missing'; end if;
  if to_regprocedure('public.store_admin_save_item(uuid,text,text,text,text,text,text,text,numeric,numeric)') is null then raise exception 'STEP 2 failed: store_admin_save_item is missing'; end if;
  if to_regprocedure('public.store_admin_save_member(text,uuid,text,text,text,text,text,text,text,text,text,text,text,date,text,jsonb)') is null then raise exception 'STEP 2 failed: store_admin_save_member is missing'; end if;
end $$;

select 'STORE SETUP OK' as status,
       to_regclass('public.inventory_items') is not null as inventory_ready,
       to_regclass('public.store_service_requests') is not null as sr_ready,
       to_regclass('public.store_staff_members') is not null as staff_ready,
       to_regclass('public.store_teacher_members') is not null as teacher_ready,
       to_regclass('public.store_accounts_members') is not null as accounts_ready;
