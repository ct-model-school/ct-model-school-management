create or replace function public.store_list_items(p_token text, p_search text default null)
returns table(id uuid,item_code text,item_name text,item_type text,specification text,brand text,model text,unit text,current_stock numeric,stock_status text)
language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid; v_role text; v_permissions jsonb := '{}'::jsonb; v_item_sr jsonb := '{}'::jsonb;
begin
  select s.store_user_id,u.access_role into v_user_id,v_role from public.store_sessions s join public.store_users u on u.id=s.store_user_id and u.is_active=true where s.token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and s.expires_at>now() limit 1;
  if v_user_id is null then raise exception 'Session expired or invalid'; end if;
  select coalesce(permissions,'{}'::jsonb) into v_permissions from public.member_roles where is_active=true and lower(role_name)=lower(coalesce(v_role,'')) limit 1;
  v_item_sr := coalesce(v_permissions->'item_sr','{}'::jsonb);
  if coalesce((v_permissions->>'sr')::boolean,false) is not true and coalesce((v_item_sr->>'view')::boolean,false) is not true and coalesce((v_item_sr->>'create')::boolean,false) is not true then raise exception 'You do not have Service Request permission'; end if;
  update public.store_sessions set last_seen_at=now() where token_hash=encode(extensions.digest(p_token,'sha256'),'hex');
  return query select i.id,i.item_code,i.item_name,i.item_type,i.specification,i.brand,i.model,i.unit,i.current_stock,case when i.current_stock<=0 then 'Out of Stock' when i.current_stock<=i.reorder_level then 'Low Stock' else 'In Stock' end from public.inventory_items i where i.is_active=true and (nullif(trim(p_search),'') is null or lower(i.item_code) like '%'||lower(trim(p_search))||'%' or lower(i.item_name) like '%'||lower(trim(p_search))||'%' or lower(coalesce(i.item_type,'')) like '%'||lower(trim(p_search))||'%' or lower(coalesce(i.specification,'')) like '%'||lower(trim(p_search))||'%') order by i.item_name;
end;
$$;
grant execute on function public.store_list_items(text,text) to anon, authenticated;

