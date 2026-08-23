-- Unified member portal: canonical member auth metadata, role permissions, SR authorization and recovery requests.

create index if not exists store_users_member_lookup_idx on public.store_users(member_type, member_id);
create index if not exists store_users_record_lookup_idx on public.store_users(member_record_id);

update public.member_roles
set permissions = permissions || jsonb_build_object('sr', coalesce((permissions->>'sr')::boolean, false))
where is_active = true;

insert into public.member_roles(role_name, permissions, is_system, is_active)
select 'Store', '{"dashboard":true,"students":false,"parents":false,"people":false,"teachers":false,"accounts":false,"store_members":false,"inventory":true,"notices":true,"results":false,"sr":true}'::jsonb, true, true
where not exists (select 1 from public.member_roles where lower(role_name)='store');

create or replace function public.store_sync_member_record()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_record_id uuid;
begin
  if lower(coalesce(new.member_type,''))='staff' then select id into v_record_id from public.staff_members where member_id=new.member_id limit 1;
  elsif lower(coalesce(new.member_type,''))='teacher' then select id into v_record_id from public.teacher_members where member_id=new.member_id limit 1;
  elsif lower(coalesce(new.member_type,''))='accounts' then select id into v_record_id from public.account_members where member_id=new.member_id limit 1;
  elsif lower(coalesce(new.member_type,''))='other' then select id into v_record_id from public.other_members where member_id=new.member_id limit 1;
  end if;
  new.member_record_id := v_record_id;
  new.role_name := coalesce(new.role_name, new.access_role);
  return new;
end;
$$;

drop trigger if exists trg_store_users_sync_member_record on public.store_users;
create trigger trg_store_users_sync_member_record before insert or update of member_type, member_id, access_role, role_name on public.store_users for each row execute function public.store_sync_member_record();

update public.store_users u
set member_record_id = case lower(u.member_type)
  when 'staff' then (select id from public.staff_members m where m.member_id=u.member_id limit 1)
  when 'teacher' then (select id from public.teacher_members m where m.member_id=u.member_id limit 1)
  when 'accounts' then (select id from public.account_members m where m.member_id=u.member_id limit 1)
  when 'other' then (select id from public.other_members m where m.member_id=u.member_id limit 1)
  else null end,
  role_name = coalesce(u.role_name, u.access_role);

