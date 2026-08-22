-- Create the People photo bucket manually with this migration.
insert into storage.buckets (id,name,public) values ('school_people','school_people',true) on conflict (id) do update set public=true;

drop policy if exists school_people_public_read on storage.objects;
create policy school_people_public_read on storage.objects for select using (bucket_id='school_people');

drop policy if exists school_people_admin_insert on storage.objects;
create policy school_people_admin_insert on storage.objects for insert to authenticated with check (bucket_id='school_people');

drop policy if exists school_people_admin_update on storage.objects;
create policy school_people_admin_update on storage.objects for update to authenticated using (bucket_id='school_people') with check (bucket_id='school_people');
