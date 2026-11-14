-- A deployment or process crash must not strand a lesson in `rendering`.
-- The lease remains the duplicate-work boundary: only an expired owner can
-- be replaced, and the canonical job identity is retained.

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
    select v.id, v.status
    from public.video_jobs v
    where (
        (
          v.status = 'queued'
          and (v.next_retry_at is null or v.next_retry_at <= now())
        )
        or (
          v.status = 'rendering'
          and v.lease_expires_at is not null
          and v.lease_expires_at <= now()
        )
      )
      and v.dead_lettered_at is null
      and (p_course_id is null or v.course_id = p_course_id)
    order by v.asset_kind asc, v.queued_at asc, v.id asc
    for update skip locked
    limit p_limit
  )
  update public.video_jobs v
  set status = 'rendering',
      started_at = case when c.status = 'rendering' then now() else coalesce(v.started_at, now()) end,
      heartbeat_at = now(),
      lease_token = gen_random_uuid(),
      lease_expires_at = now() + make_interval(secs => p_lease_seconds),
      completed_at = null,
      error_message = case when c.status = 'rendering' then null else v.error_message end,
      failure_class = case when c.status = 'rendering' then null else v.failure_class end,
      updated_at = now()
  from candidates c
  where v.id = c.id
  returning v.*;
end;
$$;

revoke execute on function public.claim_video_jobs(integer, uuid, integer)
  from public, anon, authenticated;
grant execute on function public.claim_video_jobs(integer, uuid, integer) to service_role;

comment on function public.claim_video_jobs(integer, uuid, integer) is
  'Atomically claims queued jobs or reclaims expired rendering leases with SKIP LOCKED.';
