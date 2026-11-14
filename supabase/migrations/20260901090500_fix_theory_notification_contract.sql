-- Align the theory scheduler with the canonical notifications.type constraint.
do $migration$
declare
  v_definition text;
begin
  select pg_get_functiondef('public.queue_due_theory_schedule_notifications(timestamptz)'::regprocedure)
  into v_definition;
  execute replace(v_definition, '''theory_'' || v_event,', '''reminder'',');
end
$migration$;

create index if not exists apprenticeship_theory_schedules_course_idx
  on public.apprenticeship_theory_schedules(course_id);
create index if not exists apprenticeship_theory_schedules_created_by_idx
  on public.apprenticeship_theory_schedules(created_by);
