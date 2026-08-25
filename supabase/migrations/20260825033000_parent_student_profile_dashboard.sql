-- Parent dashboard now exposes the linked student record and fee summary.
-- The parent still sees only students linked to their own parent account.

create or replace function public.parent_get_dashboard(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  u public.store_users%rowtype;
  p public.parents%rowtype;
  children jsonb;
begin
  select su.* into u
  from public.store_sessions s
  join public.store_users su on su.id=s.store_user_id and su.is_active=true
  where s.token_hash=encode(extensions.digest(p_token,'sha256'),'hex')
    and s.expires_at>now()
    and lower(su.member_type)='parent'
  limit 1;
  if u.id is null then raise exception 'Invalid parent session'; end if;

  select * into p
  from public.parents
  where (id=u.member_record_id or parent_id=u.member_id)
    and is_active=true
  order by (id=u.member_record_id) desc
  limit 1;
  if p.id is null then raise exception 'Parent account unavailable'; end if;

  select coalesce(jsonb_agg(x.child order by x.sort_date desc),'[]'::jsonb)
    into children
  from (
    select l.created_at as sort_date,
      jsonb_build_object(
        'id',s.id,'registration_no',coalesce(r.registration_no,s.application_no),
        'source',coalesce(r.registration_source,'existing'),'student_id',s.student_id,
        'student_name',s.full_name,'class',s.admission_class,'section',s.section,
        'status',case when s.status='active' then 'approved' else s.status end,'created_at',s.created_at,
        'student',jsonb_build_object(
          'id',s.id,'student_id',s.student_id,'application_no',s.application_no,
          'academic_year',s.academic_year,'admission_class',s.admission_class,'section',s.section,
          'roll_no',s.roll_no,'full_name',s.full_name,'full_name_bn',s.full_name_bn,
          'date_of_birth',s.date_of_birth,'gender',s.gender,'birth_certificate_no',s.birth_certificate_no,
          'religion',s.religion,'blood_group',s.blood_group,'previous_school',s.previous_school,
          'father_name',s.father_name,'father_phone',s.father_phone,'mother_name',s.mother_name,
          'mother_phone',s.mother_phone,'guardian_name',s.guardian_name,'guardian_phone',s.guardian_phone,
          'guardian_relation',s.guardian_relation,'present_address',s.present_address,
          'permanent_address',s.permanent_address,'emergency_contact',s.emergency_contact,
          'email',s.email,'status',s.status,'admission_date',s.admission_date,
          'fee',jsonb_build_object(
            'academic_year',fa.academic_year,'total_charged',coalesce(fa.total_charged,0),
            'total_paid',coalesce(fa.total_paid,0),'total_discount',coalesce(fa.total_discount,0),
            'balance_due',coalesce(fa.balance_due,0)
          )
        )
      ) as child
    from public.student_parent_links l
    join public.students s on s.id=l.student_id
    left join public.parent_student_registration_requests r
      on r.parent_id=l.parent_id
     and (r.student_id=s.student_id or r.requested_student_id=s.student_id)
    left join public.student_fee_accounts fa on fa.student_id=s.id
    where l.parent_id=p.id

    union all

    select r.created_at as sort_date,
      jsonb_build_object(
        'id',r.id,'registration_no',r.registration_no,'source',r.registration_source,
        'student_id',r.student_id,'student_name',r.student_name,'class',r.admission_class,
        'section',r.section,'status',r.status,'created_at',r.created_at,'student',null
      ) as child
    from public.parent_student_registration_requests r
    where r.parent_id=p.id
      and not exists (
        select 1 from public.student_parent_links l2
        join public.students s2 on s2.id=l2.student_id
        where l2.parent_id=p.id
          and (r.student_id=s2.student_id or r.requested_student_id=s2.student_id)
      )
  ) x;

  return jsonb_build_object(
    'parent_id',p.parent_id,'full_name',p.full_name,'phone',p.phone,'email',p.email,'children',children
  );
end;
$$;

grant execute on function public.parent_get_dashboard(text) to anon, authenticated;
