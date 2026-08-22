alter table public.inventory_items add column if not exists note text;

create or replace function public.store_admin_save_item(
  p_id uuid default null,
  p_item_name text default null,
  p_item_type text default null,
  p_specification text default null,
  p_brand text default null,
  p_model text default null,
  p_unit text default 'pcs',
  p_details text default null,
  p_note text default null,
  p_current_stock numeric default 0,
  p_reorder_level numeric default 0
)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_item public.inventory_items%rowtype;
begin
  if not public.store_is_admin() then raise exception 'Not authorized'; end if;
  if nullif(trim(p_item_name),'') is null then raise exception 'Item name is required'; end if;
  if p_id is null then
    insert into public.inventory_items(item_name,item_type,specification,brand,model,unit,details,note,current_stock,reorder_level)
    values(trim(p_item_name),nullif(trim(p_item_type),''),nullif(trim(p_specification),''),nullif(trim(p_brand),''),nullif(trim(p_model),''),coalesce(nullif(trim(p_unit),''),'pcs'),nullif(trim(p_details),''),nullif(trim(p_note),''),greatest(coalesce(p_current_stock,0),0),greatest(coalesce(p_reorder_level,0),0)) returning * into v_item;
    if v_item.current_stock > 0 then insert into public.inventory_stock_movements(item_id,movement_type,quantity,note,performed_by) values(v_item.id,'opening',v_item.current_stock,'Opening stock',auth.uid()); end if;
  else
    update public.inventory_items set item_name=trim(p_item_name),item_type=nullif(trim(p_item_type),''),specification=nullif(trim(p_specification),''),brand=nullif(trim(p_brand),''),model=nullif(trim(p_model),''),unit=coalesce(nullif(trim(p_unit),''),'pcs'),details=nullif(trim(p_details),''),note=nullif(trim(p_note),''),current_stock=greatest(coalesce(p_current_stock,0),0),reorder_level=greatest(coalesce(p_reorder_level,0),0) where id=p_id returning * into v_item;
    if v_item.id is null then raise exception 'Item not found'; end if;
  end if;
  return to_jsonb(v_item);
end;
$$;
