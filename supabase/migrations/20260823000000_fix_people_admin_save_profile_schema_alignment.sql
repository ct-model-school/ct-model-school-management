CREATE OR REPLACE FUNCTION public.people_admin_save_profile(p_payload jsonb, p_id uuid DEFAULT NULL::uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
declare
  v_id uuid;
begin
  if not exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
  ) then
    raise exception 'Not authorized';
  end if;

  if p_id is null then
    insert into public.people_profiles (
      category,
      full_name,
      photo_url,
      designation,
      department,
      subject,
      committee_name,
      committee_position,
      responsibility,
      class_name,
      section,
      academic_year,
      exam_name,
      result_value,
      achievement_type,
      scholarship_type,
      achievement_details,
      short_description,
      email,
      phone,
      whatsapp,
      is_active,
      display_order
    )
    values (
      p_payload->>'category',
      p_payload->>'full_name',
      nullif(p_payload->>'photo_url',''),
      nullif(p_payload->>'designation',''),
      nullif(p_payload->>'department',''),
      nullif(p_payload->>'subject',''),
      nullif(p_payload->>'committee_name',''),
      nullif(p_payload->>'committee_position',''),
      nullif(p_payload->>'responsibility',''),
      nullif(p_payload->>'class_name',''),
      nullif(p_payload->>'section',''),
      nullif(p_payload->>'academic_year',''),
      nullif(p_payload->>'exam_name',''),
      nullif(p_payload->>'result_value',''),
      nullif(p_payload->>'achievement_type',''),
      nullif(p_payload->>'scholarship_type',''),
      nullif(p_payload->>'achievement_details',''),
      nullif(p_payload->>'short_description',''),
      nullif(p_payload->>'email',''),
      nullif(p_payload->>'phone',''),
      nullif(p_payload->>'whatsapp',''),
      coalesce((p_payload->>'is_active')::boolean, true),
      coalesce((p_payload->>'display_order')::integer, 0)
    )
    returning id into v_id;
  else
    update public.people_profiles
    set
      category = p_payload->>'category',
      full_name = p_payload->>'full_name',
      photo_url = nullif(p_payload->>'photo_url',''),
      designation = nullif(p_payload->>'designation',''),
      department = nullif(p_payload->>'department',''),
      subject = nullif(p_payload->>'subject',''),
      committee_name = nullif(p_payload->>'committee_name',''),
      committee_position = nullif(p_payload->>'committee_position',''),
      responsibility = nullif(p_payload->>'responsibility',''),
      class_name = nullif(p_payload->>'class_name',''),
      section = nullif(p_payload->>'section',''),
      academic_year = nullif(p_payload->>'academic_year',''),
      exam_name = nullif(p_payload->>'exam_name',''),
      result_value = nullif(p_payload->>'result_value',''),
      achievement_type = nullif(p_payload->>'achievement_type',''),
      scholarship_type = nullif(p_payload->>'scholarship_type',''),
      achievement_details = nullif(p_payload->>'achievement_details',''),
      short_description = nullif(p_payload->>'short_description',''),
      email = nullif(p_payload->>'email',''),
      phone = nullif(p_payload->>'phone',''),
      whatsapp = nullif(p_payload->>'whatsapp',''),
      is_active = coalesce((p_payload->>'is_active')::boolean, true),
      display_order = coalesce((p_payload->>'display_order')::integer, 0)
    where id = p_id
    returning id into v_id;
  end if;

  return v_id;
end;
$function$;
