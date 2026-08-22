-- Admin item CRUD RPCs with stock movement auditing.

create or replace function public.store_admin_save_item(
  p_id uuid default null,
  p_item_name text default null,
  p_item_type text default null,
  p_specification text default null,
  p_brand text default null,
  p_model text default null,
  p_unit text default 'pcs',
  p_details text default null,
  p_current_stock numeric default 0,
  p_reorder_level numeric default 0
)
returns public.inventory_items
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.inventory_items%rowtype;
  v_old_stock numeric;
  v_delta numeric;
  v_movement_type text;
begin
  if not public.store_is_admin() then
    raise exception 'Not authorized';
  end if;

  if nullif(trim(p_item_name), '') is null then
    raise exception 'Item name is required';
  end if;

  if p_current_stock < 0 or p_reorder_level < 0 then
    raise exception 'Stock values cannot be negative';
  end if;

  if p_id is null then
    insert into public.inventory_items (
      item_name, item_type, specification, brand, model, unit, details, current_stock, reorder_level
    ) values (
      trim(p_item_name), nullif(trim(p_item_type), ''), nullif(trim(p_specification), ''),
      nullif(trim(p_brand), ''), nullif(trim(p_model), ''), coalesce(nullif(trim(p_unit), ''), 'pcs'),
      nullif(trim(p_details), ''), p_current_stock, p_reorder_level
    ) returning * into v_item;

    if p_current_stock > 0 then
      insert into public.inventory_stock_movements (item_id, movement_type, quantity, note, performed_by)
      values (v_item.id, 'opening', p_current_stock, 'Opening stock', auth.uid());
    end if;

    return v_item;
  end if;

  select * into v_item
  from public.inventory_items
  where id = p_id
  for update;

  if v_item.id is null then
    raise exception 'Item not found';
  end if;

  v_old_stock := v_item.current_stock;
  v_delta := p_current_stock - v_old_stock;

  update public.inventory_items
  set item_name = trim(p_item_name),
      item_type = nullif(trim(p_item_type), ''),
      specification = nullif(trim(p_specification), ''),
      brand = nullif(trim(p_brand), ''),
      model = nullif(trim(p_model), ''),
      unit = coalesce(nullif(trim(p_unit), ''), 'pcs'),
      details = nullif(trim(p_details), ''),
      current_stock = p_current_stock,
      reorder_level = p_reorder_level
  where id = p_id
  returning * into v_item;

  if v_delta <> 0 then
    v_movement_type := case when v_delta > 0 then 'add' else 'adjustment' end;
    insert into public.inventory_stock_movements (item_id, movement_type, quantity, note, performed_by)
    values (v_item.id, v_movement_type, abs(v_delta), 'Admin stock adjustment', auth.uid());
  end if;

  return v_item;
end;
$$;

create or replace function public.store_admin_deactivate_item(p_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.store_is_admin() then
    raise exception 'Not authorized';
  end if;

  update public.inventory_items
  set is_active = false
  where id = p_id;

  return found;
end;
$$;

grant execute on function public.store_admin_save_item(uuid,text,text,text,text,text,text,text,numeric,numeric) to authenticated;
grant execute on function public.store_admin_deactivate_item(uuid) to authenticated;
