-- STORE SETUP STEP 2: FUNCTIONS / BUSINESS LOGIC
-- Depends on STEP 1.

create or replace function public.store_is_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles p where p.id = auth.uid() and p.is_active = true);
$$;

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
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_item public.inventory_items%rowtype;
begin
  if not public.store_is_admin() then raise exception 'Not authorized'; end if;
  if nullif(trim(p_item_name),'') is null then raise exception 'Item name is required'; end if;
  if p_id is null then
    insert into public.inventory_items(item_name,item_type,specification,brand,model,unit,details,current_stock,reorder_level)
    values(trim(p_item_name),nullif(trim(p_item_type),''),nullif(trim(p_specification),''),nullif(trim(p_brand),''),nullif(trim(p_model),''),coalesce(nullif(trim(p_unit),''),'pcs'),nullif(trim(p_details),''),greatest(coalesce(p_current_stock,0),0),greatest(coalesce(p_reorder_level,0),0)) returning * into v_item;
    if v_item.current_stock > 0 then insert into public.inventory_stock_movements(item_id,movement_type,quantity,note,performed_by) values(v_item.id,'opening',v_item.current_stock,'Opening stock',auth.uid()); end if;
  else
    update public.inventory_items set item_name=trim(p_item_name),item_type=nullif(trim(p_item_type),''),specification=nullif(trim(p_specification),''),brand=nullif(trim(p_brand),''),model=nullif(trim(p_model),''),unit=coalesce(nullif(trim(p_unit),''),'pcs'),details=nullif(trim(p_details),''),current_stock=greatest(coalesce(p_current_stock,0),0),reorder_level=greatest(coalesce(p_reorder_level,0),0) where id=p_id returning * into v_item;
    if v_item.id is null then raise exception 'Item not found'; end if;
  end if;
  return to_jsonb(v_item);
end;
$$;

