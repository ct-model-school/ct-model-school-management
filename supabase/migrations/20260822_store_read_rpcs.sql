-- Store read/lookup RPCs used by the public Store/SR page.

create or replace function public.store_list_items(
  p_token text,
  p_search text default null
)
returns table (
  id uuid,
  item_code text,
  item_name text,
  item_type text,
  specification text,
  brand text,
  model text,
  unit text,
  current_stock numeric,
  stock_status text
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.store_sessions
    where token_hash = encode(digest(p_token, 'sha256'), 'hex')
      and expires_at > now()
  ) then
    raise exception 'Store session expired. Please login again.';
  end if;

  return query
  select
    i.id,
    i.item_code,
    i.item_name,
    i.item_type,
    i.specification,
    i.brand,
    i.model,
    i.unit,
    i.current_stock,
    case
      when i.current_stock <= 0 then 'Out of Stock'
      when i.reorder_level > 0 and i.current_stock <= i.reorder_level then 'Low Stock'
      else 'In Stock'
    end as stock_status
  from public.inventory_items i
  where i.is_active = true
    and (
      nullif(trim(p_search), '') is null
      or lower(i.item_code) like '%' || lower(trim(p_search)) || '%'
      or lower(i.item_name) like '%' || lower(trim(p_search)) || '%'
      or lower(coalesce(i.item_type, '')) like '%' || lower(trim(p_search)) || '%'
      or lower(coalesce(i.specification, '')) like '%' || lower(trim(p_search)) || '%'
    )
  order by i.item_name asc
  limit 50;
end;
$$;

create or replace function public.store_get_sr(
  p_token text,
  p_sr_number text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.store_sessions%rowtype;
  v_request public.store_service_requests%rowtype;
  v_items jsonb;
  v_profile public.people_profiles%rowtype;
begin
  select * into v_session
  from public.store_sessions
  where token_hash = encode(digest(p_token, 'sha256'), 'hex')
    and expires_at > now()
  limit 1;

  if v_session.id is null then
    raise exception 'Store session expired. Please login again.';
  end if;

  select * into v_request
  from public.store_service_requests
  where sr_number = trim(p_sr_number)
    and store_user_id = v_session.store_user_id;

  if v_request.id is null then
    raise exception 'SR not found';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'item_id', sri.item_id,
    'item_code', ii.item_code,
    'item_name', ii.item_name,
    'unit', ii.unit,
    'requested_quantity', sri.requested_quantity,
    'issued_quantity', sri.issued_quantity,
    'item_note', sri.item_note
  ) order by ii.item_name), '[]'::jsonb)
  into v_items
  from public.store_service_request_items sri
  join public.inventory_items ii on ii.id = sri.item_id
  where sri.service_request_id = v_request.id;

  select pp.* into v_profile
  from public.people_profiles pp
  join public.store_users su on su.people_profile_id = pp.id
  where su.id = v_session.store_user_id;

  update public.store_sessions
  set last_seen_at = now()
  where id = v_session.id;

  return jsonb_build_object(
    'id', v_request.id,
    'sr_number', v_request.sr_number,
    'status', v_request.status,
    'class_name', v_request.class_name,
    'department', v_request.department,
    'request_details', v_request.request_details,
    'admin_note', v_request.admin_note,
    'requested_at', v_request.requested_at,
    'processed_at', v_request.processed_at,
    'requester_name', v_profile.full_name,
    'requester_email', v_profile.email,
    'requester_phone', v_profile.phone,
    'requester_whatsapp', v_profile.whatsapp,
    'items', v_items
  );
end;
$$;

grant execute on function public.store_list_items(text,text) to anon, authenticated;
grant execute on function public.store_get_sr(text,text) to anon, authenticated;
