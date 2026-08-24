create or replace function public.store_accounts_list_members(p_token text)
returns table(member_id text, member_type text, full_name text, designation text, department text, subject text, phone text, email text, is_active boolean, status text)
language plpgsql security definer set search_path to 'public'
as $$
begin
  if not public.store_accounts_has_permission(p_token,'dashboard') then raise exception 'Accounts permission required'; end if;
  return query
    select t.member_id,'teacher',t.full_name,t.designation,t.department,t.subject,t.phone,t.email,t.is_active,case when t.is_active then 'Active' else 'Inactive' end from public.teacher_members t
    union all select s.member_id,'staff',s.full_name,s.designation,s.department,s.subject,s.phone,s.email,s.is_active,case when s.is_active then 'Active' else 'Inactive' end from public.staff_members s
    union all select a.member_id,'accounts',a.full_name,a.designation,a.department,a.subject,a.phone,a.email,a.is_active,case when a.is_active then 'Active' else 'Inactive' end from public.account_members a
    union all select o.member_id,'other',o.full_name,o.designation,o.department,o.subject,o.phone,o.email,o.is_active,case when o.is_active then 'Active' else 'Inactive' end from public.other_members o
    union all select st.student_id,'student',st.full_name,'Student',st.admission_class,null,null,st.email,true,coalesce(nullif(st.status,''),'Active') from public.students st
    order by full_name;
end; $$;

create or replace function public.store_accounts_member_summary(p_token text)
returns jsonb
language plpgsql security definer set search_path to 'public'
as $$
declare v_user jsonb; v_member_id text; v_total numeric:=0; v_paid numeric:=0; v_due numeric:=0; v_count bigint:=0; v_next_due date;
begin
  v_user:=public.store_get_current_user(p_token); v_member_id:=nullif(trim(v_user->>'member_id'),''); if v_member_id is null then raise exception 'Member account could not be identified'; end if;
  select count(*),coalesce(sum(coalesce(e.total_amount,e.amount)),0),coalesce(sum(coalesce(e.paid_amount,0)),0),min(e.due_date) filter(where greatest(coalesce(e.total_amount,e.amount)-coalesce(e.paid_amount,0),0)>0 and e.due_date is not null and e.due_date>=current_date)
  into v_count,v_total,v_paid,v_next_due
  from public.accounts_entries e
  where lower(trim(e.party_id))=lower(v_member_id) and e.status='posted';
  v_due:=greatest(v_total-v_paid,0);
  return jsonb_build_object('member_id',v_member_id,'total_amount',v_total,'paid_amount',v_paid,'due_amount',v_due,'entry_count',v_count,'next_due_date',v_next_due);
end; $$;

create or replace function public.store_accounts_member_history(p_token text, p_entry_type text default null)
returns table(id uuid, voucher_no text, entry_date date, entry_type text, category text, party_type text, party_id text, party_name text, amount numeric, total_amount numeric, paid_amount numeric, due_amount numeric, due_date date, payment_status text, payment_method text, account_name text, reference_no text, description text, status text, created_at timestamptz)
language plpgsql security definer set search_path to 'public'
as $$
declare v_user jsonb; v_member_id text;
begin
  v_user:=public.store_get_current_user(p_token); v_member_id:=nullif(trim(v_user->>'member_id'),''); if v_member_id is null then raise exception 'Member account could not be identified'; end if;
  return query select e.id,e.voucher_no,e.entry_date,e.entry_type,e.category,e.party_type,e.party_id,e.party_name,e.amount,coalesce(e.total_amount,e.amount),coalesce(e.paid_amount,0),greatest(coalesce(e.total_amount,e.amount)-coalesce(e.paid_amount,0),0),e.due_date,coalesce(e.payment_status,case when coalesce(e.paid_amount,0)>=coalesce(e.total_amount,e.amount) then 'paid' else 'due' end),e.payment_method,e.account_name,e.reference_no,e.description,e.status,e.created_at
  from public.accounts_entries e where e.party_id is not null and lower(trim(e.party_id))=lower(v_member_id) and e.status='posted' and (nullif(trim(p_entry_type),'') is null or e.entry_type=nullif(trim(p_entry_type),'')) order by e.entry_date desc,e.created_at desc limit 200;
end; $$;
