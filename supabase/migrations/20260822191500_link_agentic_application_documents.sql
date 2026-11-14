-- Link documents uploaded during a PARIS application interview to the canonical
-- application row when the agentic project is completed and target_id is set.
--
-- The browser cannot choose a different application_id for these files. The
-- server links the project to applications.id, then this trigger moves all
-- pending interview-owned documents to that canonical application authority.

create or replace function public.link_agentic_application_documents()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.target_type = 'application'
     and new.target_id is not null
     and (old.target_id is distinct from new.target_id) then
    update public.documents
       set application_id = new.target_id,
           owner_type = 'application',
           owner_id = new.target_id,
           metadata = coalesce(metadata, '{}'::jsonb) || jsonb_build_object(
             'agentic_project_id', new.id,
             'linked_to_application_at', now(),
             'requires_authorized_review', true
           ),
           updated_at = now()
     where owner_type = 'agentic_application'
       and owner_id = new.id
       and application_id is null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_link_agentic_application_documents on public.agentic_build_projects;
create trigger trg_link_agentic_application_documents
after update of target_id on public.agentic_build_projects
for each row
execute function public.link_agentic_application_documents();
