-- Quality review happens after a durable candidate is uploaded. A failed QA
-- attempt can therefore have video_url populated. The queue previously only
-- reclaimed jobs whose video_url was null, which stranded retryable quality,
-- renderer, storage, and transient failures forever. Reclaim those failed
-- canonical jobs after backoff while preserving the failed candidate as
-- previous_video_url and clearing only the active candidate fields.

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

  -- Reconcile only queued candidates or rendering candidates whose lease has
  -- actually expired. A live rendering lease may be running media QA after
  -- markCandidate has already stored video_url. Failed candidates are never
  -- promoted here; they must be retried and pass the quality gate.
  update public.video_jobs v
  set status = 'complete',
      review_status = case
        when coalesce(v.review_status, 'not_ready') = 'not_ready' then 'pending_review'
        else v.review_status
      end,
      completed_at = coalesce(v.completed_at, now()),
      error_message = null,
      failure_class = null,
      next_retry_at = null,
      dead_lettered_at = null,
      lease_token = null,
      lease_expires_at = null,
      heartbeat_at = null,
      updated_at = now()
  where (
      v.status = 'queued'
      or (
        v.status = 'rendering'
        and v.lease_expires_at is not null
        and v.lease_expires_at <= now()
      )
    )
    and nullif(btrim(v.video_url), '') is not null
    and (p_course_id is null or v.course_id = p_course_id);

  update public.course_lessons l
  set video_status = 'complete',
      video_url = v.video_url,
      video_error = null,
      media_origin = 'generated',
      media_quality_status = case
        when l.media_quality_status = 'approved' then 'approved'
        else 'pending'
      end,
      video_generated_at = coalesce(l.video_generated_at, v.completed_at, now()),
      updated_at = now()
  from public.video_jobs v
  where l.video_job_id = v.id
    and l.id = v.lesson_id
    and v.asset_kind = 'lesson'
    and v.status = 'complete'
    and nullif(btrim(v.video_url), '') is not null
    and (p_course_id is null or v.course_id = p_course_id)
    and l.generation_status not in ('approved', 'complete', 'completed', 'published');

  update public.video_jobs v
  set status = 'failed',
      failure_class = coalesce(v.failure_class, 'retry_exhausted'),
      error_message = coalesce(nullif(v.error_message, ''), 'Expired rendering lease reached the retry limit'),
      dead_lettered_at = coalesce(v.dead_lettered_at, now()),
      lease_token = null,
      lease_expires_at = null,
      heartbeat_at = null,
      updated_at = now()
  where v.status = 'rendering'
    and nullif(btrim(v.video_url), '') is null
    and v.lease_expires_at is not null
    and v.lease_expires_at <= now()
    and coalesce(v.retry_count, 0) >= 3
    and v.dead_lettered_at is null
    and (p_course_id is null or v.course_id = p_course_id);

  update public.course_lessons l
  set video_status = 'failed',
      video_error = v.error_message,
      updated_at = now()
  from public.video_jobs v
  where l.video_job_id = v.id
    and l.id = v.lesson_id
    and v.asset_kind = 'lesson'
    and v.status = 'failed'
    and v.failure_class = 'retry_exhausted'
    and v.dead_lettered_at is not null
    and (p_course_id is null or v.course_id = p_course_id)
    and (l.video_status is distinct from 'failed' or l.video_error is distinct from v.error_message);

  return query
  with candidates as (
    select v.id, v.status
    from public.video_jobs v
    where (
        (
          v.status = 'queued'
          and nullif(btrim(v.video_url), '') is null
          and coalesce(v.retry_count, 0) < 3
          and (v.next_retry_at is null or v.next_retry_at <= now())
        )
        or (
          v.status = 'rendering'
          and nullif(btrim(v.video_url), '') is null
          and v.lease_expires_at is not null
          and v.lease_expires_at <= now()
          and coalesce(v.retry_count, 0) < 3
        )
        or (
          v.status = 'failed'
          and v.dead_lettered_at is null
          and coalesce(v.retry_count, 0) < 3
          and v.next_retry_at is not null
          and v.next_retry_at <= now()
          and coalesce(v.failure_class, 'unknown') in ('transient', 'storage', 'renderer', 'quality', 'unknown')
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
      retry_count = case
        when c.status in ('rendering', 'failed') then coalesce(v.retry_count, 0) + 1
        else coalesce(v.retry_count, 0)
      end,
      started_at = case
        when c.status in ('rendering', 'failed') then now()
        else coalesce(v.started_at, now())
      end,
      heartbeat_at = now(),
      lease_token = gen_random_uuid(),
      lease_expires_at = now() + make_interval(secs => p_lease_seconds),
      completed_at = null,
      previous_video_url = case
        when c.status = 'failed' then coalesce(nullif(btrim(v.video_url), ''), v.previous_video_url)
        else v.previous_video_url
      end,
      video_url = case when c.status = 'failed' then null else v.video_url end,
      audio_url = case when c.status = 'failed' then null else v.audio_url end,
      scene_count = case when c.status = 'failed' then null else v.scene_count end,
      duration_seconds = case when c.status = 'failed' then null else v.duration_seconds end,
      scene_data = case
        when c.status = 'failed' and v.failure_class = 'quality' then null
        else v.scene_data
      end,
      review_status = case when c.status = 'failed' then 'not_ready' else v.review_status end,
      quality_evidence = case when c.status = 'failed' then '{}'::jsonb else v.quality_evidence end,
      error_message = case when c.status in ('rendering', 'failed') then null else v.error_message end,
      failure_class = case when c.status in ('rendering', 'failed') then null else v.failure_class end,
      next_retry_at = case when c.status = 'failed' then null else v.next_retry_at end,
      dead_lettered_at = null,
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
  'Reconciles abandoned outputs, retries failed canonical candidates after backoff, preserves live QA leases, bounds retries, and atomically claims video jobs.';
