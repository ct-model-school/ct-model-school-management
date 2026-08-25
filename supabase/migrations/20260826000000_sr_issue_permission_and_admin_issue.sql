-- Separate SR Issue permission from SR Approval and enforce it at the database layer.
-- Admins may issue only when their role explicitly has inventory.sr_issue=true.

insert into public.member_roles(role_name, permissions, is_system, is_active)
values
(
  'ADMIN',
  '{"dashboard":true,"students":true,"parents":true,"people":true,"teachers":true,"accounts":true,"store_members":true,"inventory":{"view":true,"add":true,"edit":true,"remove":true,"sr_approval":true,"sr_issue":false},"notices":true,"results":true}'::jsonb,
  true,
  true
),
(
  'SUPER_ADMIN',
  '{"dashboard":true,"students":true,"parents":true,"people":true,"teachers":true,"accounts":true,"store_members":true,"inventory":{"view":true,"add":true,"edit":true,"remove":true,"sr_approval":true,"sr_issue":false},"notices":true,"results":true}'::jsonb,
  true,
  true
)
on conflict (role_name) do update
set permissions = public.member_roles.permissions || excluded.permissions,
    updated_at = now();

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
      if not public.store_member_has_item_sr_permission(p_token,'issue') then
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
