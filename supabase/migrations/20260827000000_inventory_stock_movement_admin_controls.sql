drop policy if exists "inventory_stock_movements_admin_select_policy" on public.inventory_stock_movements;
drop policy if exists "inventory_stock_movements_admin_insert_policy" on public.inventory_stock_movements;

create policy "inventory_stock_movements_admin_select_policy"
on public.inventory_stock_movements
for select
using ((select store_is_admin()));

create policy "inventory_stock_movements_admin_insert_policy"
on public.inventory_stock_movements
for insert
with check ((select store_is_admin()));

create or replace function public.store_admin_record_stock_movement(
  p_item_id uuid,
  p_movement_type text,
  p_quantity numeric,
  p_note text default null
)
returns table(item_id uuid, item_code text, movement_type text, quantity numeric, current_stock numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item inventory_items%rowtype;
  v_new_stock numeric;
begin
  if not store_is_admin() then
    raise exception 'Admin access required';
  end if;
  if p_movement_type not in ('IN','OUT') then
    raise exception 'Invalid movement type';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be greater than zero';
  end if;

  select * into v_item
  from inventory_items
  where id = p_item_id and is_active = true
  for update;

  if not found then
    raise exception 'Active inventory item not found';
  end if;

  v_new_stock := v_item.current_stock + case when p_movement_type = 'IN' then p_quantity else -p_quantity end;
  if v_new_stock < 0 then
    raise exception 'Stock Out cannot exceed current stock';
  end if;

  update inventory_items
  set current_stock = v_new_stock, updated_at = now()
  where id = v_item.id;

  insert into inventory_stock_movements(item_id, movement_type, quantity, reference_type, note, performed_by)
  values(v_item.id, p_movement_type, p_quantity, 'manual', nullif(trim(p_note), ''), auth.uid());

  return query
  select v_item.id, v_item.item_code, p_movement_type, p_quantity, v_new_stock;
end;
$$;

revoke all on function public.store_admin_record_stock_movement(uuid,text,numeric,text) from public;
grant execute on function public.store_admin_record_stock_movement(uuid,text,numeric,text) to authenticated;
