-- Legacy Elevate-owned course production has no tenant row. Give it an
-- explicit platform scope without inventing ownership or weakening isolation.
alter table public.paid_inference_policies add column if not exists scope_key text;
update public.paid_inference_policies set scope_key='tenant:'||tenant_id::text where scope_key is null;
alter table public.paid_inference_policies alter column scope_key set not null;
alter table public.paid_inference_policies drop constraint if exists paid_inference_policies_pkey;
alter table public.paid_inference_policies alter column tenant_id drop not null;
alter table public.paid_inference_policies add primary key (scope_key);
create unique index if not exists paid_inference_policy_tenant_uidx on public.paid_inference_policies(tenant_id) where tenant_id is not null;

alter table public.paid_inference_requests add column if not exists scope_key text;
update public.paid_inference_requests set scope_key=coalesce('tenant:'||tenant_id::text,'platform') where scope_key is null;
alter table public.paid_inference_requests alter column scope_key set not null;
alter table public.paid_inference_requests alter column tenant_id drop not null;
alter table public.paid_inference_requests drop constraint if exists paid_inference_requests_tenant_id_idempotency_key_key;
alter table public.paid_inference_requests drop constraint if exists paid_inference_requests_tenant_id_artifact_fingerprint_operation_key;
create unique index if not exists paid_inference_request_idempotency_uidx on public.paid_inference_requests(scope_key,idempotency_key);
create unique index if not exists paid_inference_request_artifact_uidx on public.paid_inference_requests(scope_key,artifact_fingerprint,operation);

alter table public.paid_inference_artifacts add column if not exists scope_key text;
update public.paid_inference_artifacts set scope_key=coalesce('tenant:'||tenant_id::text,'platform') where scope_key is null;
alter table public.paid_inference_artifacts alter column scope_key set not null;
alter table public.paid_inference_artifacts alter column tenant_id drop not null;
alter table public.paid_inference_artifacts drop constraint if exists paid_inference_artifacts_tenant_id_artifact_fingerprint_asset_type_key;
create unique index if not exists paid_inference_artifact_scope_uidx on public.paid_inference_artifacts(scope_key,artifact_fingerprint,asset_type);
alter table public.provider_usage_ledger add column if not exists scope_key text;
update public.provider_usage_ledger set scope_key=coalesce('tenant:'||tenant_id::text,'platform') where scope_key is null;
alter table public.provider_usage_ledger alter column scope_key set not null;
alter table public.provider_usage_ledger alter column tenant_id drop not null;

drop function if exists public.reserve_paid_inference_v1(uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,bigint);
create function public.reserve_paid_inference_v1(
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
  if p_projected_cost_micros>pol.per_request_limit_micros or day_spend+p_projected_cost_micros>pol.daily_limit_micros or month_spend+p_projected_cost_micros>pol.monthly_limit_micros then return query select 'budget_exceeded'::text,null::uuid; return; end if;
  if active_count>=pol.max_active_requests then return query select 'provider_unavailable'::text,null::uuid; return; end if;
  insert into public.paid_inference_requests(scope_key,tenant_id,actor_id,course_id,lesson_id,run_id,job_id,artifact_fingerprint,idempotency_key,provider,model,operation,status,projected_cost_micros,reserved_cost_micros)
  values(p_scope_key,p_tenant_id,p_actor_id,p_course_id,p_lesson_id,p_run_id,p_job_id,p_artifact_fingerprint,p_idempotency_key,p_provider,p_model,p_operation,case when p_projected_cost_micros>pol.approval_threshold_micros then 'approval_required' else 'approved' end,p_projected_cost_micros,p_projected_cost_micros) returning id into req.id;
  return query select case when p_projected_cost_micros>pol.approval_threshold_micros then 'approval_required' else 'approved' end::text,req.id;
end $$;
revoke all on function public.reserve_paid_inference_v1(text,uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,bigint) from public,anon,authenticated;
grant execute on function public.reserve_paid_inference_v1(text,uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,bigint) to service_role;
