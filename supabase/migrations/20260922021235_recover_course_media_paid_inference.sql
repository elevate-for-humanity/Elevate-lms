-- Production migration version: 20260922021235.
-- Recover course-scoped Cloudflare narration reservations after a renderer
-- lease dies. A stranded paid-inference row must not block every later lesson
-- in the same course, but ambiguous provider outcomes remain fail-closed for
-- the same artifact and all operator-authored policies remain authoritative.

create index if not exists paid_inference_requests_scope_active_job_idx
  on public.paid_inference_requests (scope_key, status, job_id, updated_at)
  where status in ('approved','dispatched','acknowledged','processing','uncertain','reconciling');

create or replace function public.reserve_paid_inference_v1(
  p_scope_key text, p_tenant_id uuid, p_actor_id uuid, p_course_id uuid,
  p_lesson_id uuid, p_run_id uuid, p_job_id uuid, p_artifact_fingerprint text,
  p_idempotency_key text, p_provider text, p_model text, p_operation text,
  p_projected_cost_micros bigint
) returns table (decision text, request_id uuid)
language plpgsql
security definer
set search_path=''
as $$
declare
  pol public.paid_inference_policies%rowtype;
  req public.paid_inference_requests%rowtype;
  day_spend bigint;
  month_spend bigint;
  active_count integer;
