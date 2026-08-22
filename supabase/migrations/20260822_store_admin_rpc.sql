-- Admin SR list/detail RPC. Keeps store credentials/session tables private from the browser.

create or replace function public.store_admin_list_srs(p_search text default null)
returns table (
  id uuid,
  sr_number text,
  requester_name text,
  requester_login_id text,
  requester_email text,
  requester_phone text,
  class_name text,
  department text,
  request_details text,
  status text,
  admin_note text,
  requested_at timestamptz,
  processed_at timestamptz,
  items jsonb
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.store_is_admin() then
    raise exception 'Not authorized';
  end if;

  return query
  select
    r.id,
    r.sr_number,
    coalesce(pp.full_name, su.login_id) as requester_name,
    su.login_id as requester_login_id,
    pp.email as requester_email,
    pp.phone as requester_phone,
    r.class_name,
    r.department,
    r.request_details,
    r.status,
    r.admin_note,
    r.requested_at,
    r.processed_at,
    coalesce((
      select jsonb_agg(jsonb_build_object(
        'item_id', sri.item_id,
        'item_code', ii.item_code,
        'item_name', ii.item_name,
        'unit', ii.unit,
        'current_stock', ii.current_stock,
        'requested_quantity', sri.requested_quantity,
        'issued_quantity', sri.issued_quantity,
        'remaining_quantity', sri.requested_quantity - sri.issued_quantity,
        'item_note', sri.item_note
      ) order by ii.item_name)
      from public.store_service_request_items sri
      join public.inventory_items ii on ii.id = sri.item_id
      where sri.service_request_id = r.id
    ), '[]'::jsonb) as items
  from public.store_service_requests r
  join public.store_users su on su.id = r.store_user_id
  left join public.people_profiles pp on pp.id = su.people_profile_id
  where nullif(trim(p_search), '') is null
     or lower(r.sr_number) like '%' || lower(trim(p_search)) || '%'
     or lower(coalesce(pp.full_name, '')) like '%' || lower(trim(p_search)) || '%'
     or lower(coalesce(su.login_id, '')) like '%' || lower(trim(p_search)) || '%'
  order by r.requested_at desc;
end;
$$;

grant execute on function public.store_admin_list_srs(text) to authenticated;
