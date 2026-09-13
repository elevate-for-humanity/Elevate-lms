-- Fail-closed control plane for all paid AI and media dispatches.
create table if not exists public.paid_inference_policies (
  tenant_id uuid primary key,
  enabled boolean not null default true,
  paused boolean not null default false,
  daily_limit_micros bigint not null check (daily_limit_micros >= 0),
  monthly_limit_micros bigint not null check (monthly_limit_micros >= 0),
  per_request_limit_micros bigint not null check (per_request_limit_micros >= 0),
  max_active_requests integer not null default 1 check (max_active_requests between 1 and 100),
  approval_threshold_micros bigint not null check (approval_threshold_micros >= 0),
  currency text not null default 'USD',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.paid_inference_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  actor_id uuid references auth.users(id) on delete set null,
  course_id uuid,
  lesson_id uuid,
  run_id uuid,
  job_id uuid,
  artifact_fingerprint text not null,
  idempotency_key text not null,
  provider text not null,
  model text not null,
  operation text not null,
  status text not null default 'proposed' check (status in
    ('proposed','cost_checked','approval_required','approved','dispatched','acknowledged','processing','completed','failed','uncertain','reconciling','cancelled','blocked')),
  projected_cost_micros bigint not null check (projected_cost_micros >= 0),
  reserved_cost_micros bigint not null default 0 check (reserved_cost_micros >= 0),
  actual_cost_micros bigint check (actual_cost_micros is null or actual_cost_micros >= 0),
  provider_request_id text,
  approval_id uuid,
  dispatch_attempts integer not null default 0 check (dispatch_attempts between 0 and 3),
  error_category text,
  error_message text,
  result_location text,
  acknowledged_at timestamptz,
  dispatched_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, idempotency_key),
  unique (tenant_id, artifact_fingerprint, operation)
);

create table if not exists public.paid_inference_artifacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  artifact_fingerprint text not null,
  asset_type text not null,
  storage_location text not null,
  validation_status text not null check (validation_status in ('pending','valid','invalid')),
  source_request_id uuid references public.paid_inference_requests(id) on delete restrict,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  validated_at timestamptz,
  unique (tenant_id, artifact_fingerprint, asset_type)
);

create table if not exists public.provider_usage_ledger (
  id bigint generated always as identity primary key,
  tenant_id uuid not null,
  actor_id uuid references auth.users(id) on delete set null,
  course_id uuid,
  lesson_id uuid,
  run_id uuid,
  job_id uuid,
  provider_request_id uuid references public.paid_inference_requests(id) on delete restrict,
  artifact_fingerprint text not null,
  provider text not null,
  model text not null,
  operation text not null,
  input_units numeric not null default 0 check (input_units >= 0),
  output_units numeric not null default 0 check (output_units >= 0),
  gpu_seconds numeric not null default 0 check (gpu_seconds >= 0),
  cache_hit boolean not null default false,
  retry_classification text,
  estimated_cost_micros bigint not null check (estimated_cost_micros >= 0),
  actual_cost_micros bigint check (actual_cost_micros is null or actual_cost_micros >= 0),
  currency text not null default 'USD',
  latency_ms bigint check (latency_ms is null or latency_ms >= 0),
  status text not null,
  occurred_at timestamptz not null default now()
);

create index if not exists paid_inference_requests_active_idx
  on public.paid_inference_requests (tenant_id, status, created_at)
  where status in ('approved','dispatched','acknowledged','processing','uncertain','reconciling');
create index if not exists provider_usage_ledger_tenant_time_idx
  on public.provider_usage_ledger (tenant_id, occurred_at desc);

alter table public.paid_inference_policies enable row level security;
alter table public.paid_inference_requests enable row level security;
alter table public.paid_inference_artifacts enable row level security;
alter table public.provider_usage_ledger enable row level security;
revoke all on public.paid_inference_policies, public.paid_inference_requests,
  public.paid_inference_artifacts, public.provider_usage_ledger from anon, authenticated;

