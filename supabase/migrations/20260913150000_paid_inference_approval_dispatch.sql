-- Complete the single-use approval and dispatch lifecycle for paid inference.
-- Approval never invokes a provider; dispatch remains a separate atomic action.
alter table public.paid_inference_requests
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists approved_at timestamptz;

create or replace function public.approve_paid_inference_v1(
  p_request_id uuid,
  p_approved_by uuid
) returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  v_role text;
begin
  select lower(coalesce(p.role::text, '')) into v_role
  from public.profiles p
  where p.id = p_approved_by;

  if v_role not in ('admin', 'super_admin', 'staff') then
    raise exception 'Paid inference approval requires an authorized administrator';
  end if;

  update public.paid_inference_requests
  set status = 'approved',
      approved_by = p_approved_by,
      approved_at = now(),
      updated_at = now()
  where id = p_request_id
    and status = 'approval_required';

  return found;
end
$$;

create or replace function public.claim_paid_inference_dispatch_v1(
  p_request_id uuid
) returns boolean
language plpgsql
security definer
set search_path=''
as $$
begin
  update public.paid_inference_requests
  set status = 'dispatched',
      dispatch_attempts = dispatch_attempts + 1,
      dispatched_at = coalesce(dispatched_at, now()),
      updated_at = now()
  where id = p_request_id
    and status = 'approved'
    and dispatch_attempts < 3;

  return found;
end
$$;

create or replace function public.finish_paid_inference_v1(
  p_request_id uuid,
  p_status text,
  p_latency_ms bigint,
  p_actual_cost_micros bigint default null,
  p_provider_request_id text default null,
  p_error_category text default null,
  p_error_message text default null,
  p_result_location text default null
) returns boolean
language plpgsql
security definer
set search_path=''
as $$
declare
  v_request public.paid_inference_requests%rowtype;
begin
  if p_status not in ('completed', 'failed', 'uncertain') then
    raise exception 'Invalid terminal paid inference status';
  end if;
  if p_latency_ms < 0 or (p_actual_cost_micros is not null and p_actual_cost_micros < 0) then
    raise exception 'Invalid paid inference usage values';
  end if;

  update public.paid_inference_requests r
  set status = p_status,
      actual_cost_micros = p_actual_cost_micros,
      provider_request_id = p_provider_request_id,
      error_category = p_error_category,
      error_message = left(p_error_message, 2000),
      result_location = p_result_location,
      completed_at = case when p_status in ('completed', 'failed') then now() else null end,
      updated_at = now()
  where r.id = p_request_id
    and r.status in ('dispatched', 'acknowledged', 'processing', 'reconciling')
  returning r.* into v_request;

  if not found then return false; end if;

  insert into public.provider_usage_ledger(
    scope_key, tenant_id, actor_id, course_id, lesson_id, run_id, job_id,
    provider_request_id, artifact_fingerprint, provider, model, operation,
    estimated_cost_micros, actual_cost_micros, latency_ms, status,
    retry_classification
  ) values (
    v_request.scope_key, v_request.tenant_id, v_request.actor_id,
    v_request.course_id, v_request.lesson_id, v_request.run_id, v_request.job_id,
    v_request.id, v_request.artifact_fingerprint, v_request.provider,
    v_request.model, v_request.operation, v_request.projected_cost_micros,
    p_actual_cost_micros, p_latency_ms, p_status, p_error_category
  );

  return true;
end
$$;

revoke all on function public.approve_paid_inference_v1(uuid,uuid) from public,anon,authenticated;
revoke all on function public.claim_paid_inference_dispatch_v1(uuid) from public,anon,authenticated;
revoke all on function public.finish_paid_inference_v1(uuid,text,bigint,bigint,text,text,text,text) from public,anon,authenticated;
grant execute on function public.approve_paid_inference_v1(uuid,uuid) to service_role;
grant execute on function public.claim_paid_inference_dispatch_v1(uuid) to service_role;
grant execute on function public.finish_paid_inference_v1(uuid,text,bigint,bigint,text,text,text,text) to service_role;

