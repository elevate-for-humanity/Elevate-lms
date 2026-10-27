-- Explicit client-deny policies document the service-only worker boundary and
-- keep database advisors from mistaking policy-less RLS for an omission.

create policy course_production_runs_service_only
  on public.course_production_runs
  for all
  to authenticated
  using (false)
  with check (false);

create policy course_production_worker_stages_service_only
  on public.course_production_worker_stages
  for all
  to authenticated
  using (false)
  with check (false);
