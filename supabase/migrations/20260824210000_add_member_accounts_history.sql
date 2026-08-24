create or replace function public.store_accounts_member_history(
  p_token text,
  p_entry_type text default null
)
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
  payment_method text,
  account_name text,
  reference_no text,
  description text,
  status text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path='public'
as $$
declare
  v_user jsonb;
  v_member_id text;
begin
  v_user := public.store_get_current_user(p_token);
  v_member_id := nullif(trim(v_user->>'member_id'),'');

  if v_member_id is null then
    raise exception 'Member account could not be identified';
  end if;

  return query
    select
      e.id,
      e.voucher_no,
      e.entry_date,
      e.entry_type,
      e.category,
      e.party_type,
      e.party_id,
      e.party_name,
      e.amount,
      e.payment_method,
      e.account_name,
      e.reference_no,
      e.description,
      e.status,
      e.created_at
    from public.accounts_entries e
    where e.party_id is not null
      and lower(trim(e.party_id)) = lower(v_member_id)
      and e.status = 'posted'
      and (nullif(trim(p_entry_type),'') is null or e.entry_type = nullif(trim(p_entry_type),''))
    order by e.entry_date desc, e.created_at desc
    limit 200;
end;
$$;

grant execute on function public.store_accounts_member_history(text,text) to anon, authenticated;
