-- A NULL limit means the operator intentionally has no monetary budget cap.
-- Concurrency, approval, idempotency, cache and retry controls remain enforced.
alter table public.paid_inference_policies
  alter column daily_limit_micros drop not null,
  alter column monthly_limit_micros drop not null,
  alter column per_request_limit_micros drop not null;

create or replace function public.reserve_paid_inference_v1(
  p_scope_key text, p_tenant_id uuid, p_actor_id uuid, p_course_id uuid,
  p_lesson_id uuid, p_run_id uuid, p_job_id uuid, p_artifact_fingerprint text,
  p_idempotency_key text, p_provider text, p_model text, p_operation text,
  p_projected_cost_micros bigint
) returns table (decision text, request_id uuid)
language plpgsql security definer set search_path=''
as $$
declare pol public.paid_inference_policies%rowtype; req public.paid_inference_requests%rowtype;
declare day_spend bigint; month_spend bigint; active_count integer;
begin
  if coalesce(btrim(p_scope_key),'')='' or p_projected_cost_micros<0 or coalesce(btrim(p_artifact_fingerprint),'')='' or coalesce(btrim(p_idempotency_key),'')='' then
    return query select 'invalid_request'::text,null::uuid; return;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_scope_key,0));
  select p.* into pol from public.paid_inference_policies p where p.scope_key=p_scope_key;
  if not found or not pol.enabled then return query select 'invalid_request'::text,null::uuid; return; end if;
  if pol.paused then return query select 'paused'::text,null::uuid; return; end if;
  select r.* into req from public.paid_inference_requests r where r.scope_key=p_scope_key and (r.idempotency_key=p_idempotency_key or (r.artifact_fingerprint=p_artifact_fingerprint and r.operation=p_operation)) limit 1;
  if found then return query select 'duplicate'::text,req.id; return; end if;
  if exists(select 1 from public.paid_inference_artifacts a where a.scope_key=p_scope_key and a.artifact_fingerprint=p_artifact_fingerprint and a.validation_status='valid') then return query select 'cache_hit'::text,null::uuid; return; end if;
  select coalesce(sum(coalesce(l.actual_cost_micros,l.estimated_cost_micros)),0) into day_spend from public.provider_usage_ledger l where l.scope_key=p_scope_key and l.occurred_at>=date_trunc('day',now());
  select coalesce(sum(coalesce(l.actual_cost_micros,l.estimated_cost_micros)),0) into month_spend from public.provider_usage_ledger l where l.scope_key=p_scope_key and l.occurred_at>=date_trunc('month',now());
  select count(*) into active_count from public.paid_inference_requests r where r.scope_key=p_scope_key and r.status in ('approved','dispatched','acknowledged','processing','uncertain','reconciling');
  if (pol.per_request_limit_micros is not null and p_projected_cost_micros>pol.per_request_limit_micros)
     or (pol.daily_limit_micros is not null and day_spend+p_projected_cost_micros>pol.daily_limit_micros)
     or (pol.monthly_limit_micros is not null and month_spend+p_projected_cost_micros>pol.monthly_limit_micros) then
    return query select 'budget_exceeded'::text,null::uuid; return;
  end if;
  if active_count>=pol.max_active_requests then return query select 'provider_unavailable'::text,null::uuid; return; end if;
  insert into public.paid_inference_requests(scope_key,tenant_id,actor_id,course_id,lesson_id,run_id,job_id,artifact_fingerprint,idempotency_key,provider,model,operation,status,projected_cost_micros,reserved_cost_micros)
  values(p_scope_key,p_tenant_id,p_actor_id,p_course_id,p_lesson_id,p_run_id,p_job_id,p_artifact_fingerprint,p_idempotency_key,p_provider,p_model,p_operation,case when p_projected_cost_micros>pol.approval_threshold_micros then 'approval_required' else 'approved' end,p_projected_cost_micros,p_projected_cost_micros) returning id into req.id;
  return query select case when p_projected_cost_micros>pol.approval_threshold_micros then 'approval_required' else 'approved' end::text,req.id;
end $$;

revoke all on function public.reserve_paid_inference_v1(text,uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,bigint) from public,anon,authenticated;
grant execute on function public.reserve_paid_inference_v1(text,uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,bigint) to service_role;

update public.paid_inference_policies
set daily_limit_micros=null,
    monthly_limit_micros=null,
    per_request_limit_micros=null,
    approval_threshold_micros=0,
    max_active_requests=1,
    updated_at=now()
where scope_key='platform';
