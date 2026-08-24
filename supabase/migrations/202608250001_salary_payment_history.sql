create table if not exists public.hr_salary_payment_history (
  id uuid primary key default gen_random_uuid(),
  payroll_id uuid not null references public.hr_payroll_sheets(id) on delete cascade,
  member_id text not null,
  member_type text,
  member_name text,
  amount numeric not null check (amount > 0),
  payment_method text not null default 'cash',
  reference_no text,
  description text,
  paid_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists hr_salary_payment_history_payroll_idx on public.hr_salary_payment_history(payroll_id, paid_at desc);
create index if not exists hr_salary_payment_history_member_idx on public.hr_salary_payment_history(member_id, paid_at desc);

insert into public.hr_salary_payment_history (payroll_id,member_id,member_type,member_name,amount,payment_method,reference_no,description,paid_at)
select h.id,h.member_id,h.member_type,h.member_name,e.paid_amount,coalesce(e.payment_method,'cash'),e.reference_no,e.description,coalesce(h.paid_at,e.updated_at,e.created_at)
from public.hr_payroll_sheets h join public.accounts_entries e on e.id=h.accounts_entry_id
where coalesce(e.paid_amount,0)>0 and not exists (select 1 from public.hr_salary_payment_history p where p.payroll_id=h.id);

create or replace function public.store_accounts_pay_salary_sheet(p_token text,p_payroll_id uuid,p_payment_amount numeric default null,p_payment_method text default 'cash',p_reference_no text default null,p_description text default null)
returns jsonb language plpgsql security definer set search_path to 'public' as $function$
declare h public.hr_payroll_sheets%rowtype; e public.accounts_entries%rowtype; v_total numeric; v_due numeric; v_pay numeric; v_new_paid numeric; v_status text;
begin
 if not public.store_accounts_has_permission(p_token,'salary_payment') then raise exception 'Salary payment permission required'; end if;
 select * into h from public.hr_payroll_sheets where id=p_payroll_id for update; if not found then raise exception 'Salary sheet not found'; end if;
 if h.accounts_entry_id is null then raise exception 'Salary sheet is not linked to Accounts'; end if;
 select * into e from public.accounts_entries where id=h.accounts_entry_id and status='posted' for update; if not found then raise exception 'Accounts salary entry not found'; end if;
 v_total:=coalesce(e.total_amount,h.payable_salary,0); v_due:=greatest(v_total-coalesce(e.paid_amount,0),0);
 if v_due<=0 then update public.hr_payroll_sheets set status='paid',paid_at=coalesce(paid_at,now()),updated_at=now() where id=h.id; update public.accounts_entries set payment_status='paid',paid_amount=v_total,amount=v_total,updated_at=now() where id=e.id; return jsonb_build_object('id',h.id,'status','paid','total_amount',v_total,'paid_amount',v_total,'due_amount',0); end if;
 v_pay:=case when p_payment_amount is null then v_due else greatest(p_payment_amount,0) end; if v_pay<=0 then raise exception 'Payment amount must be greater than zero'; end if; if v_pay>v_due then v_pay:=v_due; end if;
 v_new_paid:=coalesce(e.paid_amount,0)+v_pay; v_due:=greatest(v_total-v_new_paid,0); v_status:=case when v_due=0 then 'paid' else 'partial' end;
 insert into public.hr_salary_payment_history(payroll_id,member_id,member_type,member_name,amount,payment_method,reference_no,description,paid_at) values(h.id,h.member_id,h.member_type,h.member_name,v_pay,coalesce(nullif(trim(p_payment_method),''),'cash'),nullif(trim(p_reference_no),''),nullif(trim(p_description),''),now());
 update public.accounts_entries set paid_amount=v_new_paid,amount=v_new_paid,payment_status=v_status,payment_method=coalesce(nullif(trim(p_payment_method),''),payment_method),reference_no=coalesce(nullif(trim(p_reference_no),''),reference_no),description=coalesce(nullif(trim(p_description),''),description),updated_at=now() where id=e.id;
 update public.hr_payroll_sheets set status=v_status,paid_at=case when v_status='paid' then coalesce(paid_at,now()) else paid_at end,updated_at=now() where id=h.id;
 return jsonb_build_object('id',h.id,'voucher_no',e.voucher_no,'total_amount',v_total,'paid_amount',v_new_paid,'due_amount',v_due,'status',v_status);
end;
$function$;

create or replace function public.store_accounts_member_history_v2(p_token text)
returns table(id uuid,voucher_no text,entry_date date,entry_type text,category text,party_type text,party_id text,party_name text,amount numeric,total_amount numeric,paid_amount numeric,due_amount numeric,due_date date,payment_status text,payment_method text,account_name text,reference_no text,description text,status text,created_at timestamptz,entry_source text,display_group text)
language plpgsql security definer set search_path to 'public' as $function$
declare v_user jsonb; v_member_id text; v_payroll record; v_entry public.accounts_entries%rowtype;
begin
 if not public.store_accounts_has_permission(p_token,'salary_history') and not public.store_accounts_has_permission(p_token,'salary_status') then raise exception 'Salary history permission required'; end if;
 v_user:=public.store_get_current_user(p_token); v_member_id:=nullif(trim(v_user->>'member_id'),''); if v_member_id is null then raise exception 'Member account could not be identified'; end if;
 select h.* into v_payroll from public.hr_payroll_sheets h where lower(trim(h.member_id))=lower(v_member_id) and h.status<>'cancelled' order by h.payroll_month desc,h.updated_at desc limit 1;
 if v_payroll.accounts_entry_id is not null then select * into v_entry from public.accounts_entries e where e.id=v_payroll.accounts_entry_id and e.status='posted' limit 1; end if;
 if v_payroll.id is not null and v_entry.id is null then return query select v_payroll.id,'SAL-'||to_char(v_payroll.payroll_month,'YYYYMM')||'-'||upper(v_payroll.member_id),v_payroll.payroll_month,'salary'::text,'Monthly Salary'::text,v_payroll.member_type,v_payroll.member_id,v_payroll.member_name,0::numeric,coalesce(v_payroll.payable_salary,0)::numeric,0::numeric,greatest(coalesce(v_payroll.payable_salary,0),0)::numeric,(v_payroll.payroll_month+interval '1 month - 1 day')::date,'due'::text,'cash'::text,null::text,null::text,format('HR Payroll: %s | Present %s | Absent %s | Base Salary %s | Earned %s | Deduction %s',to_char(v_payroll.payroll_month,'YYYY-MM'),v_payroll.present_days,v_payroll.absent_days,v_payroll.base_salary,v_payroll.gross_earned,v_payroll.deductions),'posted'::text,v_payroll.created_at,'salary_sheet'::text,'salary_sheet'::text;
 elsif v_entry.id is not null then return query select v_entry.id,v_entry.voucher_no,v_entry.entry_date,v_entry.entry_type,v_entry.category,v_entry.party_type,v_entry.party_id,v_entry.party_name,v_entry.amount,coalesce(v_entry.total_amount,v_entry.amount),coalesce(v_entry.paid_amount,0),greatest(coalesce(v_entry.total_amount,v_entry.amount)-coalesce(v_entry.paid_amount,0),0),v_entry.due_date,coalesce(v_entry.payment_status,case when coalesce(v_entry.paid_amount,0)>=coalesce(v_entry.total_amount,v_entry.amount) then 'paid' else 'due' end),v_entry.payment_method,v_entry.account_name,v_entry.reference_no,v_entry.description,v_entry.status,v_entry.created_at,coalesce(v_entry.entry_source,'salary_sheet'),'salary_sheet'::text; end if;
 return query select p.id,'SALPAY-'||to_char(h.payroll_month,'YYYYMM')||'-'||to_char(p.paid_at,'DDHH24MISS')||'-'||substr(replace(p.id::text,'-',''),1,6),p.paid_at::date,'salary_payment'::text,'Salary Payment - '||to_char(h.payroll_month,'FMMonth YYYY'),p.member_type,p.member_id,p.member_name,p.amount,p.amount,p.amount,0::numeric,(h.payroll_month+interval '1 month - 1 day')::date,'paid'::text,p.payment_method,null::text,p.reference_no,p.description,'posted'::text,p.paid_at,'salary_payment'::text,'salary_payment'::text from public.hr_salary_payment_history p left join public.hr_payroll_sheets h on h.id=p.payroll_id where lower(trim(p.member_id))=lower(v_member_id) order by p.paid_at desc;
 return query select e.id,e.voucher_no,e.entry_date,e.entry_type,e.category,e.party_type,e.party_id,e.party_name,e.amount,coalesce(e.total_amount,e.amount),coalesce(e.paid_amount,0),greatest(coalesce(e.total_amount,e.amount)-coalesce(e.paid_amount,0),0),e.due_date,coalesce(e.payment_status,case when coalesce(e.paid_amount,0)>=coalesce(e.total_amount,e.amount) then 'paid' else 'due' end),e.payment_method,e.account_name,e.reference_no,e.description,e.status,e.created_at,coalesce(e.entry_source,'manual'),'old_due'::text from public.accounts_entries e where lower(trim(e.party_id))=lower(v_member_id) and e.status='posted' and not (e.entry_type='salary' and v_payroll.id is not null and e.entry_date=v_payroll.payroll_month and coalesce(e.entry_source,'manual')='salary_sheet') order by e.entry_date desc,e.created_at desc limit 200;
end;
$function$;