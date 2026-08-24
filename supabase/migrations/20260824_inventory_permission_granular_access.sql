-- Inventory is the first finalized permission category.
-- Keep one Inventory category with independent capabilities. Legacy top-level
-- inventory/sr booleans are removed so they cannot create duplicate access paths.
-- Existing roles start with Inventory fully OFF; Admin can explicitly grant each capability.

update public.member_roles
set permissions =
  (permissions - 'inventory' - 'sr') || jsonb_build_object(
    'inventory', jsonb_build_object(
      'view', false,
      'add', false,
      'edit', false,
      'remove', false,
      'sr_approval', false
    )
  )
where permissions ? 'inventory' or permissions ? 'sr';

create or replace function public.store_member_has_inventory_permission(p_token text, p_permission text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.store_sessions s
    join public.store_users u on u.id=s.store_user_id and u.is_active=true
    join public.member_roles mr on mr.is_active=true
      and lower(mr.role_name)=lower(coalesce(nullif(trim(u.access_role),''),u.role_name,''))
    where s.token_hash=encode(extensions.digest(p_token,'sha256'),'hex')
      and s.expires_at>now()
      and (
        (p_permission='view' and coalesce((mr.permissions->'inventory'->>'view')::boolean,false)) or
        (p_permission='add' and coalesce((mr.permissions->'inventory'->>'add')::boolean,false)) or
        (p_permission='edit' and coalesce((mr.permissions->'inventory'->>'edit')::boolean,false)) or
        (p_permission='remove' and coalesce((mr.permissions->'inventory'->>'remove')::boolean,false)) or
        (p_permission='sr_approval' and coalesce((mr.permissions->'inventory'->>'sr_approval')::boolean,false))
      )
  );
$$;

grant execute on function public.store_member_has_inventory_permission(text,text) to authenticated;

create or replace function public.store_member_list_inventory(p_token text, p_search text default null)
returns table(id uuid, item_code text, item_name text, item_type text, specification text, brand text, model text, unit text, details text, note text, current_stock numeric, reorder_level numeric)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.store_member_has_inventory_permission(p_token,'view') then
    raise exception 'Inventory view permission required';
  end if;
  return query
  select i.id,i.item_code,i.item_name,i.item_type,i.specification,i.brand,i.model,i.unit,i.details,i.note,i.current_stock,i.reorder_level
  from public.inventory_items i
  where i.is_active=true
    and (nullif(trim(p_search),'') is null or lower(i.item_code) like '%'||lower(trim(p_search))||'%' or lower(i.item_name) like '%'||lower(trim(p_search))||'%' or lower(coalesce(i.item_type,'')) like '%'||lower(trim(p_search))||'%' or lower(coalesce(i.specification,'')) like '%'||lower(trim(p_search))||'%')
  order by i.item_name;
end;
$$;

grant execute on function public.store_member_list_inventory(text,text) to authenticated;

create or replace function public.store_member_save_item(
  p_token text,
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
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare v_item public.inventory_items%rowtype; v_old_stock numeric;
begin
  if p_id is null then
    if not public.store_member_has_inventory_permission(p_token,'add') then raise exception 'Inventory add permission required'; end if;
  else
    if not public.store_member_has_inventory_permission(p_token,'edit') then raise exception 'Inventory edit permission required'; end if;
  end if;
  if nullif(trim(p_item_name),'') is null then raise exception 'Item name is required'; end if;
  if coalesce(p_current_stock,0)<0 or coalesce(p_reorder_level,0)<0 then raise exception 'Stock values cannot be negative'; end if;
  if p_id is null then
    insert into public.inventory_items(item_name,item_type,specification,brand,model,unit,details,note,current_stock,reorder_level,is_active)
    values(trim(p_item_name),nullif(trim(p_item_type),''),nullif(trim(p_specification),''),nullif(trim(p_brand),''),nullif(trim(p_model),''),coalesce(nullif(trim(p_unit),''),'pcs'),nullif(trim(p_details),''),nullif(trim(p_note),''),coalesce(p_current_stock,0),coalesce(p_reorder_level,0),true)
    returning * into v_item;
    if v_item.current_stock>0 then
      insert into public.inventory_stock_movements(item_id,movement_type,quantity,reference_type,reference_id,note,performed_by)
      values(v_item.id,'opening',v_item.current_stock,'item_create',v_item.id,'Opening stock',auth.uid());
    end if;
  else
    select * into v_item from public.inventory_items where id=p_id for update;
    if v_item.id is null then raise exception 'Item not found'; end if;
    v_old_stock:=v_item.current_stock;
    update public.inventory_items set item_name=trim(p_item_name),item_type=nullif(trim(p_item_type),''),specification=nullif(trim(p_specification),''),brand=nullif(trim(p_brand),''),model=nullif(trim(p_model),''),unit=coalesce(nullif(trim(p_unit),''),'pcs'),details=nullif(trim(p_details),''),note=nullif(trim(p_note),''),current_stock=coalesce(p_current_stock,0),reorder_level=coalesce(p_reorder_level,0),is_active=true,updated_at=now() where id=p_id returning * into v_item;
    if v_item.id is null then raise exception 'Item not found'; end if;
    if v_item.current_stock<>v_old_stock then
      insert into public.inventory_stock_movements(item_id,movement_type,quantity,reference_type,reference_id,note,performed_by)
      values(v_item.id,case when v_item.current_stock>v_old_stock then 'add' else 'issue' end,abs(v_item.current_stock-v_old_stock),'item_edit',v_item.id,'Stock changed during item edit',auth.uid());
    end if;
  end if;
  return jsonb_build_object('id',v_item.id,'item_code',v_item.item_code,'item_name',v_item.item_name,'item_type',v_item.item_type,'specification',v_item.specification,'brand',v_item.brand,'model',v_item.model,'unit',v_item.unit,'details',v_item.details,'note',v_item.note,'current_stock',v_item.current_stock,'reorder_level',v_item.reorder_level,'is_active',v_item.is_active);
end;
$$;

grant execute on function public.store_member_save_item(text,uuid,text,text,text,text,text,text,text,text,numeric,numeric) to authenticated;

create or replace function public.store_member_deactivate_item(p_token text,p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.store_member_has_inventory_permission(p_token,'remove') then raise exception 'Inventory remove permission required'; end if;
  update public.inventory_items set is_active=false,updated_at=now() where id=p_id;
  if not found then raise exception 'Item not found'; end if;
end;
$$;

grant execute on function public.store_member_deactivate_item(text,uuid) to authenticated;

create or replace function public.store_member_can_process_sr(p_token text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.store_member_has_inventory_permission(p_token,'sr_approval');
$$;

grant execute on function public.store_member_can_process_sr(text) to authenticated;

-- Admin always has every Inventory capability. No hardcoded Store role is required.
