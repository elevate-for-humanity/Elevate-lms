-- Keep AI/autopilot health state aligned with current work instead of stale failures.

create schema if not exists private;

create or replace function private.reconcile_ai_autopilot_health()
returns void
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
begin
  -- Agent status represents current availability/workload. A historical failed
  -- task must not permanently poison an otherwise usable agent.
  update public.ai_agents a
  set status = case
      when exists (
        select 1
        from public.ai_tasks t
        where t.agent_id = a.id
          and t.status in ('planning','running')
      ) then 'busy'
      else 'idle'
    end,
    updated_at = now()
  where a.status <> 'offline';

  -- Downstream tasks from dead runs can never be claimed. Close them so they do
  -- not masquerade as pending production work.
  update public.agentic_build_tasks task
  set status = 'canceled',
      completed_at = coalesce(task.completed_at, now()),
      error = coalesce(task.error, 'Parent orchestration run is no longer active'),
      lease_owner = null,
      lease_expires_at = null,
      heartbeat_at = null
  from public.agentic_build_runs run
  where run.id = task.run_id
    and run.status in ('failed','completed','canceled')
    and task.status = 'queued';
end;
$$;

revoke all on function private.reconcile_ai_autopilot_health() from public, anon, authenticated;

do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id
  from cron.job
  where jobname='ai-autopilot-health-reconcile'
  limit 1;

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'ai-autopilot-health-reconcile',
    '* * * * *',
    'select private.reconcile_ai_autopilot_health();'
  );
end;
$$;
