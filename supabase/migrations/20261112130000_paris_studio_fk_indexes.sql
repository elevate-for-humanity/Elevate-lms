set lock_timeout='2s';
set statement_timeout='90s';

-- Covering indexes for Studio run foreign keys that have none.
-- paris_code_repairs(actor_id) and paris_autopilot_policy(actor_id) are already
-- covered by orch_fk_31/orch_fk_30 (20261102105855). studio_run_step_dependencies(step_id)
-- is covered by its (step_id, depends_on_step_id) primary key.
create index if not exists studio_runs_conversation_id_idx on public.studio_runs (conversation_id);
create index if not exists studio_runs_active_step_id_idx on public.studio_runs (active_step_id);
create index if not exists studio_run_events_step_id_idx on public.studio_run_events (step_id);
create index if not exists studio_run_artifacts_step_id_idx on public.studio_run_artifacts (step_id);
create index if not exists studio_run_step_dependencies_depends_on_idx on public.studio_run_step_dependencies (depends_on_step_id);

-- Operator recovery: return blocked repairs whose root cause was fixed to the queue.
create or replace function public.requeue_fixed_paris_repairs(fixed_error_codes text[])
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_requeued integer;
begin
  if fixed_error_codes is null or cardinality(fixed_error_codes) = 0 then
    raise exception 'fixed_error_codes_required' using errcode = '22023';
  end if;

  lock table public.paris_code_repairs in share row exclusive mode;

  if exists (
    select 1 from public.paris_code_repairs
    where status in ('dispatched','patching','validating','deploying','verifying')
  ) then
    raise exception 'paris_repair_in_progress' using errcode = '55000';
  end if;

  update public.paris_code_repairs
     set status = 'queued', error_code = null, updated_at = now()
   where status = 'blocked'
     and error_code = any(fixed_error_codes);
  get diagnostics v_requeued = row_count;
  return v_requeued;
end;
$$;

revoke all on function public.requeue_fixed_paris_repairs(text[]) from public, anon, authenticated;
grant execute on function public.requeue_fixed_paris_repairs(text[]) to service_role;