begin
  if coalesce(btrim(p_scope_key),'')=''
     or p_projected_cost_micros<0
     or coalesce(btrim(p_artifact_fingerprint),'')=''
     or coalesce(btrim(p_idempotency_key),'')='' then
    return query select 'invalid_request'::text,null::uuid;
    return;
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_scope_key,0));

  -- Canonical Course Builder narration has a deterministic course scope. Seed
  -- only that exact route, and never overwrite an operator-authored policy.
  if p_course_id is not null
     and p_scope_key='course:'||p_course_id::text||':cloudflare-tts'
     and p_provider='cloudflare'
     and p_operation='lesson-video' then
    insert into public.paid_inference_policies(
      tenant_id, enabled, paused, daily_limit_micros, monthly_limit_micros,
      per_request_limit_micros, max_active_requests,
      approval_threshold_micros, currency, scope_key
    ) values (
      null, true, false, 10000000, 100000000,
      250000, 1, 250000, 'USD', p_scope_key
    )
    on conflict (scope_key) do nothing;
  end if;

  select p.* into pol
  from public.paid_inference_policies p
  where p.scope_key=p_scope_key;
  if not found or not pol.enabled then
    return query select 'invalid_request'::text,null::uuid;
    return;
  end if;

  -- If a renderer persisted its canonical video before dying, preserve the
  -- output and close the billing lifecycle instead of purchasing narration a
  -- second time. The ledger stays append-only and idempotent per request.
  insert into public.provider_usage_ledger(
    scope_key, tenant_id, actor_id, course_id, lesson_id, run_id, job_id,
    provider_request_id, artifact_fingerprint, provider, model, operation,
    estimated_cost_micros, actual_cost_micros, latency_ms, status,
    retry_classification
  )
  select
    r.scope_key, r.tenant_id, r.actor_id, r.course_id, r.lesson_id, r.run_id,
    r.job_id, r.id, r.artifact_fingerprint, r.provider, r.model, r.operation,
    r.projected_cost_micros, r.actual_cost_micros, null, 'completed',
    'reconciled_from_durable_video_output'
  from public.paid_inference_requests r
  join public.video_jobs v on v.id=r.job_id
  where r.scope_key=p_scope_key
    and r.provider='cloudflare'
    and r.operation='lesson-video'
    and r.status in ('approved','dispatched','acknowledged','processing','uncertain','reconciling')
    and coalesce(btrim(v.video_url),'')<>''
    and not exists (
      select 1 from public.provider_usage_ledger l
      where l.provider_request_id=r.id
    );

  update public.paid_inference_requests r
  set status='completed',
      completed_at=coalesce(r.completed_at,now()),
      result_location=v.video_url,
      error_category=null,
      error_message=null,
      updated_at=now()
  from public.video_jobs v
  where r.scope_key=p_scope_key
    and r.job_id=v.id
    and r.provider='cloudflare'
    and r.operation='lesson-video'
    and r.status in ('approved','dispatched','acknowledged','processing','uncertain','reconciling')
    and coalesce(btrim(v.video_url),'')<>'';

  -- A Cloudflare narration request is recoverable only when its canonical
  -- video job has no durable output and no live rendering lease. The currently
  -- claimed job may also recover its older request when started_at proves this
  -- is a newer bounded attempt.
  update public.paid_inference_requests r
  set status=case when r.dispatch_attempts<3 then 'approved' else 'failed' end,
      completed_at=case when r.dispatch_attempts<3 then null else now() end,
      error_category=case
        when r.dispatch_attempts<3 then 'renderer_lease_recovered'
        else 'retry_exhausted'
      end,
      error_message=case
        when r.dispatch_attempts<3
          then 'Recovered after the canonical video renderer lease expired'
        else 'Paid narration dispatch retry limit reached after renderer lease recovery'
      end,
      updated_at=now()
  from public.video_jobs v
  where r.scope_key=p_scope_key
    and r.job_id=v.id
    and r.provider='cloudflare'
    and r.operation='lesson-video'
    and r.status in ('dispatched','acknowledged','processing','failed')
    and coalesce(btrim(v.video_url),'')=''
    and (
      not (
        v.status='rendering'
        and v.lease_expires_at is not null
        and v.lease_expires_at>now()
      )
      or (
        r.job_id=p_job_id
        and v.status='rendering'
        and v.lease_expires_at is not null
        and v.lease_expires_at>now()
        and v.started_at is not null
        and v.started_at>r.updated_at
      )
    );

  select r.* into req
  from public.paid_inference_requests r
  where r.scope_key=p_scope_key
    and (
      r.idempotency_key=p_idempotency_key
      or (r.artifact_fingerprint=p_artifact_fingerprint and r.operation=p_operation)
    )
  limit 1;
  if found then
    return query select 'duplicate'::text,req.id;
    return;
  end if;

  if exists(
    select 1
    from public.paid_inference_artifacts a
    where a.scope_key=p_scope_key
      and a.artifact_fingerprint=p_artifact_fingerprint
      and a.validation_status='valid'
  ) then
    return query select 'cache_hit'::text,null::uuid;
    return;
  end if;

  if pol.paused then
    return query select 'paused'::text,null::uuid;
    return;
  end if;

  select coalesce(sum(coalesce(l.actual_cost_micros,l.estimated_cost_micros)),0)
  into day_spend
  from public.provider_usage_ledger l
  where l.scope_key=p_scope_key
    and l.occurred_at>=date_trunc('day',now());

  select coalesce(sum(coalesce(l.actual_cost_micros,l.estimated_cost_micros)),0)
  into month_spend
  from public.provider_usage_ledger l
  where l.scope_key=p_scope_key
    and l.occurred_at>=date_trunc('month',now());

  -- Course narration owns capacity only while the corresponding renderer owns
  -- a live lease. Other operations retain the original fail-closed behavior.
  select count(*) into active_count
  from public.paid_inference_requests r
  left join public.video_jobs v on v.id=r.job_id
  where r.scope_key=p_scope_key
    and r.status in ('approved','dispatched','acknowledged','processing','uncertain','reconciling')
    and (
      r.provider<>'cloudflare'
      or r.operation<>'lesson-video'
      or (
        v.status='rendering'
        and v.lease_expires_at is not null
        and v.lease_expires_at>now()
      )
    );

  if (pol.per_request_limit_micros is not null and p_projected_cost_micros>pol.per_request_limit_micros)
     or (pol.daily_limit_micros is not null and day_spend+p_projected_cost_micros>pol.daily_limit_micros)
     or (pol.monthly_limit_micros is not null and month_spend+p_projected_cost_micros>pol.monthly_limit_micros) then
    return query select 'budget_exceeded'::text,null::uuid;
    return;
  end if;

  if active_count>=pol.max_active_requests then
    return query select 'provider_unavailable'::text,null::uuid;
    return;
  end if;

  insert into public.paid_inference_requests(
    scope_key, tenant_id, actor_id, course_id, lesson_id, run_id, job_id,
    artifact_fingerprint, idempotency_key, provider, model, operation, status,
    projected_cost_micros, reserved_cost_micros
  ) values (
    p_scope_key, p_tenant_id, p_actor_id, p_course_id, p_lesson_id, p_run_id,
    p_job_id, p_artifact_fingerprint, p_idempotency_key, p_provider, p_model,
    p_operation,
    case when p_projected_cost_micros>pol.approval_threshold_micros
      then 'approval_required' else 'approved' end,
    p_projected_cost_micros, p_projected_cost_micros
  ) returning id into req.id;

  return query select
    case when p_projected_cost_micros>pol.approval_threshold_micros
      then 'approval_required' else 'approved' end::text,
    req.id;
end
$$;

revoke all on function public.reserve_paid_inference_v1(text,uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,bigint) from public,anon,authenticated;
grant execute on function public.reserve_paid_inference_v1(text,uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,bigint) to service_role;

comment on function public.reserve_paid_inference_v1(text,uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,bigint)
  is 'Reserves paid inference with course narration policy provisioning and renderer-lease recovery.';
