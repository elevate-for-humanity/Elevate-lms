-- Extend the canonical documents authority for application intake.
--
-- agentic_application = temporary pre-submission ownership by BuildProject
-- application         = linked ownership after canonical applications insert
--
-- Neither value grants verification; status/verified fields remain staff-owned.

alter table public.documents
  drop constraint if exists documents_owner_type_check;

alter table public.documents
  add constraint documents_owner_type_check
  check (
    owner_type is null
    or owner_type = any (array[
      'apprentice'::text,
      'host_shop'::text,
      'system'::text,
      'student'::text,
      'employer'::text,
      'agentic_application'::text,
      'application'::text
    ])
  );