create or replace function public.store_admin_deactivate_item(p_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.store_is_admin() then raise exception 'Not authorized'; end if;
  update public.inventory_items set is_active=false where id=p_id;
end;
$$;

create or replace function public.store_create_user(p_people_profile_id uuid,p_login_id text,p_password text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.store_is_admin() then raise exception 'Not authorized'; end if;
  insert into public.store_users(people_profile_id,login_id,password_hash) values(p_people_profile_id,lower(trim(p_login_id)),crypt(p_password,gen_salt('bf'))) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.store_login(p_login_id text,p_password text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user public.store_users%rowtype; v_token text; v_profile public.people_profiles%rowtype;
begin
  select * into v_user from public.store_users where lower(login_id)=lower(trim(p_login_id)) and is_active=true limit 1;
  if v_user.id is null or crypt(p_password,v_user.password_hash)<>v_user.password_hash then raise exception 'Invalid ID or password'; end if;
  v_token:=encode(gen_random_bytes(32),'hex');
  insert into public.store_sessions(store_user_id,token_hash,expires_at) values(v_user.id,encode(digest(v_token,'sha256'),'hex'),now()+interval '8 hours');
  if v_user.people_profile_id is not null then select * into v_profile from public.people_profiles where id=v_user.people_profile_id; end if;
  return jsonb_build_object('token',v_token,'expires_at',now()+interval '8 hours','user_id',v_user.id,'profile_id',v_user.people_profile_id,'full_name',v_profile.full_name,'photo_url',v_profile.photo_url,'email',v_profile.email,'phone',v_profile.phone,'whatsapp',v_profile.whatsapp,'designation',v_profile.designation,'department',v_profile.department,'class_name',v_profile.class_name,'section',v_profile.section);
end;
$$;

create or replace function public.store_logout(p_token text)
returns void language sql security definer set search_path='' as $$ delete from public.store_sessions where token_hash=encode(digest(p_token,'sha256'),'hex'); $$;

create or replace function public.store_list_items(p_token text,p_search text default null)
returns table(id uuid,item_code text,item_name text,item_type text,specification text,brand text,model text,unit text,current_stock numeric,stock_status text)
language plpgsql security definer set search_path='' as $$
begin
  if not exists(select 1 from public.store_sessions where token_hash=encode(digest(p_token,'sha256'),'hex') and expires_at>now()) then raise exception 'Store session expired. Please login again.'; end if;
  return query select i.id,i.item_code,i.item_name,i.item_type,i.specification,i.brand,i.model,i.unit,i.current_stock,case when i.current_stock<=0 then 'Out of Stock' when i.reorder_level>0 and i.current_stock<=i.reorder_level then 'Low Stock' else 'In Stock' end from public.inventory_items i where i.is_active=true and (nullif(trim(p_search),'') is null or lower(i.item_code) like '%'||lower(trim(p_search))||'%' or lower(i.item_name) like '%'||lower(trim(p_search))||'%' or lower(coalesce(i.item_type,'')) like '%'||lower(trim(p_search))||'%' or lower(coalesce(i.specification,'')) like '%'||lower(trim(p_search))||'%') order by i.item_name limit 50;
end;
$$;

create or replace function public.store_submit_sr(p_token text,p_class_name text,p_department text,p_request_details text,p_items jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_session public.store_sessions%rowtype; v_request public.store_service_requests%rowtype; v_item jsonb; v_stock numeric; v_name text;
begin
  select * into v_session from public.store_sessions where token_hash=encode(digest(p_token,'sha256'),'hex') and expires_at>now() limit 1;
  if v_session.id is null then raise exception 'Store session expired. Please login again.'; end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items)=0 then raise exception 'At least one item is required'; end if;
  for v_item in select * from jsonb_array_elements(p_items) loop
    select current_stock,item_name into v_stock,v_name from public.inventory_items where id=(v_item->>'item_id')::uuid and is_active=true for update;
    if v_stock is null then raise exception 'Item not found or inactive'; end if;
    if (v_item->>'quantity')::numeric<=0 or (v_item->>'quantity')::numeric>v_stock then raise exception 'Insufficient stock for %',v_name; end if;
  end loop;
  insert into public.store_service_requests(store_user_id,class_name,department,request_details) values(v_session.store_user_id,nullif(trim(p_class_name),''),nullif(trim(p_department),''),nullif(trim(p_request_details),'')) returning * into v_request;
  for v_item in select * from jsonb_array_elements(p_items) loop insert into public.store_service_request_items(service_request_id,item_id,requested_quantity,item_note) values(v_request.id,(v_item->>'item_id')::uuid,(v_item->>'quantity')::numeric,nullif(v_item->>'note','')); end loop;
  return jsonb_build_object('id',v_request.id,'sr_number',v_request.sr_number,'status',v_request.status);
end;
$$;

create or replace function public.store_get_sr(p_token text,p_sr_number text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_session public.store_sessions%rowtype; v_request public.store_service_requests%rowtype; v_profile public.people_profiles%rowtype; v_items jsonb;
begin
  select * into v_session from public.store_sessions where token_hash=encode(digest(p_token,'sha256'),'hex') and expires_at>now() limit 1;
  if v_session.id is null then raise exception 'Store session expired. Please login again.'; end if;
  select * into v_request from public.store_service_requests where sr_number=trim(p_sr_number) and store_user_id=v_session.store_user_id;
  if v_request.id is null then raise exception 'SR not found'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('item_id',sri.item_id,'item_code',ii.item_code,'item_name',ii.item_name,'unit',ii.unit,'requested_quantity',sri.requested_quantity,'issued_quantity',sri.issued_quantity,'item_note',sri.item_note) order by ii.item_name),'[]'::jsonb) into v_items from public.store_service_request_items sri join public.inventory_items ii on ii.id=sri.item_id where sri.service_request_id=v_request.id;
  select pp.* into v_profile from public.people_profiles pp join public.store_users su on su.people_profile_id=pp.id where su.id=v_session.store_user_id;
  return jsonb_build_object('id',v_request.id,'sr_number',v_request.sr_number,'status',v_request.status,'class_name',v_request.class_name,'department',v_request.department,'request_details',v_request.request_details,'admin_note',v_request.admin_note,'requested_at',v_request.requested_at,'processed_at',v_request.processed_at,'requester_name',v_profile.full_name,'requester_email',v_profile.email,'requester_phone',v_profile.phone,'requester_whatsapp',v_profile.whatsapp,'items',v_items);
end;
$$;

create or replace function public.store_admin_list_srs(p_search text default null)
returns setof jsonb language plpgsql security definer set search_path='' as $$
declare r record; v_items jsonb;
begin
  if not public.store_is_admin() then raise exception 'Not authorized'; end if;
  for r in select sr.*,su.login_id,pp.full_name,pp.email,pp.phone from public.store_service_requests sr join public.store_users su on su.id=sr.store_user_id left join public.people_profiles pp on pp.id=su.people_profile_id where nullif(trim(p_search),'') is null or lower(sr.sr_number) like '%'||lower(trim(p_search))||'%' or lower(su.login_id) like '%'||lower(trim(p_search))||'%' or lower(coalesce(pp.full_name,'')) like '%'||lower(trim(p_search))||'%' order by sr.requested_at desc loop
    select coalesce(jsonb_agg(jsonb_build_object('item_id',sri.item_id,'item_code',ii.item_code,'item_name',ii.item_name,'unit',ii.unit,'current_stock',ii.current_stock,'requested_quantity',sri.requested_quantity,'issued_quantity',sri.issued_quantity,'remaining_quantity',sri.requested_quantity-sri.issued_quantity,'item_note',sri.item_note) order by ii.item_name),'[]'::jsonb) into v_items from public.store_service_request_items sri join public.inventory_items ii on ii.id=sri.item_id where sri.service_request_id=r.id;
    return next jsonb_build_object('id',r.id,'sr_number',r.sr_number,'requester_name',coalesce(r.full_name,r.login_id),'requester_login_id',r.login_id,'requester_email',r.email,'requester_phone',r.phone,'class_name',r.class_name,'department',r.department,'request_details',r.request_details,'status',r.status,'admin_note',r.admin_note,'requested_at',r.requested_at,'processed_at',r.processed_at,'items',v_items);
  end loop;
end;
$$;

create or replace function public.store_admin_process_sr(p_request_id uuid,p_action text,p_issue_items jsonb default '[]'::jsonb,p_admin_note text default null)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_request public.store_service_requests%rowtype; v_issue jsonb; v_remaining numeric; v_stock numeric; v_qty numeric; v_item_id uuid; v_total_remaining numeric;
begin
  if not public.store_is_admin() then raise exception 'Not authorized'; end if;
  select * into v_request from public.store_service_requests where id=p_request_id for update;
  if v_request.id is null then raise exception 'SR not found'; end if;
  if lower(p_action)='reject' then update public.store_service_requests set status='rejected',admin_note=nullif(trim(p_admin_note),''),processed_at=now(),processed_by=auth.uid() where id=p_request_id; return jsonb_build_object('status','rejected','sr_number',v_request.sr_number); end if;
  if lower(p_action)='approve' then update public.store_service_requests set status='approved',admin_note=nullif(trim(p_admin_note),''),processed_at=now(),processed_by=auth.uid() where id=p_request_id; return jsonb_build_object('status','approved','sr_number',v_request.sr_number); end if;
  if lower(p_action)<>'issue' then raise exception 'Invalid action'; end if;
  for v_issue in select * from jsonb_array_elements(coalesce(p_issue_items,'[]'::jsonb)) loop
    v_item_id:=(v_issue->>'item_id')::uuid; v_qty:=coalesce((v_issue->>'quantity')::numeric,0); if v_qty<=0 then continue; end if;
    select sri.requested_quantity-sri.issued_quantity,ii.current_stock into v_remaining,v_stock from public.store_service_request_items sri join public.inventory_items ii on ii.id=sri.item_id where sri.service_request_id=p_request_id and sri.item_id=v_item_id for update of sri,ii;
    if v_remaining is null then raise exception 'Requested item not found in SR'; end if;
    if v_qty>v_remaining then raise exception 'Issue quantity exceeds remaining requested quantity'; end if;
    if v_qty>v_stock then raise exception 'Insufficient stock while issuing item'; end if;
    update public.store_service_request_items set issued_quantity=issued_quantity+v_qty where service_request_id=p_request_id and item_id=v_item_id;
    update public.inventory_items set current_stock=current_stock-v_qty where id=v_item_id;
    insert into public.inventory_stock_movements(item_id,movement_type,quantity,reference_type,reference_id,note,performed_by) values(v_item_id,'issue',v_qty,'service_request',p_request_id,'Store SR issue',auth.uid());
  end loop;
  select coalesce(sum(requested_quantity-issued_quantity),0) into v_total_remaining from public.store_service_request_items where service_request_id=p_request_id;
  update public.store_service_requests set status=case when v_total_remaining=0 then 'issued' else 'partially_issued' end,admin_note=nullif(trim(p_admin_note),''),processed_at=now(),processed_by=auth.uid() where id=p_request_id;
  return jsonb_build_object('status',case when v_total_remaining=0 then 'issued' else 'partially_issued' end,'sr_number',v_request.sr_number);
end;
$$;

create or replace function public.store_admin_list_members(p_member_type text default 'all',p_search text default null)
returns setof jsonb language plpgsql security definer set search_path='' as $$
declare r record; q text:=lower(trim(coalesce(p_search,'')));
begin
  if not public.store_is_admin() then raise exception 'Not authorized'; end if;
  if lower(p_member_type) in ('all','staff') then for r in select id,member_id,full_name,password_text,role,designation,department,email,phone,whatsapp,nid,address,joining_date,photo_url,details,is_active from public.store_staff_members where q='' or lower(member_id||' '||full_name||' '||coalesce(designation,'')) like '%'||q||'%' order by full_name loop return next jsonb_build_object('member_type','staff','id',r.id,'member_id',r.member_id,'full_name',r.full_name,'password_text',r.password_text,'role',r.role,'designation',r.designation,'department',r.department,'email',r.email,'phone',r.phone,'whatsapp',r.whatsapp,'nid',r.nid,'address',r.address,'joining_date',r.joining_date,'photo_url',r.photo_url,'details',r.details,'is_active',r.is_active); end loop; end if;
  if lower(p_member_type) in ('all','teacher') then for r in select id,member_id,full_name,password_text,role,subject,designation,department,email,phone,whatsapp,nid,address,joining_date,photo_url,details,is_active from public.store_teacher_members where q='' or lower(member_id||' '||full_name||' '||coalesce(subject,'')||' '||coalesce(designation,'')) like '%'||q||'%' order by full_name loop return next jsonb_build_object('member_type','teacher','id',r.id,'member_id',r.member_id,'full_name',r.full_name,'password_text',r.password_text,'role',r.role,'subject',r.subject,'designation',r.designation,'department',r.department,'email',r.email,'phone',r.phone,'whatsapp',r.whatsapp,'nid',r.nid,'address',r.address,'joining_date',r.joining_date,'photo_url',r.photo_url,'details',r.details,'is_active',r.is_active); end loop; end if;
  if lower(p_member_type) in ('all','accounts') then for r in select id,member_id,full_name,password_text,role,designation,department,email,phone,whatsapp,nid,address,joining_date,photo_url,details,is_active from public.store_accounts_members where q='' or lower(member_id||' '||full_name||' '||coalesce(designation,'')) like '%'||q||'%' order by full_name loop return next jsonb_build_object('member_type','accounts','id',r.id,'member_id',r.member_id,'full_name',r.full_name,'password_text',r.password_text,'role',r.role,'designation',r.designation,'department',r.department,'email',r.email,'phone',r.phone,'whatsapp',r.whatsapp,'nid',r.nid,'address',r.address,'joining_date',r.joining_date,'photo_url',r.photo_url,'details',r.details,'is_active',r.is_active); end loop; end if;
end;
$$;

create or replace function public.store_admin_save_member(p_member_type text,p_id uuid default null,p_full_name text default null,p_password text default null,p_role text default null,p_designation text default null,p_department text default null,p_subject text default null,p_email text default null,p_phone text default null,p_whatsapp text default null,p_nid text default null,p_address text default null,p_joining_date date default null,p_photo_url text default null,p_details jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_id text; v_row jsonb; t text:=lower(trim(p_member_type));
begin
  if not public.store_is_admin() then raise exception 'Not authorized'; end if;
  if nullif(trim(p_full_name),'') is null then raise exception 'Full name is required'; end if;
  if nullif(trim(p_password),'') is null then raise exception 'Password is required'; end if;
  if t='staff' then
    if p_id is null then v_id:=public.store_generate_member_id('STID','public.store_staff_id_seq'); insert into public.store_staff_members(member_id,full_name,password_text,role,designation,department,email,phone,whatsapp,nid,address,joining_date,photo_url,details) values(v_id,trim(p_full_name),p_password,coalesce(nullif(trim(p_role),''),'Staff'),nullif(trim(p_designation),''),nullif(trim(p_department),''),nullif(trim(p_email),''),nullif(trim(p_phone),''),nullif(trim(p_whatsapp),''),nullif(trim(p_nid),''),nullif(trim(p_address),''),p_joining_date,nullif(trim(p_photo_url),''),coalesce(p_details,'{}')); else update public.store_staff_members set full_name=trim(p_full_name),password_text=p_password,role=coalesce(nullif(trim(p_role),''),'Staff'),designation=nullif(trim(p_designation),''),department=nullif(trim(p_department),''),email=nullif(trim(p_email),''),phone=nullif(trim(p_phone),''),whatsapp=nullif(trim(p_whatsapp),''),nid=nullif(trim(p_nid),''),address=nullif(trim(p_address),''),joining_date=p_joining_date,photo_url=nullif(trim(p_photo_url),''),details=coalesce(p_details,'{}') where id=p_id returning member_id into v_id; end if;
  elsif t='teacher' then
    if p_id is null then v_id:=public.store_generate_member_id('TCID','public.store_teacher_id_seq'); insert into public.store_teacher_members(member_id,full_name,password_text,role,subject,designation,department,email,phone,whatsapp,nid,address,joining_date,photo_url,details) values(v_id,trim(p_full_name),p_password,coalesce(nullif(trim(p_role),''),'Teacher'),nullif(trim(p_subject),''),nullif(trim(p_designation),''),nullif(trim(p_department),''),nullif(trim(p_email),''),nullif(trim(p_phone),''),nullif(trim(p_whatsapp),''),nullif(trim(p_nid),''),nullif(trim(p_address),''),p_joining_date,nullif(trim(p_photo_url),''),coalesce(p_details,'{}')); else update public.store_teacher_members set full_name=trim(p_full_name),password_text=p_password,role=coalesce(nullif(trim(p_role),''),'Teacher'),subject=nullif(trim(p_subject),''),designation=nullif(trim(p_designation),''),department=nullif(trim(p_department),''),email=nullif(trim(p_email),''),phone=nullif(trim(p_phone),''),whatsapp=nullif(trim(p_whatsapp),''),nid=nullif(trim(p_nid),''),address=nullif(trim(p_address),''),joining_date=p_joining_date,photo_url=nullif(trim(p_photo_url),''),details=coalesce(p_details,'{}') where id=p_id returning member_id into v_id; end if;
  elsif t='accounts' then
    if p_id is null then v_id:=public.store_generate_member_id('ACID','public.store_accounts_id_seq'); insert into public.store_accounts_members(member_id,full_name,password_text,role,designation,department,email,phone,whatsapp,nid,address,joining_date,photo_url,details) values(v_id,trim(p_full_name),p_password,coalesce(nullif(trim(p_role),''),'Accounts'),coalesce(nullif(trim(p_designation),''),'Accounts'),coalesce(nullif(trim(p_department),''),'Accounts'),nullif(trim(p_email),''),nullif(trim(p_phone),''),nullif(trim(p_whatsapp),''),nullif(trim(p_nid),''),nullif(trim(p_address),''),p_joining_date,nullif(trim(p_photo_url),''),coalesce(p_details,'{}')); else update public.store_accounts_members set full_name=trim(p_full_name),password_text=p_password,role=coalesce(nullif(trim(p_role),''),'Accounts'),designation=nullif(trim(p_designation),''),department=coalesce(nullif(trim(p_department),''),'Accounts'),email=nullif(trim(p_email),''),phone=nullif(trim(p_phone),''),whatsapp=nullif(trim(p_whatsapp),''),nid=nullif(trim(p_nid),''),address=nullif(trim(p_address),''),joining_date=p_joining_date,photo_url=nullif(trim(p_photo_url),''),details=coalesce(p_details,'{}') where id=p_id returning member_id into v_id; end if;
  else raise exception 'Unsupported member type'; end if;
  return jsonb_build_object('member_id',v_id);
end;
$$;

create or replace function public.store_admin_remove_member(p_member_type text,p_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.store_is_admin() then raise exception 'Not authorized'; end if;
  case lower(trim(p_member_type)) when 'staff' then update public.store_staff_members set is_active=false where id=p_id; when 'teacher' then update public.store_teacher_members set is_active=false where id=p_id; when 'accounts' then update public.store_accounts_members set is_active=false where id=p_id; else raise exception 'Unsupported member type'; end case;
end;
$$;
