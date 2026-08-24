alter table public.other_members
  add column if not exists salary numeric(12,2);

drop constraint if exists hr_payroll_member_type_check on public.hr_payroll_sheets;
alter table public.hr_payroll_sheets
  add constraint hr_payroll_member_type_check
  check (member_type in ('teacher','staff','accounts','other'));

create or replace function public.store_hr_admin_list_members(p_search text default null)
returns table(member_id text,member_type text,full_name text,designation text,department text,subject text,salary numeric,phone text,email text,is_active boolean)
language plpgsql security definer set search_path=public as $$
declare q text:=lower(trim(coalesce(p_search,'')));
begin
  if not public.store_is_admin() then raise exception 'HR admin permission required'; end if;
  return query
    select t.member_id,'teacher',t.full_name,t.designation,t.department,t.subject,t.salary,t.phone,t.email,t.is_active
    from public.teacher_members t
    where t.is_active and (q='' or lower(concat_ws(' ',t.member_id,t.full_name,t.designation,t.department,t.subject,t.phone,t.email)) like '%'||q||'%')
    union all
    select s.member_id,'staff',s.full_name,s.designation,s.department,null::text,s.salary,s.phone,s.email,s.is_active
    from public.staff_members s
    where s.is_active and (q='' or lower(concat_ws(' ',s.member_id,s.full_name,s.designation,s.department,s.phone,s.email)) like '%'||q||'%')
    union all
    select a.member_id,'accounts',a.full_name,a.designation,a.department,null::text,a.salary,a.phone,a.email,a.is_active
    from public.account_members a
    where a.is_active and (q='' or lower(concat_ws(' ',a.member_id,a.full_name,a.account_role,a.designation,a.department,a.phone,a.email)) like '%'||q||'%')
    union all
    select o.member_id,'other',o.full_name,o.designation,o.department,null::text,o.salary,o.phone,o.email,o.is_active
    from public.other_members o
    where o.is_active and (q='' or lower(concat_ws(' ',o.member_id,o.full_name,o.role_title,o.designation,o.department,o.phone,o.email)) like '%'||q||'%')
    order by full_name;
end;
$$;

create or replace function public.store_hr_admin_submit_payroll(p_payroll_month date,p_member_id text,p_present_days numeric,p_absent_days numeric,p_deductions numeric default 0)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_member record;v_id uuid;v_salary numeric:=0;v_working numeric:=30;v_per_day numeric;v_gross numeric;v_payable numeric;v_entry uuid;v_voucher text;v_user uuid;
begin
  if not public.store_is_admin() then raise exception 'HR admin permission required'; end if;
  if p_present_days<0 or p_absent_days<0 or p_present_days+p_absent_days>v_working then raise exception 'Attendance days are invalid'; end if;
  select * into v_member from public.store_hr_admin_list_members(p_member_id) x where lower(x.member_id)=lower(trim(p_member_id)) limit 1;
  if v_member.member_id is null then raise exception 'Employee Member ID not found'; end if;
  v_salary:=coalesce(v_member.salary,0);
  if v_salary<=0 then raise exception 'Salary is not configured for this employee'; end if;
  v_per_day:=round(v_salary/v_working,2);
  v_gross:=round(v_per_day*p_present_days,2);
  v_payable:=greatest(0,round(v_gross-coalesce(p_deductions,0),2));
  v_user:=auth.uid();
  insert into public.hr_payroll_sheets(payroll_month,member_id,member_type,member_name,designation,department,base_salary,working_days,present_days,absent_days,per_day_salary,gross_earned,deductions,payable_salary,status,submitted_at,created_by,updated_at)
  values(date_trunc('month',p_payroll_month)::date,trim(p_member_id),v_member.member_type,v_member.full_name,v_member.designation,v_member.department,v_salary,v_working,p_present_days,p_absent_days,v_per_day,v_gross,coalesce(p_deductions,0),v_payable,'submitted',now(),v_user,now())
  on conflict(payroll_month,member_id) do update set member_type=excluded.member_type,member_name=excluded.member_name,designation=excluded.designation,department=excluded.department,base_salary=excluded.base_salary,working_days=excluded.working_days,present_days=excluded.present_days,absent_days=excluded.absent_days,per_day_salary=excluded.per_day_salary,gross_earned=excluded.gross_earned,deductions=excluded.deductions,payable_salary=excluded.payable_salary,status='submitted',submitted_at=now(),updated_at=now()
  returning id into v_id;
  select id,voucher_no into v_entry,v_voucher from public.accounts_entries where lower(trim(party_id))=lower(trim(p_member_id)) and entry_type='salary' and entry_source='salary_sheet' and entry_date=date_trunc('month',p_payroll_month)::date limit 1;
  if v_entry is null then
    v_voucher:='SAL-'||to_char(date_trunc('month',p_payroll_month),'YYYYMM')||'-'||upper(trim(p_member_id));
    while exists(select 1 from public.accounts_entries where voucher_no=v_voucher) loop v_voucher:=v_voucher||'-'||floor(random()*1000)::int; end loop;
    insert into public.accounts_entries(voucher_no,entry_date,entry_type,category,party_type,party_id,party_name,amount,total_amount,paid_amount,due_date,payment_status,purpose,payment_method,description,entry_source,source_ref,created_by)
    values(v_voucher,date_trunc('month',p_payroll_month)::date,'salary','Monthly Salary',v_member.member_type,trim(p_member_id),v_member.full_name,0,v_payable,0,(date_trunc('month',p_payroll_month)+interval '1 month - 1 day')::date,'due','Monthly Salary','cash',format('HR Payroll: %s | Present %s | Absent %s | Base Salary %s | Earned %s | Deduction %s',to_char(p_payroll_month,'YYYY-MM'),p_present_days,p_absent_days,v_salary,v_gross,coalesce(p_deductions,0)),'salary_sheet',v_id::text,v_user)
    returning id into v_entry;
  else
    update public.accounts_entries set party_name=v_member.full_name,total_amount=v_payable,amount=least(coalesce(paid_amount,0),v_payable),paid_amount=least(coalesce(paid_amount,0),v_payable),due_date=(date_trunc('month',p_payroll_month)+interval '1 month - 1 day')::date,payment_status=case when coalesce(paid_amount,0)>=v_payable then 'paid' when coalesce(paid_amount,0)>0 then 'partial' else 'due' end,updated_at=now() where id=v_entry;
  end if;
  update public.hr_payroll_sheets set accounts_entry_id=v_entry,status=case when exists(select 1 from public.accounts_entries a where a.id=v_entry and a.payment_status='paid') then 'paid' when exists(select 1 from public.accounts_entries a where a.id=v_entry and a.paid_amount>0) then 'partial' else 'submitted' end,paid_at=case when exists(select 1 from public.accounts_entries a where a.id=v_entry and a.payment_status='paid') then coalesce(paid_at,now()) else null end,updated_at=now() where id=v_id;
  return jsonb_build_object('id',v_id,'member_id',trim(p_member_id),'member_name',v_member.full_name,'base_salary',v_salary,'present_days',p_present_days,'absent_days',p_absent_days,'per_day_salary',v_per_day,'gross_earned',v_gross,'deductions',coalesce(p_deductions,0),'payable_salary',v_payable,'accounts_entry_id',v_entry,'voucher_no',v_voucher,'status',(select status from public.hr_payroll_sheets where id=v_id));
end;
$$;

grant execute on function public.store_hr_admin_list_members(text) to authenticated;
grant execute on function public.store_hr_admin_submit_payroll(date,text,numeric,numeric,numeric) to authenticated;
