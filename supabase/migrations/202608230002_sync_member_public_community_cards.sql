create or replace function public.sync_member_public_community_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_category text;
  v_designation text;
begin
  v_category := case tg_table_name
    when 'teacher_members' then 'teacher'
    when 'staff_members' then 'staff'
    when 'account_members' then 'staff'
    when 'other_members' then 'staff'
  end;

  if tg_op = 'DELETE' then
    delete from public.people_profiles where id = old.id and category = v_category;
    return old;
  end if;

  v_designation := case tg_table_name
    when 'account_members' then coalesce(nullif(trim(new.designation), ''), nullif(trim(new.account_role), ''))
    when 'other_members' then coalesce(nullif(trim(new.designation), ''), nullif(trim(new.role_title), ''))
    else nullif(trim(new.designation), '')
  end;

  insert into public.people_profiles (
    id, category, full_name, photo_url, designation, display_order, is_active, created_at, updated_at
  ) values (
    new.id, v_category, trim(new.full_name), nullif(trim(new.photo_url), ''), v_designation, 0, new.is_active, coalesce(new.created_at, now()), now()
  )
  on conflict (id) do update set
    category = excluded.category,
    full_name = excluded.full_name,
    photo_url = excluded.photo_url,
    designation = excluded.designation,
    display_order = 0,
    is_active = excluded.is_active,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists teacher_members_public_community_profile on public.teacher_members;
create trigger teacher_members_public_community_profile after insert or update on public.teacher_members for each row execute function public.sync_member_public_community_profile();
drop trigger if exists staff_members_public_community_profile on public.staff_members;
create trigger staff_members_public_community_profile after insert or update on public.staff_members for each row execute function public.sync_member_public_community_profile();
drop trigger if exists account_members_public_community_profile on public.account_members;
create trigger account_members_public_community_profile after insert or update on public.account_members for each row execute function public.sync_member_public_community_profile();
drop trigger if exists other_members_public_community_profile on public.other_members;
create trigger other_members_public_community_profile after insert or update on public.other_members for each row execute function public.sync_member_public_community_profile();
drop trigger if exists teacher_members_public_community_profile_delete on public.teacher_members;
create trigger teacher_members_public_community_profile_delete after delete on public.teacher_members for each row execute function public.sync_member_public_community_profile();
drop trigger if exists staff_members_public_community_profile_delete on public.staff_members;
create trigger staff_members_public_community_profile_delete after delete on public.staff_members for each row execute function public.sync_member_public_community_profile();
drop trigger if exists account_members_public_community_profile_delete on public.account_members;
create trigger account_members_public_community_profile_delete after delete on public.account_members for each row execute function public.sync_member_public_community_profile();
drop trigger if exists other_members_public_community_profile_delete on public.other_members;
create trigger other_members_public_community_profile_delete after delete on public.other_members for each row execute function public.sync_member_public_community_profile();

insert into public.people_profiles (id, category, full_name, photo_url, designation, display_order, is_active, created_at, updated_at)
select t.id, 'teacher', trim(t.full_name), nullif(trim(t.photo_url), ''), nullif(trim(t.designation), ''), 0, t.is_active, t.created_at, now() from public.teacher_members t
on conflict (id) do update set category=excluded.category, full_name=excluded.full_name, photo_url=excluded.photo_url, designation=excluded.designation, display_order=0, is_active=excluded.is_active, updated_at=now();

insert into public.people_profiles (id, category, full_name, photo_url, designation, display_order, is_active, created_at, updated_at)
select s.id, 'staff', trim(s.full_name), nullif(trim(s.photo_url), ''), nullif(trim(s.designation), ''), 0, s.is_active, s.created_at, now() from public.staff_members s
on conflict (id) do update set category=excluded.category, full_name=excluded.full_name, photo_url=excluded.photo_url, designation=excluded.designation, display_order=0, is_active=excluded.is_active, updated_at=now();

insert into public.people_profiles (id, category, full_name, photo_url, designation, display_order, is_active, created_at, updated_at)
select a.id, 'staff', trim(a.full_name), nullif(trim(a.photo_url), ''), coalesce(nullif(trim(a.designation), ''), nullif(trim(a.account_role), '')), 0, a.is_active, a.created_at, now() from public.account_members a
on conflict (id) do update set category=excluded.category, full_name=excluded.full_name, photo_url=excluded.photo_url, designation=excluded.designation, display_order=0, is_active=excluded.is_active, updated_at=now();

insert into public.people_profiles (id, category, full_name, photo_url, designation, display_order, is_active, created_at, updated_at)
select o.id, 'staff', trim(o.full_name), nullif(trim(o.photo_url), ''), coalesce(nullif(trim(o.designation), ''), nullif(trim(o.role_title), '')), 0, o.is_active, o.created_at, now() from public.other_members o
on conflict (id) do update set category=excluded.category, full_name=excluded.full_name, photo_url=excluded.photo_url, designation=excluded.designation, display_order=0, is_active=excluded.is_active, updated_at=now();
