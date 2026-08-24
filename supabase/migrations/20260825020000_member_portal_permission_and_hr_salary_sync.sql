-- Member portal RBAC + HR salary visibility fix.
-- Role permissions are already stored centrally. This migration makes the member Accounts
-- view authoritative from the HR payroll sheet and the linked Accounts entry.

create or replace function public.store_accounts_member_summary(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user jsonb;
  v_member_id text;
  v_salary numeric := 0;
  v_payroll_month date;
  v_payable numeric := 0;
  v_salary_paid numeric := 0;
  v_salary_due numeric := 0;
  v_old_due numeric := 0;
  v_total numeric := 0;
  v_paid numeric := 0;
  v_due numeric := 0;
  v_next_due date;
  v_entry_id uuid;
begin
  v_user := public.store_get_current_user(p_token);
  v_member_id := nullif(trim(v_user->>'member_id'),'');
  if v_member_id is null then raise exception 'Member account could not be identified'; end if;
  if not public.store_accounts_has_permission(p_token,'salary_payment') and not public.store_accounts_has_permission(p_token,'dashboard') then
    raise exception 'Salary & Accounts permission required';
  end if;

  v_salary := public.store_get_member_salary(v_member_id);

  select h.payroll_month,h.payable_salary,h.accounts_entry_id
    into v_payroll_month,v_payable,v_entry_id
  from public.hr_payroll_sheets h
  where lower(trim(h.member_id))=lower(v_member_id)
    and h.status <> 'cancelled'
  order by h.payroll_month desc, h.updated_at desc
  limit 1;

  if v_entry_id is not null then
    select coalesce(e.paid_amount,0),greatest(coalesce(e.total_amount,e.amount)-coalesce(e.paid_amount,0),0)
      into v_salary_paid,v_salary_due
    from public.accounts_entries e
    where e.id=v_entry_id and e.status='posted';
  end if;

  if v_payroll_month is not null and v_salary_due=0 and v_salary_paid=0 then
    v_salary_due:=greatest(coalesce(v_payable,0),0);
  end if;

  select coalesce(sum(greatest(coalesce(e.total_amount,e.amount)-coalesce(e.paid_amount,0),0)),0)
    into v_old_due
  from public.accounts_entries e
  where lower(trim(e.party_id))=lower(v_member_id)
    and e.status='posted'
    and greatest(coalesce(e.total_amount,e.amount)-coalesce(e.paid_amount,0),0)>0
    and not (
      e.entry_type='salary'
      and v_payroll_month is not null
      and e.entry_date=v_payroll_month
      and coalesce(e.entry_source,'manual')='salary_sheet'
    );

  v_total:=coalesce(v_payable,0)+v_old_due;
  v_paid:=v_salary_paid;
  v_due:=v_salary_due+v_old_due;

  select min(e.due_date)
    into v_next_due
  from public.accounts_entries e
  where lower(trim(e.party_id))=lower(v_member_id)
    and e.status='posted'
    and greatest(coalesce(e.total_amount,e.amount)-coalesce(e.paid_amount,0),0)>0
    and e.due_date is not null;

  if v_payroll_month is not null and v_salary_due>0 then
    v_next_due:=least(coalesce(v_next_due,(v_payroll_month+interval '1 month - 1 day')::date),(v_payroll_month+interval '1 month - 1 day')::date);
  end if;

  return jsonb_build_object(
    'member_id',v_member_id,
    'base_salary',v_salary,
    'salary_sheet_total',coalesce(v_payable,0),
    'salary_sheet_paid',v_salary_paid,
    'salary_sheet_due',v_salary_due,
    'old_due',v_old_due,
    'total_amount',v_total,
    'paid_amount',v_paid,
    'due_amount',v_due,
    'entry_count',(select count(*) from public.accounts_entries e where lower(trim(e.party_id))=lower(v_member_id) and e.status='posted'),
    'next_due_date',v_next_due
  );
end;
$$;

grant execute on function public.store_accounts_member_summary(text) to anon, authenticated;

create or replace function public.store_accounts_member_history_v2(p_token text)
returns table(
  id uuid,
  voucher_no text,
  entry_date date,
  entry_type text,
  category text,
  party_type text,
  party_id text,
  party_name text,
  amount numeric,
  total_amount numeric,
  paid_amount numeric,
  due_amount numeric,
  due_date date,
  payment_status text,
  payment_method text,
  account_name text,
  reference_no text,
  description text,
  status text,
  created_at timestamptz,
  entry_source text,
  display_group text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user jsonb;
  v_member_id text;
  v_payroll record;
  v_entry public.accounts_entries%rowtype;
begin
  v_user:=public.store_get_current_user(p_token);
  v_member_id:=nullif(trim(v_user->>'member_id'),'');
  if v_member_id is null then raise exception 'Member account could not be identified'; end if;
  if not public.store_accounts_has_permission(p_token,'salary_payment') and not public.store_accounts_has_permission(p_token,'dashboard') then
    raise exception 'Salary & Accounts permission required';
  end if;

  select h.* into v_payroll
  from public.hr_payroll_sheets h
  where lower(trim(h.member_id))=lower(v_member_id)
    and h.status <> 'cancelled'
  order by h.payroll_month desc, h.updated_at desc
  limit 1;

  if v_payroll.accounts_entry_id is not null then
    select * into v_entry from public.accounts_entries e where e.id=v_payroll.accounts_entry_id and e.status='posted' limit 1;
  end if;

  if v_payroll.id is not null and v_entry.id is null then
    return query
      select
        v_payroll.id,
        'SAL-'||to_char(v_payroll.payroll_month,'YYYYMM')||'-'||upper(v_payroll.member_id),
        v_payroll.payroll_month,
        'salary'::text,
        'Monthly Salary'::text,
        v_payroll.member_type,
        v_payroll.member_id,
        v_payroll.member_name,
        0::numeric,
        coalesce(v_payroll.payable_salary,0)::numeric,
        0::numeric,
        greatest(coalesce(v_payroll.payable_salary,0),0)::numeric,
        (v_payroll.payroll_month+interval '1 month - 1 day')::date,
        'due'::text,
        'cash'::text,
        null::text,
        null::text,
        format('HR Payroll: %s | Present %s | Absent %s | Base Salary %s | Earned %s | Deduction %s',to_char(v_payroll.payroll_month,'YYYY-MM'),v_payroll.present_days,v_payroll.absent_days,v_payroll.base_salary,v_payroll.gross_earned,v_payroll.deductions),
        'posted'::text,
        v_payroll.created_at,
        'salary_sheet'::text,
        'salary_sheet'::text;
  elsif v_entry.id is not null then
    return query
      select
        v_entry.id,v_entry.voucher_no,v_entry.entry_date,v_entry.entry_type,v_entry.category,v_entry.party_type,v_entry.party_id,v_entry.party_name,
        v_entry.amount,coalesce(v_entry.total_amount,v_entry.amount),coalesce(v_entry.paid_amount,0),
        greatest(coalesce(v_entry.total_amount,v_entry.amount)-coalesce(v_entry.paid_amount,0),0),v_entry.due_date,
        coalesce(v_entry.payment_status,case when coalesce(v_entry.paid_amount,0)>=coalesce(v_entry.total_amount,v_entry.amount) then 'paid' else 'due' end),
        v_entry.payment_method,v_entry.account_name,v_entry.reference_no,v_entry.description,v_entry.status,v_entry.created_at,
        coalesce(v_entry.entry_source,'salary_sheet'),'salary_sheet'::text;
  end if;

  return query
    select
      e.id,e.voucher_no,e.entry_date,e.entry_type,e.category,e.party_type,e.party_id,e.party_name,e.amount,
      coalesce(e.total_amount,e.amount),coalesce(e.paid_amount,0),greatest(coalesce(e.total_amount,e.amount)-coalesce(e.paid_amount,0),0),e.due_date,
      coalesce(e.payment_status,case when coalesce(e.paid_amount,0)>=coalesce(e.total_amount,e.amount) then 'paid' else 'due' end),
      e.payment_method,e.account_name,e.reference_no,e.description,e.status,e.created_at,coalesce(e.entry_source,'manual'),
      'old_due'::text
    from public.accounts_entries e
    where lower(trim(e.party_id))=lower(v_member_id)
      and e.status='posted'
      and not (
        e.entry_type='salary'
        and v_payroll.id is not null
        and e.entry_date=v_payroll.payroll_month
        and coalesce(e.entry_source,'manual')='salary_sheet'
      )
    order by e.entry_date desc,e.created_at desc
    limit 200;
end;
$$;

grant execute on function public.store_accounts_member_history_v2(text) to anon, authenticated;
