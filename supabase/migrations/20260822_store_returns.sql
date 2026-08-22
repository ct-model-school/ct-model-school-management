-- Store return/issue history.
-- Keeps every return tied to the original SR item so future returns can be
-- processed against the same request instead of creating disconnected records.

create table if not exists public.store_item_returns (
  id uuid primary key default gen_random_uuid(),
  service_request_item_id uuid not null references public.store_service_request_items(id) on delete restrict,
  item_id uuid not null references public.inventory_items(id) on delete restrict,
  return_quantity numeric(14,2) not null check (return_quantity > 0),
  condition text not null default 'Good' check (condition in ('Good','Damaged','Partial','Other')),
  return_note text,
  returned_by uuid references auth.users(id) on delete set null,
  returned_at timestamptz not null default now()
);

create index if not exists idx_store_item_returns_request_item
  on public.store_item_returns(service_request_item_id, returned_at desc);
create index if not exists idx_store_item_returns_item
  on public.store_item_returns(item_id, returned_at desc);

alter table public.store_item_returns enable row level security;

create or replace function public.store_admin_list_returnable_srs(p_search text default null)
returns table (
  service_request_item_id uuid,
  sr_id uuid,
  sr_number text,
  requester_name text,
  requester_login_id text,
  item_id uuid,
  item_code text,
  item_name text,
  unit text,
  issued_quantity numeric,
  returned_quantity numeric,
  returnable_quantity numeric,
  current_stock numeric
)
language sql
security definer
set search_path = public
as $$
  select
    sri.id,
    sr.id,
    sr.sr_number,
    coalesce(pp.full_name, su.login_id),
    su.login_id,
    sri.item_id,
    ii.item_code,
    ii.item_name,
    ii.unit,
    sri.issued_quantity,
    coalesce(sum(sir.return_quantity), 0),
    greatest(sri.issued_quantity - coalesce(sum(sir.return_quantity), 0), 0),
    ii.current_stock
  from public.store_service_request_items sri
  join public.store_service_requests sr on sr.id = sri.service_request_id
  join public.inventory_items ii on ii.id = sri.item_id
  left join public.store_item_returns sir on sir.service_request_item_id = sri.id
  left join public.store_users su on su.id = sr.store_user_id
  left join public.people_profiles pp on pp.id = su.people_profile_id
  where sri.issued_quantity > 0
    and (
      nullif(trim(p_search), '') is null
      or lower(sr.sr_number) like '%' || lower(trim(p_search)) || '%'
      or lower(ii.item_code) like '%' || lower(trim(p_search)) || '%'
      or lower(ii.item_name) like '%' || lower(trim(p_search)) || '%'
      or lower(coalesce(su.login_id, '')) like '%' || lower(trim(p_search)) || '%'
    )
  group by sri.id, sr.id, sr.sr_number, su.login_id, pp.full_name,
           sri.item_id, ii.item_code, ii.item_name, ii.unit, sri.issued_quantity, ii.current_stock
  having greatest(sri.issued_quantity - coalesce(sum(sir.return_quantity), 0), 0) > 0
  order by sr.requested_at desc, ii.item_name;
$$;

create or replace function public.store_admin_return_item(
  p_service_request_item_id uuid,
  p_quantity numeric,
  p_condition text default 'Good',
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item_id uuid;
  v_issued numeric;
  v_returned numeric;
  v_return_id uuid;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Return quantity must be greater than zero';
  end if;

  select item_id, issued_quantity
    into v_item_id, v_issued
  from public.store_service_request_items
  where id = p_service_request_item_id
  for update;

  if v_item_id is null then
    raise exception 'Issued SR item not found';
  end if;

  select coalesce(sum(return_quantity), 0)
    into v_returned
  from public.store_item_returns
  where service_request_item_id = p_service_request_item_id;

  if v_returned + p_quantity > v_issued then
    raise exception 'Return quantity exceeds remaining issued quantity';
  end if;

  update public.inventory_items
  set current_stock = current_stock + p_quantity
  where id = v_item_id;

  insert into public.store_item_returns(
    service_request_item_id, item_id, return_quantity, condition, return_note, returned_by
  ) values (
    p_service_request_item_id, v_item_id, p_quantity,
    coalesce(nullif(trim(p_condition), ''), 'Good'), p_note, auth.uid()
  ) returning id into v_return_id;

  return v_return_id;
end;
$$;

grant execute on function public.store_admin_list_returnable_srs(text) to authenticated;
grant execute on function public.store_admin_return_item(uuid,numeric,text,text) to authenticated;
