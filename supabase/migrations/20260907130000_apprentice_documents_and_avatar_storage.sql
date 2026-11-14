-- Connect canonical apprenticeship requirements to active enrollment records and
-- allow authenticated learners to manage profile images in their own folder.
insert into public.enrollment_requirements (enrollment_id, requirement_type, title, description, status, priority)
select pe.id, adt.document_type, coalesce(adt.name, adt.title), adt.description, 'pending', 'high'
from public.program_enrollments pe
join public.apprentice_document_types adt on adt.program_slug = pe.program_slug and adt.is_required is true
where coalesce(pe.enrollment_state, pe.status, '') in ('active', 'enrolled', 'in_progress', 'pending')
and not exists (
  select 1 from public.enrollment_requirements er
  where er.enrollment_id = pe.id and er.requirement_type = adt.document_type
);

drop policy if exists avatars_insert_own_folder on storage.objects;
create policy avatars_insert_own_folder on storage.objects for insert to authenticated
with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists avatars_select_own_folder on storage.objects;
create policy avatars_select_own_folder on storage.objects for select to authenticated
using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists avatars_update_own_folder on storage.objects;
create policy avatars_update_own_folder on storage.objects for update to authenticated
using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists avatars_delete_own_folder on storage.objects;
create policy avatars_delete_own_folder on storage.objects for delete to authenticated
using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);