create or replace function public.reserve_paid_inference_v1(
  p_tenant_id uuid, p_actor_id uuid, p_course_id uuid, p_lesson_id uuid,
  p_run_id uuid, p_job_id uuid, p_artifact_fingerprint text,
  p_idempotency_key text, p_provider text, p_model text, p_operation text,
  p_projected_cost_micros bigint
) returns table (decision text, request_id uuid)
language plpgsql security definer set search_path=''
as $$
declare p public.paid_inference_policies%rowtype; r public.paid_inference_requests%rowtype;
declare day_spend bigint; month_spend bigint; active_count integer;
begin
  if p_projected_cost_micros < 0 or coalesce(btrim(p_artifact_fingerprint),'')='' or coalesce(btrim(p_idempotency_key),'')='' then
    return query select 'invalid_request'::text, null::uuid; return;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_tenant_id::text,0));
  select * into p from public.paid_inference_policies where tenant_id=p_tenant_id;
  if not found or not p.enabled then return query select 'invalid_request'::text,null::uuid; return; end if;
  if p.paused then return query select 'paused'::text,null::uuid; return; end if;
  select * into r from public.paid_inference_requests where tenant_id=p_tenant_id and (idempotency_key=p_idempotency_key or (artifact_fingerprint=p_artifact_fingerprint and operation=p_operation)) limit 1;
  if found then return query select 'duplicate'::text,r.id; return; end if;
  if exists(select 1 from public.paid_inference_artifacts a where a.tenant_id=p_tenant_id and a.artifact_fingerprint=p_artifact_fingerprint and a.validation_status='valid') then
    return query select 'cache_hit'::text,null::uuid; return;
  end if;
  select coalesce(sum(coalesce(actual_cost_micros,estimated_cost_micros)),0) into day_spend from public.provider_usage_ledger where tenant_id=p_tenant_id and occurred_at>=date_trunc('day',now());
  select coalesce(sum(coalesce(actual_cost_micros,estimated_cost_micros)),0) into month_spend from public.provider_usage_ledger where tenant_id=p_tenant_id and occurred_at>=date_trunc('month',now());
  select count(*) into active_count from public.paid_inference_requests where tenant_id=p_tenant_id and status in ('approved','dispatched','acknowledged','processing','uncertain','reconciling');
  if p_projected_cost_micros>p.per_request_limit_micros or day_spend+p_projected_cost_micros>p.daily_limit_micros or month_spend+p_projected_cost_micros>p.monthly_limit_micros then
    return query select 'budget_exceeded'::text,null::uuid; return;
  end if;
  if active_count>=p.max_active_requests then return query select 'provider_unavailable'::text,null::uuid; return; end if;
  insert into public.paid_inference_requests(tenant_id,actor_id,course_id,lesson_id,run_id,job_id,artifact_fingerprint,idempotency_key,provider,model,operation,status,projected_cost_micros,reserved_cost_micros)
  values(p_tenant_id,p_actor_id,p_course_id,p_lesson_id,p_run_id,p_job_id,p_artifact_fingerprint,p_idempotency_key,p_provider,p_model,p_operation,
    case when p_projected_cost_micros>p.approval_threshold_micros then 'approval_required' else 'approved' end,p_projected_cost_micros,p_projected_cost_micros)
  returning id into r.id;
  return query select case when p_projected_cost_micros>p.approval_threshold_micros then 'approval_required' else 'approved' end::text,r.id;
end $$;

revoke all on function public.reserve_paid_inference_v1(uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,bigint) from public,anon,authenticated;
grant execute on function public.reserve_paid_inference_v1(uuid,uuid,uuid,uuid,uuid,uuid,text,text,text,text,text,bigint) to service_role;

create or replace function public.prevent_provider_usage_mutation() returns trigger
language plpgsql set search_path='' as $$ begin raise exception 'provider_usage_ledger is append-only'; end $$;
drop trigger if exists provider_usage_ledger_immutable on public.provider_usage_ledger;
create trigger provider_usage_ledger_immutable before update or delete on public.provider_usage_ledger
for each row execute function public.prevent_provider_usage_mutation();
