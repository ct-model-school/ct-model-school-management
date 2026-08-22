-- People & Achievements admin RPCs. Apply after 20260823_people_master_data.sql.

create or replace function public.people_admin_save_profile(p_payload jsonb, p_id uuid default null)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not exists (select 1 from public.profiles where id=auth.uid() and is_active=true) then raise exception 'Not authorized'; end if;
  if p_id is null then
    insert into public.people_profiles(category,full_name,photo_url,designation,department,subject,committee_name,committee_position,responsibility,job_title,class_name,section,academic_year,exam_name,result_value,achievement_type,scholarship_type,achievement_year,achievement_details,short_description,email,phone,whatsapp,is_active,display_order)
    select category,full_name,photo_url,designation,department,subject,committee_name,committee_position,responsibility,job_title,class_name,section,academic_year,exam_name,result_value,achievement_type,scholarship_type,achievement_year,achievement_details,short_description,email,phone,whatsapp,coalesce(is_active,true),coalesce(display_order,0) from jsonb_populate_record(null::public.people_profiles,p_payload) returning id into v_id;
  else
    update public.people_profiles set category=p_payload->>'category',full_name=p_payload->>'full_name',photo_url=nullif(p_payload->>'photo_url',''),designation=nullif(p_payload->>'designation',''),department=nullif(p_payload->>'department',''),subject=nullif(p_payload->>'subject',''),committee_name=nullif(p_payload->>'committee_name',''),committee_position=nullif(p_payload->>'committee_position',''),responsibility=nullif(p_payload->>'responsibility',''),job_title=nullif(p_payload->>'job_title',''),class_name=nullif(p_payload->>'class_name',''),section=nullif(p_payload->>'section',''),academic_year=nullif(p_payload->>'academic_year',''),exam_name=nullif(p_payload->>'exam_name',''),result_value=nullif(p_payload->>'result_value',''),achievement_type=nullif(p_payload->>'achievement_type',''),scholarship_type=nullif(p_payload->>'scholarship_type',''),achievement_year=nullif(p_payload->>'achievement_year',''),achievement_details=nullif(p_payload->>'achievement_details',''),short_description=nullif(p_payload->>'short_description',''),email=nullif(p_payload->>'email',''),phone=nullif(p_payload->>'phone',''),whatsapp=nullif(p_payload->>'whatsapp',''),is_active=coalesce((p_payload->>'is_active')::boolean,true),display_order=coalesce((p_payload->>'display_order')::integer,0) where id=p_id returning id into v_id;
  end if;
  return v_id;
end; $$;

create or replace function public.people_admin_set_active(p_id uuid,p_active boolean) returns void language plpgsql security definer set search_path='' as $$ begin if not exists(select 1 from public.profiles where id=auth.uid() and is_active=true) then raise exception 'Not authorized'; end if; update public.people_profiles set is_active=p_active where id=p_id; end; $$;
create or replace function public.people_admin_delete(p_id uuid) returns void language plpgsql security definer set search_path='' as $$ begin if not exists(select 1 from public.profiles where id=auth.uid() and is_active=true) then raise exception 'Not authorized'; end if; delete from public.people_profiles where id=p_id; end; $$;
create or replace function public.people_admin_master_upsert(p_type text,p_value text,p_sort_order integer default 0) returns uuid language plpgsql security definer set search_path='' as $$ declare v_id uuid; begin if not exists(select 1 from public.profiles where id=auth.uid() and is_active=true) then raise exception 'Not authorized'; end if; insert into public.school_master_data(master_type,value,sort_order) values(p_type,trim(p_value),p_sort_order) on conflict(master_type,value) do update set sort_order=excluded.sort_order,is_active=true,updated_at=now() returning id into v_id; return v_id; end; $$;
create or replace function public.people_admin_master_set_active(p_id uuid,p_active boolean) returns void language plpgsql security definer set search_path='' as $$ begin if not exists(select 1 from public.profiles where id=auth.uid() and is_active=true) then raise exception 'Not authorized'; end if; update public.school_master_data set is_active=p_active,updated_at=now() where id=p_id; end; $$;

grant execute on function public.people_admin_save_profile(jsonb,uuid) to authenticated;
grant execute on function public.people_admin_set_active(uuid,boolean) to authenticated;
grant execute on function public.people_admin_delete(uuid) to authenticated;
grant execute on function public.people_admin_master_upsert(text,text,integer) to authenticated;
grant execute on function public.people_admin_master_set_active(uuid,boolean) to authenticated;
