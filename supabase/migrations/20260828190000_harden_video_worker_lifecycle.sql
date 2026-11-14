-- Durable video-worker leases and atomic claims.
-- Rendering is asynchronous; an Admin HTTP request may trigger work but does
-- not own the job's concurrency or recovery authority.

alter table public.video_jobs
  add column if not exists lease_token uuid,
  add column if not exists lease_expires_at timestamptz,
  add column if not exists heartbeat_at timestamptz,
  add column if not exists failure_class text,
  add column if not exists next_retry_at timestamptz,
  add column if not exists dead_lettered_at timestamptz;

alter table public.video_jobs drop constraint if exists video_jobs_failure_class_check;
alter table public.video_jobs add constraint video_jobs_failure_class_check
  check (failure_class is null or failure_class in (
    'transient', 'configuration', 'authorization', 'storage', 'renderer',
    'quality', 'content', 'not_found', 'unknown'
  ));

create index if not exists idx_video_jobs_claimable
  on public.video_jobs (status, next_retry_at, queued_at, id)
  where status = 'queued' and dead_lettered_at is null;

create index if not exists idx_video_jobs_expired_lease
  on public.video_jobs (lease_expires_at, id)
  where status = 'rendering';

create or replace function public.claim_video_jobs(
  p_limit integer,
  p_course_id uuid default null,
  p_lease_seconds integer default 900
)
returns setof public.video_jobs
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_limit < 1 or p_limit > 4 then
    raise exception 'p_limit must be between 1 and 4';
  end if;
  if p_lease_seconds < 60 or p_lease_seconds > 3600 then
    raise exception 'p_lease_seconds must be between 60 and 3600';
  end if;

  return query
  with candidates as (
    select v.id
    from public.video_jobs v
    where v.status = 'queued'
      and v.dead_lettered_at is null
      and (v.next_retry_at is null or v.next_retry_at <= now())
      and (p_course_id is null or v.course_id = p_course_id)
    order by v.asset_kind asc, v.queued_at asc, v.id asc
    for update skip locked
    limit p_limit
  )
  update public.video_jobs v
  set status = 'rendering',
      started_at = coalesce(v.started_at, now()),
      heartbeat_at = now(),
      lease_token = gen_random_uuid(),
      lease_expires_at = now() + make_interval(secs => p_lease_seconds),
      completed_at = null,
      updated_at = now()
  from candidates c
  where v.id = c.id
  returning v.*;
end;
$$;

create or replace function public.heartbeat_video_job(
  p_job_id uuid,
  p_lease_token uuid,
  p_lease_seconds integer default 900
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  updated_count integer;
begin
  update public.video_jobs
  set heartbeat_at = now(),
      lease_expires_at = now() + make_interval(secs => greatest(60, least(p_lease_seconds, 3600))),
      updated_at = now()
  where id = p_job_id
    and status = 'rendering'
    and lease_token = p_lease_token;
  get diagnostics updated_count = row_count;
  return updated_count = 1;
end;
$$;

revoke execute on function public.claim_video_jobs(integer, uuid, integer) from public, anon, authenticated;
revoke execute on function public.heartbeat_video_job(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.claim_video_jobs(integer, uuid, integer) to service_role;
grant execute on function public.heartbeat_video_job(uuid, uuid, integer) to service_role;

comment on function public.claim_video_jobs(integer, uuid, integer) is
  'Atomically claims canonical queued video jobs with SKIP LOCKED and a renewable lease.';
comment on function public.heartbeat_video_job(uuid, uuid, integer) is
  'Renews a rendering lease only for the worker holding its unguessable token.';
