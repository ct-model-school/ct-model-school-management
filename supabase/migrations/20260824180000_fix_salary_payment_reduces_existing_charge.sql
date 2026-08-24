create or replace function public.store_accounts_save_entry_v2(p_token text,p_entry_type text,p_entry_date date,p_category text,p_party_type text,p_party_id text,p_party_name text,p_total_amount numeric,p_paid_amount numeric,p_due_date date,p_payment_method text,p_account_name text,p_reference_no text,p_description text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_user jsonb; v_voucher text; v_id uuid; v_total numeric; v_paid numeric; v_due numeric; v_status text; v_perm text; v_target public.accounts_entries%rowtype; v_member_salary numeric:=0; v_payment numeric;
begin
 v_user:=public.store_get_current_user(p_token);
 v_perm:=case when p_entry_type in ('income','student_fee') then 'income' when p_entry_type in ('expense','salary','cash_out','bank_out') then 'expense' when p_entry_type in ('vendor_payment','school_bill','other_payment') then p_entry_type else 'vouchers' end;
 if not public.store_accounts_has_permission(p_token,v_perm) and not public.store_accounts_has_permission(p_token,'dashboard') then raise exception 'You do not have permission for this Accounts action'; end if;
 if p_entry_type not in ('income','expense','student_fee','salary','vendor_payment','school_bill','other_payment','cash_in','cash_out','bank_in','bank_out','bank_transfer','journal') then raise exception 'Invalid Accounts entry type'; end if;
 v_total:=coalesce(p_total_amount,0); v_paid:=coalesce(p_paid_amount,0); v_due:=greatest(v_total-v_paid,0);
 if v_total<=0 then raise exception 'Amount must be greater than zero'; end if;
 if p_entry_type in ('cash_in','cash_out','bank_in','bank_out','bank_transfer','journal') then v_due:=0; v_paid:=v_total; v_status:='posted'; else if v_paid<0 or v_paid>v_total then raise exception 'Paid amount must be between zero and total payable amount'; end if; if v_due>0 and p_due_date is null then raise exception 'Due date is required when an amount remains due'; end if; v_status:=case when v_paid>=v_total then 'paid' when v_paid>0 then 'partial' else 'due' end; end if;
 if p_entry_type='salary' and v_paid>0 and lower(coalesce(p_category,'')) in ('monthly salary','basic salary') and nullif(trim(p_party_id),'') is not null then
   v_member_salary:=public.store_get_member_salary(trim(p_party_id));
   select e.* into v_target from public.accounts_entries e
   where lower(trim(e.party_id))=lower(trim(p_party_id)) and e.status='posted' and e.entry_type='salary'
     and greatest(coalesce(e.total_amount,e.amount)-coalesce(e.paid_amount,0),0)>0
   order by case when e.entry_source='salary_sheet' then 0 when coalesce(e.total_amount,e.amount)=v_member_salary and v_member_salary>0 then 1 else 2 end,e.entry_date desc,e.created_at desc limit 1;
   if v_target.id is not null then
     v_payment:=least(v_paid,greatest(coalesce(v_target.total_amount,v_target.amount)-coalesce(v_target.paid_amount,0),0));
     update public.accounts_entries set paid_amount=coalesce(paid_amount,0)+v_payment,amount=coalesce(paid_amount,0)+v_payment,
       payment_status=case when coalesce(paid_amount,0)+v_payment>=coalesce(total_amount,amount) then 'paid' else 'partial' end,
       payment_method=coalesce(nullif(trim(p_payment_method),''),payment_method),reference_no=coalesce(nullif(trim(p_reference_no),''),reference_no),description=coalesce(nullif(trim(p_description),''),description),updated_at=now() where id=v_target.id returning * into v_target;
     return jsonb_build_object('id',v_target.id,'voucher_no',v_target.voucher_no,'member_id',v_target.party_id,'total_amount',v_target.total_amount,'paid_amount',v_target.paid_amount,'due_amount',greatest(coalesce(v_target.total_amount,v_target.amount)-coalesce(v_target.paid_amount,0),0),'payment_status',v_target.payment_status,'due_date',v_target.due_date,'payment_applied',true);
   end if;
 end if;
 v_voucher:='ACC-'||to_char(coalesce(p_entry_date,current_date),'YYYYMMDD')||'-'||lpad((select(count(*)+1)::text from public.accounts_entries where entry_date=coalesce(p_entry_date,current_date)),4,'0');
 while exists(select 1 from public.accounts_entries where voucher_no=v_voucher) loop v_voucher:='ACC-'||to_char(coalesce(p_entry_date,current_date),'YYYYMMDD')||'-'||lpad((floor(random()*9000)+1000)::int::text,4,'0'); end loop;
 insert into public.accounts_entries(voucher_no,entry_date,entry_type,category,party_type,party_id,party_name,amount,total_amount,paid_amount,due_date,payment_status,purpose,payment_method,account_name,reference_no,description,created_by,entry_source)
 values(v_voucher,coalesce(p_entry_date,current_date),p_entry_type,nullif(trim(p_category),''),nullif(trim(p_party_type),''),nullif(trim(p_party_id),''),nullif(trim(p_party_name),''),v_paid,v_total,v_paid,p_due_date,v_status,nullif(trim(p_category),''),coalesce(nullif(trim(p_payment_method),''),'cash'),nullif(trim(p_account_name),''),nullif(trim(p_reference_no),''),nullif(trim(p_description),''),(v_user->>'user_id')::uuid,'manual') returning id into v_id;
 return jsonb_build_object('id',v_id,'voucher_no',v_voucher,'member_id',nullif(trim(p_party_id),''),'total_amount',v_total,'paid_amount',v_paid,'due_amount',v_due,'payment_status',v_status,'due_date',p_due_date,'payment_applied',false);
end; $$;