create or replace function public.store_submit_sr(p_token text,p_class_name text,p_department text,p_request_details text,p_items jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_store_user_id uuid; v_role text; v_permissions jsonb := '{}'::jsonb; v_item_sr jsonb := '{}'::jsonb; v_request_id uuid; v_sr_number text; v_item jsonb; v_item_id uuid; v_qty numeric; v_stock numeric; v_count integer:=0;
begin
  select s.store_user_id,u.access_role into v_store_user_id,v_role from public.store_sessions s join public.store_users u on u.id=s.store_user_id and u.is_active=true where s.token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and s.expires_at>now() limit 1;
  if v_store_user_id is null then raise exception 'Session expired or invalid'; end if;
  select coalesce(permissions,'{}'::jsonb) into v_permissions from public.member_roles where is_active=true and lower(role_name)=lower(coalesce(v_role,'')) limit 1;
  v_item_sr := coalesce(v_permissions->'item_sr','{}'::jsonb);
  if coalesce((v_permissions->>'sr')::boolean,false) is not true and coalesce((v_item_sr->>'create')::boolean,false) is not true then raise exception 'You do not have Service Request create permission'; end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'Select at least one item'; end if;
  insert into public.store_service_requests(store_user_id,class_name,department,request_details,status) values(v_store_user_id,nullif(trim(p_class_name),''),nullif(trim(p_department),''),nullif(trim(p_request_details),''),'pending') returning id,sr_number into v_request_id,v_sr_number;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_item_id:=(v_item->>'item_id')::uuid; v_qty:=(v_item->>'quantity')::numeric;
    if v_item_id is null or v_qty is null or v_qty<=0 then raise exception 'Invalid requested item or quantity'; end if;
    select current_stock into v_stock from public.inventory_items where id=v_item_id and is_active=true for update;
    if v_stock is null then raise exception 'Selected item is unavailable'; end if;
    if v_qty>v_stock then raise exception 'Requested quantity exceeds available stock'; end if;
    insert into public.store_service_request_items(service_request_id,item_id,requested_quantity,issued_quantity,item_note) values(v_request_id,v_item_id,v_qty,0,nullif(trim(v_item->>'note'),''));
    v_count:=v_count+1;
  end loop;
  if v_count=0 then raise exception 'Select at least one item'; end if;
  update public.store_sessions set last_seen_at=now() where token_hash=encode(extensions.digest(p_token,'sha256'),'hex');
  return jsonb_build_object('id',v_request_id,'sr_number',v_sr_number,'status','pending');
end;
$$;
grant execute on function public.store_submit_sr(text,text,text,text,jsonb) to anon, authenticated;

create or replace function public.admin_list_sr_items(p_search text default null)
returns table(id uuid,item_code text,item_name text,item_type text,specification text,brand text,model text,unit text,current_stock numeric,stock_status text)
language plpgsql security definer set search_path = '' as $$
declare v_role text;
begin
  select r.name into v_role from public.profiles p join public.roles r on r.id=p.role_id where p.id=auth.uid() and p.is_active=true limit 1;
  if lower(coalesce(v_role,'')) not in ('admin','administrator','super_admin','super admin') then raise exception 'Admin access required'; end if;
  return query select i.id,i.item_code,i.item_name,i.item_type,i.specification,i.brand,i.model,i.unit,i.current_stock,case when i.current_stock<=0 then 'Out of Stock' when i.current_stock<=i.reorder_level then 'Low Stock' else 'In Stock' end from public.inventory_items i where i.is_active=true and (nullif(trim(p_search),'') is null or lower(i.item_code) like '%'||lower(trim(p_search))||'%' or lower(i.item_name) like '%'||lower(trim(p_search))||'%' or lower(coalesce(i.item_type,'')) like '%'||lower(trim(p_search))||'%' or lower(coalesce(i.specification,'')) like '%'||lower(trim(p_search))||'%') order by i.item_name;
end;
$$;
grant execute on function public.admin_list_sr_items(text) to authenticated;

create or replace function public.admin_submit_sr(p_class_name text,p_department text,p_request_details text,p_items jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_role text; v_store_user_id uuid; v_request_id uuid; v_sr_number text; v_item jsonb; v_item_id uuid; v_qty numeric; v_stock numeric; v_count integer:=0; v_login_id text;
begin
  select r.name into v_role from public.profiles p join public.roles r on r.id=p.role_id where p.id=auth.uid() and p.is_active=true limit 1;
  if lower(coalesce(v_role,'')) not in ('admin','administrator','super_admin','super admin') then raise exception 'Admin access required'; end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'Select at least one item'; end if;
  select id into v_store_user_id from public.store_users where member_type='admin' and member_id=auth.uid()::text and is_active=true limit 1;
  if v_store_user_id is null then
    v_login_id := 'ADMIN-SR-'||substr(replace(auth.uid()::text,'-',''),1,16);
    insert into public.store_users(login_id,password_hash,is_active,member_type,member_id,access_role,role_name) values(v_login_id,extensions.crypt(encode(extensions.gen_random_bytes(24),'hex'),extensions.gen_salt('bf')),true,'admin',auth.uid()::text,'Admin','Admin') returning id into v_store_user_id;
  end if;
  insert into public.store_service_requests(store_user_id,class_name,department,request_details,status) values(v_store_user_id,nullif(trim(p_class_name),''),nullif(trim(p_department),''),nullif(trim(p_request_details),''),'pending') returning id,sr_number into v_request_id,v_sr_number;
  for v_item in select value from jsonb_array_elements(p_items) loop
    v_item_id:=(v_item->>'item_id')::uuid; v_qty:=(v_item->>'quantity')::numeric;
    if v_item_id is null or v_qty is null or v_qty<=0 then raise exception 'Invalid requested item or quantity'; end if;
    select current_stock into v_stock from public.inventory_items where id=v_item_id and is_active=true for update;
    if v_stock is null then raise exception 'Selected item is unavailable'; end if;
    if v_qty>v_stock then raise exception 'Requested quantity exceeds available stock'; end if;
    insert into public.store_service_request_items(service_request_id,item_id,requested_quantity,issued_quantity,item_note) values(v_request_id,v_item_id,v_qty,0,nullif(trim(v_item->>'note'),''));
    v_count:=v_count+1;
  end loop;
  if v_count=0 then raise exception 'Select at least one item'; end if;
  return jsonb_build_object('id',v_request_id,'sr_number',v_sr_number,'status','pending');
end;
$$;
grant execute on function public.admin_submit_sr(text,text,text,jsonb) to authenticated;
