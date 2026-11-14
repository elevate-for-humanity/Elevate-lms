-- Completed learners retain their own inter-office mailbox for career and alumni support.
-- Preserve the existing function's permissions, test-account exclusions, and inactive-account rules.
do $migration$
declare
  definition text;
begin
  select pg_get_functiondef('public.communication_email_provision_learner(uuid)'::regprocedure)
    into definition;
  if position('e.status in (''active'',''enrolled'',''in_progress'')' in definition) > 0 then
    execute replace(definition,
      'e.status in (''active'',''enrolled'',''in_progress'')',
      'e.status in (''active'',''enrolled'',''in_progress'',''completed'')');
  elsif position('e.status in (''active'',''enrolled'',''in_progress'',''completed'')' in definition) = 0 then
    raise exception 'Unexpected learner mailbox provisioning definition; review before changing';
  end if;
end;
$migration$;

-- The existing provisioner validates identity, account status, and training eligibility.
select public.communication_email_provision_learner(p.id)
from public.profiles p
where exists (
  select 1 from public.program_enrollments e
  where coalesce(e.user_id,e.student_id)=p.id and e.status='completed'
);
