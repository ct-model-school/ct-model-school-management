create or replace function public.store_login(p_login_id text,p_password text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare v_user public.store_users%rowtype; v_token text; v_name text; v_photo text; v_email text; v_phone text; v_whatsapp text; v_designation text; v_department text; v_class text; v_section text; v_access_role text; v_subject text; v_member_type text;
begin
 select * into v_user from public.store_users where lower(login_id)=lower(trim(p_login_id)) and is_active=true limit 1;
 if v_user.id is null or crypt(p_password,v_user.password_hash)<>v_user.password_hash then raise exception 'Invalid ID or password'; end if;
 v_token:=encode(gen_random_bytes(32),'hex');
 insert into public.store_sessions(store_user_id,token_hash,expires_at) values(v_user.id,encode(digest(v_token,'sha256'),'hex'),now()+interval '8 hours');
 if v_user.people_profile_id is not null then
   select full_name,photo_url,email,phone,whatsapp,designation,department,class_name,section into v_name,v_photo,v_email,v_phone,v_whatsapp,v_designation,v_department,v_class,v_section from public.people_profiles where id=v_user.people_profile_id;
   v_access_role:='community'; v_member_type:='community';
 else
   select full_name,photo_url,email,phone,whatsapp,designation,department,subject into v_name,v_photo,v_email,v_phone,v_whatsapp,v_designation,v_department,v_subject from public.school_teachers where lower(teacher_id)=lower(v_user.login_id) and is_active=true;
   if v_name is not null then v_access_role:='teacher'; v_member_type:='teacher';
   else
     select full_name,photo_url,email,phone,whatsapp,designation,department into v_name,v_photo,v_email,v_phone,v_whatsapp,v_designation,v_department from public.school_staff where lower(staff_id)=lower(v_user.login_id) and is_active=true;
     if v_name is not null then v_access_role:='staff'; v_member_type:='staff';
     else
       select full_name,photo_url,email,phone,whatsapp,role_name,department into v_name,v_photo,v_email,v_phone,v_whatsapp,v_designation,v_department from public.school_accounts where lower(account_id)=lower(v_user.login_id) and is_active=true;
       if v_name is not null then v_access_role:='accounts'; v_member_type:='accounts';
       else
         select full_name,email,phone,role_title,department into v_name,v_email,v_phone,v_designation,v_department from public.school_other_members where lower(other_id)=lower(v_user.login_id) and is_active=true;
         if v_name is not null then v_access_role:='other'; v_member_type:='other'; end if;
       end if;
     end if;
   end if;
 end if;
 if v_name is null then raise exception 'Member profile is inactive or missing'; end if;
 return jsonb_build_object('token',v_token,'expires_at',now()+interval '8 hours','user_id',v_user.id,'profile_id',v_user.people_profile_id,'full_name',v_name,'photo_url',v_photo,'email',v_email,'phone',v_phone,'whatsapp',v_whatsapp,'designation',v_designation,'department',v_department,'class_name',v_class,'section',v_section,'subject',v_subject,'access_role',v_access_role,'member_type',v_member_type,'login_id',v_user.login_id);
end;
$$;
