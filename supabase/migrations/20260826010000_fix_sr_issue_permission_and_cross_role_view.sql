-- Fix the shared Inventory/SR workflow for issue-only Store roles.
-- Issue permission must honor the finalized Inventory permission category,
-- and authorized SR processors must be able to open SRs listed by Inventory.

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
        (p_permission='sr_approval' and coalesce((mr.permissions->'inventory'->>'sr_approval')::boolean,false)) or
        (p_permission='sr_issue' and coalesce((mr.permissions->'inventory'->>'sr_issue')::boolean,false))
      )
  );
$$;

grant execute on function public.store_member_has_inventory_permission(text,text) to authenticated;

create or replace function public.store_member_can_process_sr(p_token text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.store_member_has_inventory_permission(p_token,'sr_approval')
      or public.store_member_has_inventory_permission(p_token,'sr_issue')
      or public.store_member_has_item_sr_permission(p_token,'approve')
      or public.store_member_has_item_sr_permission(p_token,'issue');
$$;

grant execute on function public.store_member_can_process_sr(text) to authenticated;

create or replace function public.store_admin_process_sr(
  p_request_id uuid,
  p_action text,
  p_issue_items jsonb default '[]'::jsonb,
  p_admin_note text default null,
  p_token text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action text := lower(trim(p_action));
  v_status text;
  v_item jsonb;
  v_item_id uuid;
  v_qty numeric;
  v_stock numeric;
  v_requested numeric;
  v_issued numeric;
  v_total_remaining numeric;
  v_total_issued numeric;
  v_count integer := 0;
  v_actor uuid := auth.uid();
  v_store_actor uuid;
  v_admin_issue_allowed boolean := false;
begin
  if v_action in ('approve','reject') then
    if public.store_is_admin() then
      null;
    elsif not public.store_member_has_item_sr_permission(p_token,'approve') then
      raise exception 'Item SR approval permission required';
    end if;

  elsif v_action = 'issue' then
    if public.store_is_admin() then
      select coalesce(
        (mr.permissions->'inventory'->>'sr_issue')::boolean,
        (mr.permissions->'item_sr'->>'issue')::boolean,
        false
      )
      into v_admin_issue_allowed
      from public.profiles p
      join public.roles r on r.id = p.role_id
      left join public.member_roles mr on mr.is_active = true and lower(mr.role_name) = lower(r.name)
      where p.id = auth.uid() and p.is_active = true
      limit 1;

      if not coalesce(v_admin_issue_allowed,false) then
        raise exception 'SR Issue permission required for administrator';
      end if;

      select id into v_store_actor
      from public.store_users
      where member_type = 'admin'
        and member_id = auth.uid()::text
        and is_active = true
      limit 1;

      if v_store_actor is null then
        insert into public.store_users(
          login_id,password_hash,is_active,member_type,member_id,access_role,role_name
        )
        values(
          'ADMIN-SR-' || substr(replace(auth.uid()::text,'-',''),1,16),
          extensions.crypt(
            encode(extensions.gen_random_bytes(24),'hex'),
            extensions.gen_salt('bf')
          ),
          true,'admin',auth.uid()::text,'Admin','Admin'
        )
        returning id into v_store_actor;
      end if;
    else
      if not (
        public.store_member_has_inventory_permission(p_token,'sr_issue')
        or public.store_member_has_item_sr_permission(p_token,'issue')
      ) then
        raise exception 'Item SR issue permission required';
      end if;

      select s.store_user_id
      into v_store_actor
      from public.store_sessions s
      join public.store_users u on u.id = s.store_user_id and u.is_active = true
      where s.token_hash = encode(extensions.digest(p_token,'sha256'),'hex')
        and s.expires_at > now()
      limit 1;

      if v_store_actor is null then
        raise exception 'Valid Store member session required for issuing';
      end if;
    end if;

  else
    raise exception 'Not authorized';
  end if;

  if v_action not in ('approve','reject','issue') then
    raise exception 'Invalid action';
  end if;

  select status
  into v_status
  from public.store_service_requests
  where id = p_request_id
  for update;

  if v_status is null then
    raise exception 'Service Request not found';
  end if;

  if v_action = 'approve' then
    if v_status <> 'pending' then
      raise exception 'Only pending requests can be approved';
    end if;

    update public.store_service_requests
    set status = 'approved',
        admin_note = nullif(trim(p_admin_note),''),
        processed_at = now(),
        processed_by = v_actor,
        updated_at = now()
    where id = p_request_id;

  elsif v_action = 'reject' then
    if v_status not in ('pending','approved','partially_issued') then
      raise exception 'This request cannot be rejected';
    end if;

    update public.store_service_requests
    set status = 'rejected',
        admin_note = nullif(trim(p_admin_note),''),
        processed_at = now(),
        processed_by = v_actor,
        updated_at = now()
    where id = p_request_id;

  else
    if v_status not in ('approved','partially_issued') then
      raise exception 'Only approved requests can be issued';
    end if;

    if jsonb_typeof(p_issue_items) <> 'array' then
      raise exception 'Invalid issue data';
    end if;

    for v_item in select value from jsonb_array_elements(p_issue_items) loop
      v_item_id := (v_item->>'item_id')::uuid;
      v_qty := coalesce((v_item->>'quantity')::numeric,0);
      if v_qty <= 0 then continue; end if;

      select ri.requested_quantity, ri.issued_quantity
      into v_requested, v_issued
      from public.store_service_request_items ri
      where ri.service_request_id = p_request_id
        and ri.item_id = v_item_id
      for update;

      if v_requested is null then
        raise exception 'Item is not part of this request';
      end if;
      if v_qty > (v_requested - v_issued) then
        raise exception 'Issue quantity exceeds remaining requested quantity';
      end if;

      select current_stock
      into v_stock
      from public.inventory_items
      where id = v_item_id and is_active = true
      for update;

      if v_stock is null then
        raise exception 'Item is unavailable';
      end if;
      if v_qty > v_stock then
        raise exception 'Issue quantity exceeds current stock';
      end if;

      update public.inventory_items
      set current_stock = current_stock - v_qty,
          updated_at = now()
      where id = v_item_id;

      update public.store_service_request_items
      set issued_quantity = issued_quantity + v_qty
      where service_request_id = p_request_id
        and item_id = v_item_id;

      insert into public.inventory_stock_movements(
        item_id,movement_type,quantity,reference_type,reference_id,note,performed_by
      )
      values(
        v_item_id,'issue',v_qty,'service_request',p_request_id,
        'Store Service Request issue',v_actor
      );

      v_count := v_count + 1;
    end loop;

    select
      coalesce(sum(greatest(requested_quantity-issued_quantity,0)),0),
      coalesce(sum(issued_quantity),0)
    into v_total_remaining, v_total_issued
    from public.store_service_request_items
    where service_request_id = p_request_id;

    if v_total_remaining = 0 then
      v_status := 'issued';
    elsif v_total_issued > 0 then
      v_status := 'partially_issued';
    else
      v_status := 'approved';
    end if;

    update public.store_service_requests
    set status = v_status,
        admin_note = coalesce(nullif(trim(p_admin_note),''),admin_note),
        issued_at = case when v_count > 0 then now() else issued_at end,
        issued_by = case when v_count > 0 then v_store_actor else issued_by end,
        updated_at = now()
    where id = p_request_id;
  end if;

  return jsonb_build_object(
    'id',p_request_id,
    'status',(select status from public.store_service_requests where id=p_request_id),
    'issued_items',v_count
  );
end;
$$;

grant execute on function public.store_admin_process_sr(uuid,text,jsonb,text,text) to authenticated;

create or replace function public.store_get_sr(p_token text, p_sr_number text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.store_sessions%rowtype;
  v_request public.store_service_requests%rowtype;
  v_current jsonb;
  v_approver_name text;
  v_approver_id text;
  v_approver_role text;
  v_issued_name text;
  v_issued_id text;
  v_items jsonb;
begin
  select * into v_session
  from public.store_sessions
  where token_hash=encode(extensions.digest(p_token,'sha256'),'hex')
    and expires_at>now()
  limit 1;

  if v_session.id is null then
    raise exception 'Store session expired. Please login again.';
  end if;

  select * into v_request
  from public.store_service_requests
  where sr_number=trim(p_sr_number)
    and (
      store_user_id=v_session.store_user_id
      or public.store_member_can_process_sr(p_token)
    )
  limit 1;

  if v_request.id is null then
    raise exception 'SR not found';
  end if;

  v_current:=public.store_get_current_user(p_token);

  select coalesce(jsonb_agg(jsonb_build_object(
    'item_id',sri.item_id,
    'item_code',ii.item_code,
    'item_name',ii.item_name,
    'item_type',ii.item_type,
    'specification',ii.specification,
    'brand',ii.brand,
    'model',ii.model,
    'unit',ii.unit,
    'details',ii.details,
    'note',sri.item_note,
    'item_note',sri.item_note,
    'current_stock',ii.current_stock,
    'requested_quantity',sri.requested_quantity,
    'issued_quantity',sri.issued_quantity,
    'remaining_quantity',greatest(sri.requested_quantity-sri.issued_quantity,0)
  ) order by ii.item_name),'[]'::jsonb)
  into v_items
  from public.store_service_request_items sri
  join public.inventory_items ii on ii.id=sri.item_id
  where sri.service_request_id=v_request.id;

  if v_request.processed_by is not null then
    select p.full_name,p.id::text
    into v_approver_name,v_approver_id
    from public.profiles p
    where p.id=v_request.processed_by
    limit 1;
    v_approver_name:=coalesce(v_approver_name,'Administrator');
    v_approver_id:=coalesce(v_approver_id,v_request.processed_by::text);
    v_approver_role:='Administrator';
  end if;

  if v_request.issued_by is not null then
    select coalesce(sm.full_name,tm.full_name,am.full_name,om.full_name,su.login_id),su.login_id
    into v_issued_name,v_issued_id
    from public.store_users su
    left join public.staff_members sm on lower(su.member_type)='staff' and sm.member_id=su.member_id
    left join public.teacher_members tm on lower(su.member_type)='teacher' and tm.member_id=su.member_id
    left join public.account_members am on lower(su.member_type)='accounts' and am.member_id=su.member_id
    left join public.other_members om on lower(su.member_type)='other' and om.member_id=su.member_id
    where su.id=v_request.issued_by
    limit 1;
  end if;

  return jsonb_build_object(
    'id',v_request.id,
    'sr_number',v_request.sr_number,
    'status',v_request.status,
    'class_name',v_request.class_name,
    'department',v_request.department,
    'request_details',v_request.request_details,
    'admin_note',v_request.admin_note,
    'requested_at',v_request.requested_at,
    'processed_at',v_request.processed_at,
    'processed_by',v_request.processed_by,
    'requester_name',coalesce(v_current->>'full_name','Requester'),
    'requester_login_id',coalesce(v_current->>'member_id',v_current->>'login_id'),
    'requester_email',v_current->>'email',
    'requester_phone',v_current->>'phone',
    'requester_whatsapp',v_current->>'whatsapp',
    'approver_name',v_approver_name,
    'approver_id',v_approver_id,
    'approver_role',v_approver_role,
    'issued_by',v_request.issued_by,
    'issued_at',v_request.issued_at,
    'issued_name',v_issued_name,
    'issued_id',v_issued_id,
    'items',v_items
  );
end;
$$;

grant execute on function public.store_get_sr(text,text) to authenticated;
