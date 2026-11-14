-- Make PARIS human-review requests actionable without giving PARIS decision authority.
-- The interview may be anonymous before submission, so the durable staff reminder
-- is created when the agentic application project is linked to the canonical
-- public.applications row.

create or replace function public.enqueue_agentic_application_human_review()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
begin
  if new.target_type = 'application'
     and new.target_id is not null
     and coalesce((new.metadata ->> 'humanReviewRequired')::boolean, false) then

    if not exists (
      select 1
        from public.follow_up_reminders r
       where r.application_id = new.target_id
         and r.type = 'paris_human_review'
         and r.status = 'pending'
    ) then
      insert into public.follow_up_reminders (
        application_id,
        type,
        note,
        due_at,
        status
      ) values (
        new.target_id,
        'paris_human_review',
        coalesce(
          nullif(new.metadata ->> 'humanReviewReason', ''),
          'Applicant requested admissions staff assistance during the PARIS interview.'
        ),
        now(),
        'pending'
      );
    end if;
  end if;

  return new;
end;
$function$;

revoke all on function public.enqueue_agentic_application_human_review() from public, anon, authenticated;
grant execute on function public.enqueue_agentic_application_human_review() to service_role;

drop trigger if exists trg_agentic_application_human_review on public.agentic_build_projects;
create trigger trg_agentic_application_human_review
after insert or update of target_id, metadata on public.agentic_build_projects
for each row
execute function public.enqueue_agentic_application_human_review();
