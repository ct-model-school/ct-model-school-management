create table if not exists public.accounts_entries (
  id uuid primary key default gen_random_uuid(),
  voucher_no text not null unique,
  entry_date date not null default current_date,
  entry_type text not null,
  category text,
  party_type text,
  party_id text,
  party_name text,
  amount numeric(14,2) not null check (amount > 0),
  payment_method text not null default 'cash',
  account_name text,
  reference_no text,
  description text,
  status text not null default 'posted',
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists accounts_entries_date_idx on public.accounts_entries(entry_date desc);
create index if not exists accounts_entries_type_idx on public.accounts_entries(entry_type, entry_date desc);
create index if not exists accounts_entries_party_idx on public.accounts_entries(party_name);

create table if not exists public.accounts_account_heads (
  id uuid primary key default gen_random_uuid(),
  head_type text not null,
  head_name text not null,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(head_type, head_name)
);

insert into public.accounts_account_heads(head_type, head_name, display_order) values
 ('income','Student Fees',1),('income','Donation',2),('income','Rental',3),('income','Other Income',4),
 ('expense','Salary',1),('expense','Utilities',2),('expense','Purchase',3),('expense','Maintenance',4),('expense','Events',5),('expense','Other Expense',6),
 ('payment','Vendor Payment',1),('payment','School Bill',2),('payment','Other Member',3)
on conflict (head_type, head_name) do nothing;

alter table public.accounts_entries enable row level security;
alter table public.accounts_account_heads enable row level security;
revoke all on public.accounts_entries from public, anon, authenticated;
revoke all on public.accounts_account_heads from public, anon, authenticated;

drop function if exists public.store_accounts_has_permission(text,text);
create function public.store_accounts_has_permission(p_token text, p_key text)
returns boolean language plpgsql security definer set search_path='' as $$
declare v_user jsonb; v_accounts jsonb;
begin
  v_user := public.store_get_current_user(p_token);
  v_accounts := v_user->'permissions'->'accounts';
  return coalesce((v_accounts->>p_key)::boolean,false) or coalesce((v_accounts)::boolean,false);
exception when others then return false;
end; $$;
grant execute on function public.store_accounts_has_permission(text,text) to anon, authenticated;

create or replace function public.store_accounts_summary(p_token text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user jsonb; v_income numeric:=0; v_expense numeric:=0; v_cash numeric:=0; v_bank numeric:=0; v_count bigint:=0;
begin
  v_user := public.store_get_current_user(p_token);
  if not public.store_accounts_has_permission(p_token,'dashboard') then raise exception 'Accounts dashboard permission required'; end if;
  select count(*) filter(where status='posted'),
         coalesce(sum(amount) filter(where status='posted' and entry_type in ('income','student_fee')),0),
         coalesce(sum(amount) filter(where status='posted' and entry_type in ('expense','salary','vendor_payment','school_bill','other_payment')),0),
         coalesce(sum(case when status='posted' and payment_method='cash' and entry_type in ('income','student_fee') then amount when status='posted' and payment_method='cash' and entry_type in ('expense','salary','vendor_payment','school_bill','other_payment') then -amount else 0 end),0),
         coalesce(sum(case when status='posted' and payment_method='bank' and entry_type in ('income','student_fee') then amount when status='posted' and payment_method='bank' and entry_type in ('expense','salary','vendor_payment','school_bill','other_payment') then -amount else 0 end),0)
    into v_count,v_income,v_expense,v_cash,v_bank
  from public.accounts_entries;
  return jsonb_build_object('income',v_income,'expense',v_expense,'net',v_income-v_expense,'cash',v_cash,'bank',v_bank,'transactions',v_count);
end; $$;
grant execute on function public.store_accounts_summary(text) to anon, authenticated;

create or replace function public.store_accounts_list_entries(p_token text, p_type text default null, p_search text default null)
returns table(id uuid,voucher_no text,entry_date date,entry_type text,category text,party_type text,party_id text,party_name text,amount numeric,payment_method text,account_name text,reference_no text,description text,status text,created_at timestamptz)
language plpgsql security definer set search_path='' as $$
begin
  if not public.store_accounts_has_permission(p_token,'dashboard') then raise exception 'Accounts permission required'; end if;
  return query
  select e.id,e.voucher_no,e.entry_date,e.entry_type,e.category,e.party_type,e.party_id,e.party_name,e.amount,e.payment_method,e.account_name,e.reference_no,e.description,e.status,e.created_at
  from public.accounts_entries e
  where (nullif(trim(p_type),'') is null or e.entry_type=nullif(trim(p_type),''))
    and (nullif(trim(p_search),'') is null or e.voucher_no ilike '%'||trim(p_search)||'%' or coalesce(e.party_name,'') ilike '%'||trim(p_search)||'%' or coalesce(e.category,'') ilike '%'||trim(p_search)||'%')
  order by e.entry_date desc,e.created_at desc limit 200;
end; $$;
grant execute on function public.store_accounts_list_entries(text,text,text) to anon, authenticated;

create or replace function public.store_accounts_save_entry(
  p_token text,p_entry_type text,p_entry_date date,p_category text,p_party_type text,p_party_id text,p_party_name text,p_amount numeric,p_payment_method text,p_account_name text,p_reference_no text,p_description text
) returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user jsonb; v_perm text; v_voucher text; v_id uuid;
begin
  v_user := public.store_get_current_user(p_token);
  v_perm := case when p_entry_type in ('income','student_fee') then 'income' when p_entry_type in ('expense','salary') then 'expense' when p_entry_type in ('vendor_payment','school_bill','other_payment') then p_entry_type else 'vouchers' end;
  if not public.store_accounts_has_permission(p_token,v_perm) and not public.store_accounts_has_permission(p_token,'dashboard') then raise exception 'You do not have permission for this Accounts action'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'Amount must be greater than zero'; end if;
  if p_entry_type not in ('income','expense','student_fee','salary','vendor_payment','school_bill','other_payment') then raise exception 'Invalid Accounts entry type'; end if;
  v_voucher := 'ACC-'||to_char(coalesce(p_entry_date,current_date),'YYYYMMDD')||'-'||lpad((select (count(*)+1)::text from public.accounts_entries where entry_date=coalesce(p_entry_date,current_date)),4,'0');
  while exists(select 1 from public.accounts_entries where voucher_no=v_voucher) loop
    v_voucher := 'ACC-'||to_char(coalesce(p_entry_date,current_date),'YYYYMMDD')||'-'||lpad((floor(random()*9000)+1000)::int::text,4,'0');
  end loop;
  insert into public.accounts_entries(voucher_no,entry_date,entry_type,category,party_type,party_id,party_name,amount,payment_method,account_name,reference_no,description,created_by)
  values(v_voucher,coalesce(p_entry_date,current_date),p_entry_type,nullif(trim(p_category),''),nullif(trim(p_party_type),''),nullif(trim(p_party_id),''),nullif(trim(p_party_name),''),p_amount,coalesce(nullif(trim(p_payment_method),''),'cash'),nullif(trim(p_account_name),''),nullif(trim(p_reference_no),''),nullif(trim(p_description),''),(v_user->>'user_id')::uuid)
  returning id into v_id;
  return jsonb_build_object('id',v_id,'voucher_no',v_voucher);
end; $$;
grant execute on function public.store_accounts_save_entry(text,text,date,text,text,text,text,numeric,text,text,text,text) to anon, authenticated;

create or replace function public.store_accounts_void_entry(p_token text,p_id uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
  if not public.store_accounts_has_permission(p_token,'vouchers') and not public.store_accounts_has_permission(p_token,'dashboard') then raise exception 'Accounts permission required'; end if;
  update public.accounts_entries set status='void',updated_at=now() where id=p_id and status='posted';
end; $$;
grant execute on function public.store_accounts_void_entry(text,uuid) to anon, authenticated;

create or replace function public.store_accounts_list_payees(p_token text)
returns table(member_id text,member_type text,full_name text,designation text,department text,salary numeric)
language plpgsql security definer set search_path='' as $$
begin
  if not public.store_accounts_has_permission(p_token,'salary_payment') and not public.store_accounts_has_permission(p_token,'other_member_payment') then raise exception 'Accounts payment permission required'; end if;
  return query
    select t.member_id,'teacher',t.full_name,t.designation,t.department,t.salary from public.teacher_members t where t.is_active=true
    union all select s.member_id,'staff',s.full_name,s.designation,s.department,s.salary from public.staff_members s where s.is_active=true
    union all select a.member_id,'accounts',a.full_name,a.designation,a.department,a.salary from public.account_members a where a.is_active=true
    union all select o.member_id,'other',o.full_name,o.designation,o.department,null::numeric from public.other_members o where o.is_active=true
    order by full_name;
end; $$;
grant execute on function public.store_accounts_list_payees(text) to anon, authenticated;
