alter table public.accounts_entries add column if not exists entry_source text not null default 'manual';
alter table public.accounts_entries add column if not exists source_ref text;

create index if not exists idx_accounts_entries_party_source on public.accounts_entries(party_id, entry_type, entry_source, entry_date desc, created_at desc);

with ranked as (
  select e.id,
         row_number() over (partition by lower(trim(e.party_id)) order by e.entry_date desc, e.created_at desc) as rn
  from public.accounts_entries e
  join (
    select member_id, salary from public.teacher_members where salary is not null
    union all select member_id, salary from public.staff_members where salary is not null
    union all select member_id, salary from public.account_members where salary is not null
  ) m on lower(trim(m.member_id))=lower(trim(e.party_id))
  where e.status='posted' and e.entry_type='salary'
    and coalesce(e.total_amount,0)=coalesce(m.salary,0)
)
update public.accounts_entries e
set entry_source='salary_sheet', source_ref=coalesce(source_ref,'legacy-salary-sheet')
from ranked r
where e.id=r.id and r.rn=1;

create or replace function public.store_get_member_salary(p_member_id text)
returns numeric language plpgsql security definer set search_path=public as $$
declare v_salary numeric;
begin
  select salary into v_salary from public.teacher_members where lower(trim(member_id))=lower(trim(p_member_id)) limit 1;
  if v_salary is null then select salary into v_salary from public.staff_members where lower(trim(member_id))=lower(trim(p_member_id)) limit 1; end if;
  if v_salary is null then select salary into v_salary from public.account_members where lower(trim(member_id))=lower(trim(p_member_id)) limit 1; end if;
  return coalesce(v_salary,0);
end; $$;

