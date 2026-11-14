-- Once a PARIS interview is linked to the canonical applications row, attach
-- the agentic project to the provisioned auth user as well. This allows the
-- authenticated applicant to own/read the same project after login while
-- preserving the resume-token path used before account creation.

create or replace function public.link_agentic_application_documents()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  app_email text;
  app_program text;
  app_user_id uuid;
  interview_email text;
  interview_program text;
begin
  if new.target_type = 'application'
     and new.target_id is not null
     and (old.target_id is distinct from new.target_id) then

    select
      lower(trim(coalesce(a.normalized_email, a.email, ''))),
      coalesce(nullif(a.program_slug, ''), nullif(a.program_interest, ''), ''),
      a.user_id
      into app_email, app_program, app_user_id
      from public.applications a
     where a.id = new.target_id;

    if not found then
      raise exception 'Agentic application link target does not exist';
    end if;

    interview_email := lower(trim(coalesce(
      new.metadata -> 'applicationInterviewState' -> 'answers' ->> 'email',
      ''
    )));
    interview_program := coalesce(
      new.metadata -> 'applicationInterviewState' -> 'answers' ->> 'program',
      ''
    );

    if interview_email = '' or app_email = '' or interview_email <> app_email then
      raise exception 'Agentic application link identity mismatch';
    end if;

    if interview_program = '' or app_program = '' or interview_program <> app_program then
      raise exception 'Agentic application link program mismatch';
    end if;

    if app_user_id is not null then
      new.user_id := app_user_id;
    end if;

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
$function$;

revoke all on function public.link_agentic_application_documents() from public, anon, authenticated;
grant execute on function public.link_agentic_application_documents() to service_role;
