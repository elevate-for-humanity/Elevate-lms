-- Durable, horizontally-safe task claiming for the canonical agentic executor.
-- A database lease is the authority: process-local flags are only an optimization.

alter table public.agentic_build_tasks
  add column if not exists attempt_count integer not null default 0,
  add column if not exists max_attempts integer not null default 3,
  add column if not exists next_attempt_at timestamptz not null default now(),
  add column if not exists lease_owner text null,
  add column if not exists lease_expires_at timestamptz null,
  add column if not exists heartbeat_at timestamptz null,
  add column if not exists idempotency_key text null;

alter table public.agentic_build_tasks
  drop constraint if exists agentic_build_tasks_attempt_count_check,
  add constraint agentic_build_tasks_attempt_count_check
    check (attempt_count >= 0 and max_attempts > 0 and attempt_count <= max_attempts);

create index if not exists agentic_build_tasks_claim_idx
  on public.agentic_build_tasks (next_attempt_at, created_at)
  where status = 'queued';

create index if not exists agentic_build_tasks_expired_lease_idx
  on public.agentic_build_tasks (lease_expires_at)
  where status = 'running';

create unique index if not exists agentic_build_tasks_idempotency_uidx
  on public.agentic_build_tasks (run_id, idempotency_key)
  where idempotency_key is not null;

create or replace function public.claim_agentic_build_task(
  p_worker_id text,
  p_run_id uuid default null,
  p_lease_seconds integer default 300
)
returns setof public.agentic_build_tasks
language plpgsql
security definer
set search_path = public
as $$
declare
  v_task_id uuid;
begin
  if nullif(trim(p_worker_id), '') is null then
    raise exception 'worker id is required';
  end if;

  -- A crashed executor cannot own work forever. Requeue only tasks that still
  -- have attempts available; exhausted tasks become terminal failures.
  update public.agentic_build_tasks
  set status = case when attempt_count < max_attempts then 'queued' else 'failed' end,
      next_attempt_at = case
        when attempt_count < max_attempts then now()
        else next_attempt_at
      end,
      error = case
        when attempt_count < max_attempts then error
        else coalesce(error, 'Executor lease expired after maximum attempts')
      end,
      lease_owner = null,
      lease_expires_at = null,
      heartbeat_at = null,
      completed_at = case when attempt_count >= max_attempts then now() else null end
  where status = 'running'
    and lease_expires_at is not null
    and lease_expires_at <= now();

  update public.agentic_build_runs run
  set status = 'failed',
      error = coalesce(run.error, 'Agentic task exhausted its retry budget'),
      failed_at = coalesce(run.failed_at, now())
  where run.status = 'running'
    and exists (
      select 1 from public.agentic_build_tasks task
      where task.run_id = run.id and task.status = 'failed'
    );

  update public.agentic_build_projects project
  set status = 'failed', updated_at = now()
  where project.status = 'active'
    and exists (
      select 1 from public.agentic_build_runs run
      where run.project_id = project.id and run.status = 'failed'
    );

  select task.id into v_task_id
  from public.agentic_build_tasks task
  join public.agentic_build_runs run on run.id = task.run_id
  join public.agentic_build_projects project on project.id = run.project_id
  where task.status = 'queued'
    and task.next_attempt_at <= now()
    and task.attempt_count < task.max_attempts
    and (p_run_id is null or task.run_id = p_run_id)
    and run.status = 'running'
    and project.status = 'active'
    and (not task.requires_approval or project.metadata->>'execution_approved' = 'true')
    and not exists (
      select 1
      from unnest(task.dependencies) dependency_id
      left join public.agentic_build_tasks dependency on dependency.id = dependency_id
      where dependency.id is null or dependency.status <> 'completed'
    )
  order by task.created_at asc
  for update of task skip locked
  limit 1;

  if v_task_id is null then
    return;
  end if;

  return query
  update public.agentic_build_tasks
  set status = 'running',
      attempt_count = attempt_count + 1,
      started_at = coalesce(started_at, now()),
      completed_at = null,
      lease_owner = p_worker_id,
      lease_expires_at = now() + make_interval(secs => greatest(30, least(p_lease_seconds, 3600))),
      heartbeat_at = now()
  where id = v_task_id
  returning *;
end;
$$;

create or replace function public.heartbeat_agentic_build_task(
  p_task_id uuid,
  p_worker_id text,
  p_lease_seconds integer default 300
)
returns boolean
language sql
security definer
set search_path = public
as $$
  with renewed as (
    update public.agentic_build_tasks
    set heartbeat_at = now(),
        lease_expires_at = now() + make_interval(secs => greatest(30, least(p_lease_seconds, 3600)))
    where id = p_task_id
      and status = 'running'
      and lease_owner = p_worker_id
      and lease_expires_at > now()
    returning id
  )
  select exists(select 1 from renewed);
$$;

revoke all on function public.claim_agentic_build_task(text, uuid, integer) from public, anon, authenticated;
revoke all on function public.heartbeat_agentic_build_task(uuid, text, integer) from public, anon, authenticated;
grant execute on function public.claim_agentic_build_task(text, uuid, integer) to service_role;
grant execute on function public.heartbeat_agentic_build_task(uuid, text, integer) to service_role;

comment on function public.claim_agentic_build_task(text, uuid, integer) is
  'Atomically recovers expired leases and claims one dependency-ready agentic task using SKIP LOCKED.';