create or replace function public.store_accounts_member_summary(p_token text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
 v_user jsonb; v_member_id text; v_salary numeric:=0; v_current_date date;
 v_salary_total numeric:=0; v_salary_paid numeric:=0; v_salary_due numeric:=0; v_old_due numeric:=0;
 v_total numeric:=0; v_paid numeric:=0; v_due numeric:=0; v_next_due date;
begin
 v_user:=public.store_get_current_user(p_token); v_member_id:=nullif(trim(v_user->>'member_id'),'');
 if v_member_id is null then raise exception 'Member account could not be identified'; end if;
 v_salary:=public.store_get_member_salary(v_member_id);
 select max(e.entry_date) into v_current_date from public.accounts_entries e
 where lower(trim(e.party_id))=lower(v_member_id) and e.status='posted' and e.entry_type='salary'
   and (e.entry_source='salary_sheet' or (e.entry_source='manual' and coalesce(e.total_amount,e.amount)=v_salary and v_salary>0));
 if v_current_date is not null then
   select coalesce(sum(coalesce(e.total_amount,e.amount)),0),coalesce(sum(coalesce(e.paid_amount,0)),0),
          coalesce(sum(greatest(coalesce(e.total_amount,e.amount)-coalesce(e.paid_amount,0),0)),0)
   into v_salary_total,v_salary_paid,v_salary_due
   from public.accounts_entries e
   where lower(trim(e.party_id))=lower(v_member_id) and e.status='posted' and e.entry_type='salary' and e.entry_date=v_current_date
     and (e.entry_source='salary_sheet' or (e.entry_source='manual' and coalesce(e.total_amount,e.amount)=v_salary and v_salary>0));
 end if;
 select coalesce(sum(greatest(coalesce(e.total_amount,e.amount)-coalesce(e.paid_amount,0),0)),0) into v_old_due
 from public.accounts_entries e
 where lower(trim(e.party_id))=lower(v_member_id) and e.status='posted'
   and greatest(coalesce(e.total_amount,e.amount)-coalesce(e.paid_amount,0),0)>0
   and not (e.entry_type='salary' and v_current_date is not null and e.entry_date=v_current_date
     and (e.entry_source='salary_sheet' or (e.entry_source='manual' and coalesce(e.total_amount,e.amount)=v_salary and v_salary>0)));
 v_total:=v_salary_total+v_old_due; v_paid:=v_salary_paid; v_due:=v_salary_due+v_old_due;
 select min(e.due_date) into v_next_due from public.accounts_entries e
 where lower(trim(e.party_id))=lower(v_member_id) and e.status='posted'
   and greatest(coalesce(e.total_amount,e.amount)-coalesce(e.paid_amount,0),0)>0 and e.due_date is not null;
 return jsonb_build_object('member_id',v_member_id,'base_salary',v_salary,'salary_sheet_total',v_salary_total,'salary_sheet_paid',v_salary_paid,
   'salary_sheet_due',v_salary_due,'old_due',v_old_due,'total_amount',v_total,'paid_amount',v_paid,'due_amount',v_due,
   'entry_count',(select count(*) from public.accounts_entries e where lower(trim(e.party_id))=lower(v_member_id) and e.status='posted'),'next_due_date',v_next_due);
end; $$;

create or replace function public.store_accounts_member_history_v2(p_token text)
returns table(id uuid,voucher_no text,entry_date date,entry_type text,category text,party_type text,party_id text,party_name text,amount numeric,total_amount numeric,paid_amount numeric,due_amount numeric,due_date date,payment_status text,payment_method text,account_name text,reference_no text,description text,status text,created_at timestamptz,entry_source text,display_group text)
language plpgsql security definer set search_path=public as $$
declare v_user jsonb; v_member_id text; v_salary numeric:=0; v_current_date date;
begin
 v_user:=public.store_get_current_user(p_token); v_member_id:=nullif(trim(v_user->>'member_id'),'');
 if v_member_id is null then raise exception 'Member account could not be identified'; end if;
 v_salary:=public.store_get_member_salary(v_member_id);
 select max(e.entry_date) into v_current_date from public.accounts_entries e
 where lower(trim(e.party_id))=lower(v_member_id) and e.status='posted' and e.entry_type='salary'
   and (e.entry_source='salary_sheet' or (e.entry_source='manual' and coalesce(e.total_amount,e.amount)=v_salary and v_salary>0));
 return query select e.id,e.voucher_no,e.entry_date,e.entry_type,e.category,e.party_type,e.party_id,e.party_name,e.amount,
   coalesce(e.total_amount,e.amount),coalesce(e.paid_amount,0),greatest(coalesce(e.total_amount,e.amount)-coalesce(e.paid_amount,0),0),e.due_date,
   coalesce(e.payment_status,case when coalesce(e.paid_amount,0)>=coalesce(e.total_amount,e.amount) then 'paid' else 'due' end),e.payment_method,e.account_name,e.reference_no,e.description,e.status,e.created_at,e.entry_source,
   case when e.entry_type='salary' and v_current_date is not null and e.entry_date=v_current_date and
     (e.entry_source='salary_sheet' or (e.entry_source='manual' and coalesce(e.total_amount,e.amount)=v_salary and v_salary>0)) then 'salary_sheet' else 'old_due' end
 from public.accounts_entries e where lower(trim(e.party_id))=lower(v_member_id) and e.status='posted'
 order by e.entry_date desc,e.created_at desc limit 200;
end; $$;

create or replace function public.store_accounts_record_member_payment(p_token text,p_entry_id uuid,p_payment_amount numeric,p_payment_method text default 'cash',p_reference_no text default null,p_description text default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_user jsonb; v_member_id text; r public.accounts_entries%rowtype; v_new_paid numeric; v_total numeric; v_due numeric; v_status text;
begin
 v_user:=public.store_get_current_user(p_token);
 if not public.store_accounts_has_permission(p_token,'salary_payment') and not public.store_accounts_has_permission(p_token,'dashboard') then raise exception 'Salary payment permission required'; end if;
 v_member_id:=nullif(trim(v_user->>'member_id'),'');
 select * into r from public.accounts_entries where id=p_entry_id and status='posted' for update;
 if not found then raise exception 'Accounts entry not found'; end if;
 if r.party_id is null or lower(trim(r.party_id))<>lower(v_member_id) then raise exception 'This entry is not linked to the current member'; end if;
 if r.entry_type<>'salary' then raise exception 'Only salary entries can use this payment action'; end if;
 if coalesce(p_payment_amount,0)<=0 then raise exception 'Payment amount must be greater than zero'; end if;
 v_total:=coalesce(r.total_amount,r.amount); v_new_paid:=least(v_total,coalesce(r.paid_amount,0)+p_payment_amount); v_due:=greatest(v_total-v_new_paid,0); v_status:=case when v_due=0 then 'paid' when v_new_paid>0 then 'partial' else 'due' end;
 update public.accounts_entries set paid_amount=v_new_paid,amount=v_new_paid,payment_status=v_status,payment_method=coalesce(nullif(trim(p_payment_method),''),payment_method),reference_no=coalesce(nullif(trim(p_reference_no),''),reference_no),description=coalesce(nullif(trim(p_description),''),description),updated_at=now() where id=r.id;
 return jsonb_build_object('id',r.id,'voucher_no',r.voucher_no,'total_amount',v_total,'paid_amount',v_new_paid,'due_amount',v_due,'payment_status',v_status);
end; $$;