create or replace function public.store_get_current_user(p_token text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_user public.store_users%rowtype; v_permissions jsonb := '{}'::jsonb;
  v_full_name text; v_photo_url text; v_email text; v_phone text; v_whatsapp text;
  v_designation text; v_department text; v_subject text; v_qualification text; v_salary numeric; v_details text; v_access_role text;
begin
  select u.* into v_user from public.store_sessions s join public.store_users u on u.id=s.store_user_id and u.is_active=true
  where s.token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and s.expires_at>now() limit 1;
  if v_user.id is null then raise exception 'Session expired or invalid'; end if;
  select coalesce(mr.permissions, '{}'::jsonb) into v_permissions from public.member_roles mr where mr.is_active=true and lower(mr.role_name)=lower(coalesce(v_user.access_role,v_user.role_name,'')) limit 1;

  if lower(v_user.member_type)='staff' then
    select full_name,photo_url,email,phone,whatsapp,designation,department,qualification,salary,details,access_role into v_full_name,v_photo_url,v_email,v_phone,v_whatsapp,v_designation,v_department,v_qualification,v_salary,v_details,v_access_role from public.staff_members where member_id=v_user.member_id and is_active=true;
  elsif lower(v_user.member_type)='teacher' then
    select full_name,photo_url,email,phone,whatsapp,designation,department,subject,qualification,salary,details,access_role into v_full_name,v_photo_url,v_email,v_phone,v_whatsapp,v_designation,v_department,v_subject,v_qualification,v_salary,v_details,v_access_role from public.teacher_members where member_id=v_user.member_id and is_active=true;
  elsif lower(v_user.member_type)='accounts' then
    select full_name,photo_url,email,phone,whatsapp,designation,department,account_role,qualification,salary,details,access_role into v_full_name,v_photo_url,v_email,v_phone,v_whatsapp,v_designation,v_department,v_subject,v_qualification,v_salary,v_details,v_access_role from public.account_members where member_id=v_user.member_id and is_active=true;
  elsif lower(v_user.member_type)='other' then
    select full_name,photo_url,email,phone,whatsapp,designation,department,role_title,details,access_role into v_full_name,v_photo_url,v_email,v_phone,v_whatsapp,v_designation,v_department,v_subject,v_details,v_access_role from public.other_members where member_id=v_user.member_id and is_active=true;
  end if;
  if v_full_name is null then raise exception 'Member profile is inactive or unavailable'; end if;
  update public.store_sessions set last_seen_at=now() where token_hash=encode(extensions.digest(p_token,'sha256'),'hex');
  return jsonb_build_object('user_id',v_user.id,'member_record_id',v_user.member_record_id,'member_id',v_user.member_id,'member_type',v_user.member_type,'access_role',coalesce(v_user.access_role,v_access_role,v_user.role_name),'role_name',coalesce(v_user.role_name,v_user.access_role,v_access_role),'permissions',v_permissions,'full_name',v_full_name,'photo_url',v_photo_url,'email',v_email,'phone',v_phone,'whatsapp',v_whatsapp,'designation',coalesce(v_designation,v_subject),'department',v_department,'subject',v_subject,'qualification',v_qualification,'salary',v_salary,'details',v_details);
end;
$$;

create or replace function public.store_login(p_login_id text, p_password text, p_member_type text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user public.store_users%rowtype; v_token text; v_profile jsonb;
begin
  select * into v_user from public.store_users where lower(login_id)=lower(trim(p_login_id)) and is_active=true and (nullif(trim(p_member_type),'') is null or lower(member_type)=lower(trim(p_member_type))) limit 1;
  if v_user.id is null or v_user.password_hash is null or extensions.crypt(p_password,v_user.password_hash)<>v_user.password_hash then raise exception 'Invalid ID or password'; end if;
  v_token:=encode(extensions.gen_random_bytes(32),'hex');
  delete from public.store_sessions where expires_at<=now();
  insert into public.store_sessions(store_user_id,token_hash,expires_at) values(v_user.id,encode(extensions.digest(v_token,'sha256'),'hex'),now()+interval '8 hours');
  v_profile:=public.store_get_current_user(v_token);
  return v_profile || jsonb_build_object('token',v_token,'expires_at',now()+interval '8 hours');
end;
$$;

create or replace function public.store_login(p_login_id text, p_password text)
returns jsonb language plpgsql security definer set search_path = '' as $$ begin return public.store_login(p_login_id,p_password,null); end; $$;

create or replace function public.store_change_password(p_token text, p_current_password text, p_new_password text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_user public.store_users%rowtype; v_hash text;
begin
  select u.* into v_user from public.store_sessions s join public.store_users u on u.id=s.store_user_id and u.is_active=true where s.token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and s.expires_at>now() limit 1;
  if v_user.id is null then raise exception 'Session expired or invalid'; end if;
  if extensions.crypt(p_current_password,v_user.password_hash)<>v_user.password_hash then raise exception 'Current password is incorrect'; end if;
  if length(coalesce(p_new_password,''))<8 then raise exception 'New password must be at least 8 characters'; end if;
  v_hash:=extensions.crypt(p_new_password,extensions.gen_salt('bf'));
  update public.store_users set password_hash=v_hash,updated_at=now() where id=v_user.id;
  if lower(v_user.member_type)='staff' then update public.staff_members set password_hash=v_hash,updated_at=now() where id=v_user.member_record_id;
  elsif lower(v_user.member_type)='teacher' then update public.teacher_members set password_hash=v_hash,updated_at=now() where id=v_user.member_record_id;
  elsif lower(v_user.member_type)='accounts' then update public.account_members set password_hash=v_hash,updated_at=now() where id=v_user.member_record_id;
  elsif lower(v_user.member_type)='other' then update public.other_members set password_hash=v_hash,updated_at=now() where id=v_user.member_record_id; end if;
  return jsonb_build_object('success',true);
end;
$$;

create table if not exists public.member_password_reset_requests (
  id uuid primary key default gen_random_uuid(), login_id text not null, member_type text,
  contact_hint text, status text not null default 'pending' check (status in ('pending','completed','cancelled')),
  created_at timestamptz not null default now(), handled_at timestamptz, handled_by uuid
);
alter table public.member_password_reset_requests enable row level security;
revoke all on table public.member_password_reset_requests from anon, authenticated;

create or replace function public.store_request_password_reset(p_login_id text, p_member_type text, p_contact_hint text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_exists boolean;
begin
  select exists(select 1 from public.store_users where lower(login_id)=lower(trim(p_login_id)) and is_active=true and (nullif(trim(p_member_type),'') is null or lower(member_type)=lower(trim(p_member_type)))) into v_exists;
  if not v_exists then return jsonb_build_object('success',true); end if;
  insert into public.member_password_reset_requests(login_id,member_type,contact_hint) values(lower(trim(p_login_id)),nullif(trim(p_member_type),''),nullif(trim(p_contact_hint),''));
  return jsonb_build_object('success',true);
end;
$$;

grant execute on function public.store_get_current_user(text) to anon, authenticated;
grant execute on function public.store_login(text,text,text) to anon, authenticated;
grant execute on function public.store_login(text,text) to anon, authenticated;
grant execute on function public.store_change_password(text,text,text) to anon, authenticated;
grant execute on function public.store_request_password_reset(text,text,text) to anon, authenticated;

create or replace function public.store_list_items(p_token text, p_search text default null)
returns table(id uuid,item_code text,item_name text,item_type text,specification text,brand text,model text,unit text,current_stock numeric,stock_status text)
language plpgsql security definer set search_path = '' as $$
declare v_user_id uuid; v_role text; v_permissions jsonb;
begin
  select s.store_user_id,u.access_role into v_user_id,v_role from public.store_sessions s join public.store_users u on u.id=s.store_user_id and u.is_active=true where s.token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and s.expires_at>now() limit 1;
  if v_user_id is null then raise exception 'Session expired or invalid'; end if;
  select coalesce(permissions,'{}'::jsonb) into v_permissions from public.member_roles where is_active=true and lower(role_name)=lower(coalesce(v_role,'')) limit 1;
  if coalesce((v_permissions->>'sr')::boolean,false) is not true then raise exception 'You do not have Service Request permission'; end if;
  update public.store_sessions set last_seen_at=now() where token_hash=encode(extensions.digest(p_token,'sha256'),'hex');
  return query select i.id,i.item_code,i.item_name,i.item_type,i.specification,i.brand,i.model,i.unit,i.current_stock,case when i.current_stock<=0 then 'Out of Stock' when i.current_stock<=i.reorder_level then 'Low Stock' else 'In Stock' end from public.inventory_items i where i.is_active=true and (nullif(trim(p_search),'') is null or lower(i.item_code) like '%'||lower(trim(p_search))||'%' or lower(i.item_name) like '%'||lower(trim(p_search))||'%' or lower(coalesce(i.item_type,'')) like '%'||lower(trim(p_search))||'%' or lower(coalesce(i.specification,'')) like '%'||lower(trim(p_search))||'%') order by i.item_name;
end;
$$;

create or replace function public.store_submit_sr(p_token text,p_class_name text,p_department text,p_request_details text,p_items jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_store_user_id uuid; v_role text; v_permissions jsonb; v_request_id uuid; v_sr_number text; v_item jsonb; v_item_id uuid; v_qty numeric; v_stock numeric; v_count integer:=0;
begin
  select s.store_user_id,u.access_role into v_store_user_id,v_role from public.store_sessions s join public.store_users u on u.id=s.store_user_id and u.is_active=true where s.token_hash=encode(extensions.digest(p_token,'sha256'),'hex') and s.expires_at>now() limit 1;
  if v_store_user_id is null then raise exception 'Session expired or invalid'; end if;
  select coalesce(permissions,'{}'::jsonb) into v_permissions from public.member_roles where is_active=true and lower(role_name)=lower(coalesce(v_role,'')) limit 1;
  if coalesce((v_permissions->>'sr')::boolean,false) is not true then raise exception 'You do not have Service Request permission'; end if;
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
