-- Restores the documented, dormant compute contracts against the current role-aware queue.
-- Disabled by default. Receipts attach to the canonical queue, never replace it.
-- No policy, price, allowance, provider secret or customer debit is activated.
begin;
-- The canonical grant/refund RPCs return a column named balance. Their
-- unqualified RHS is ambiguous under PostgreSQL's default conflict policy.
-- Qualify just that expression; retain security and idempotency behavior.
do $wallet_repair$
declare signature text; definition text;
begin
  foreach signature in array array[
    'public.grant_tenant_course_builder_credits(uuid,text,integer,text,text,timestamptz,timestamptz,jsonb)',
    'public.refund_tenant_course_builder_credits(uuid,uuid,text,text,integer,text,jsonb)'] loop
    select pg_get_functiondef(signature::regprocedure) into definition;
    if position('set balance = balance + p_credits' in definition)>0 then
      execute replace(definition,'set balance = balance + p_credits',
        'set balance = public.tenant_course_builder_credit_wallets.balance + p_credits');
    end if;
  end loop;
end $wallet_repair$;
create table if not exists public.external_compute_policies (
  scope_key text primary key,
  enabled boolean not null default false,
  daily_limit_micros bigint not null default 0 check (daily_limit_micros >= 0),
  monthly_limit_micros bigint not null default 0 check (monthly_limit_micros >= 0),
  per_job_limit_micros bigint not null default 0 check (per_job_limit_micros >= 0),
  max_active integer not null default 1 check (max_active between 1 and 2),
  cpu_micros_per_second numeric not null check (cpu_micros_per_second > 0),
  memory_micros_per_gib_second numeric not null check (memory_micros_per_gib_second > 0),
  credits_per_job integer not null check (credits_per_job > 0),
  approved_by uuid not null references auth.users(id),
  approved_at timestamptz not null default now()
);

create table if not exists public.external_course_executions (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.ultimate_build_jobs(id) on delete restrict,
  tenant_id uuid references public.tenants(id),
  actor_id uuid not null references auth.users(id),
  scope_key text not null,
  provider text not null check (provider in ('modal','google')),
  state text not null default 'prepared' check (state in
    ('prepared','dispatching','submitted','running','uncertain','cancel_requested','finished')),
  provider_execution_id text,
  worker_id text,
  idempotency_key text not null unique,
  estimated_cost_micros bigint not null check (estimated_cost_micros > 0),
  actual_cost_micros bigint check (actual_cost_micros >= 0),
  credits_reserved integer not null check (credits_reserved >= 0),
  credits_settled integer check (credits_settled >= 0 and credits_settled <= credits_reserved),
  cpu_micros_per_second numeric not null,
  memory_micros_per_gib_second numeric not null,
  usage jsonb not null default '{}',
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  unique(job_id)
);
-- One receipt covers one bounded lesson attempt. Retrying paid execution needs
-- explicit reconciliation; never delete a receipt to dispatch it again.
alter table public.ultimate_build_jobs add column if not exists external_execution_id uuid
  references public.external_course_executions(id);
alter table public.external_compute_policies enable row level security;
alter table public.external_course_executions enable row level security;
revoke all on public.external_compute_policies, public.external_course_executions from public, anon, authenticated;
grant select,insert,update on public.external_compute_policies, public.external_course_executions to service_role;
grant select on public.external_course_executions to authenticated;
do $policy$ begin
 if not exists(select 1 from pg_policy where polrelid='public.external_course_executions'::regclass and polname='tenant reads its external receipts') then
 create policy "tenant reads its external receipts" on public.external_course_executions
  for select to authenticated using (tenant_id is not null and exists
    (select 1 from public.profiles p where p.id=(select auth.uid()) and p.tenant_id=external_course_executions.tenant_id));
 end if;
end $policy$;

-- Protect older deployed exact-preview workers as well as the updated RPC.
-- Only the worker atomically named by the receipt may acquire its job lease.
create or replace function public.enforce_external_course_claim_owner() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
  if new.external_execution_id is not null and new.status='running' then
    if not exists(select 1 from public.external_course_executions e
      where e.id=new.external_execution_id and e.job_id=new.id and e.worker_id=new.lease_owner
      and e.state in ('running','uncertain','cancel_requested')) then
      raise exception 'EXTERNAL_EXECUTION_EXCLUSIVE_OWNER_REQUIRED';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists external_course_exclusive_owner on public.ultimate_build_jobs;
create trigger external_course_exclusive_owner before update on public.ultimate_build_jobs
  for each row execute function public.enforce_external_course_claim_owner();
revoke all on function public.enforce_external_course_claim_owner() from public,anon,authenticated;
grant execute on function public.enforce_external_course_claim_owner() to service_role;

create or replace function public.prepare_external_course_execution(p_job uuid,p_actor uuid,p_key text)
returns setof public.external_course_executions language plpgsql security invoker set search_path=''
as $$
declare
  j public.ultimate_build_jobs%rowtype;
  r public.external_course_executions%rowtype;
  policy public.external_compute_policies%rowtype;
  platform_policy public.external_compute_policies%rowtype;
  owner_id uuid; owner_tenant uuid; actor_tenant uuid; actor_role text;
  scoped text; projected bigint; spent bigint; active_count integer; credit_result record;
begin
  if coalesce(auth.jwt()->>'role','') <> 'service_role' then raise exception 'SERVICE_ROLE_REQUIRED'; end if;
  if nullif(btrim(p_key),'') is null or length(p_key)>200 then raise exception 'IDEMPOTENCY_KEY_REQUIRED'; end if;
  -- Consistent platform then scope then job lock ordering serializes budget checks.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('external-compute:platform',0));
  select * into j from public.ultimate_build_jobs where id=p_job for update;
  if not found then raise exception 'JOB_NOT_FOUND'; end if;
  select c.created_by into owner_id from public.ultimate_course_builds b join public.courses c on c.id=b.course_id where b.id=j.build_id;
  select tenant_id into owner_tenant from public.profiles where id=owner_id;
  select tenant_id,role::text into actor_tenant,actor_role from public.profiles where id=p_actor;
  if owner_tenant is null then
    if actor_role is null or actor_role not in ('admin','super_admin') then raise exception 'PLATFORM_OPERATOR_REQUIRED'; end if;
    scoped := 'platform';
  else
    if actor_tenant is distinct from owner_tenant then raise exception 'TENANT_MISMATCH'; end if;
    scoped := 'tenant:'||owner_tenant::text;
    -- Fail closed on absent, past-due or expired canonical paid subscription.
    if not exists(select 1 from public.organizations o join public.organization_subscriptions s on s.organization_id=o.id
      join public.plan_features pf on pf.plan_id=s.plan_id join public.features f on f.id=pf.feature_id
      where o.tenant_id=owner_tenant and s.status='active' and s.current_period_end>now()
      and f.code in ('course_builder','course_factory')) then raise exception 'PAID_COURSE_ENTITLEMENT_REQUIRED'; end if;
  end if;
  select * into r from public.external_course_executions where idempotency_key=p_key or job_id=p_job;
  if found then
    if r.job_id<>p_job or r.actor_id<>p_actor or r.idempotency_key<>p_key then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
    return next r; return;
  end if;
  -- Start with one targeted lesson, without editing its payload or checkpoint.
  if j.status<>'queued' or j.lease_owner is not null or j.lease_expires_at>now() or
    j.attempts>=j.max_attempts or j.available_at>now() or j.external_execution_id is not null or
    coalesce(j.payload->>'lessonBuildId','')='' or coalesce(j.payload->>'competencyId','')='' then
    raise exception 'ELIGIBLE_EXACT_LESSON_REQUIRED';
  end if;
  select * into policy from public.external_compute_policies where scope_key=scoped;
  select * into platform_policy from public.external_compute_policies where scope_key='platform';
  if policy.enabled is distinct from true or platform_policy.enabled is distinct from true then raise exception 'EXTERNAL_COMPUTE_NOT_FINANCIALLY_AUTHORIZED'; end if;
  -- Fixed initial Modal envelope: 2 CPU, 4 GiB, 1800 s, plus a 60 s lifecycle
  -- allowance. This is a conservative dispatch estimate, not an invoice cap.
  projected := ceil(1860*(2*policy.cpu_micros_per_second+4*policy.memory_micros_per_gib_second));
  if projected>policy.per_job_limit_micros or projected>platform_policy.per_job_limit_micros then raise exception 'PER_JOB_BUDGET_EXCEEDED'; end if;
  for scoped in select distinct x from unnest(array[scoped,'platform']) x loop
    select * into policy from public.external_compute_policies where scope_key=scoped;
    select count(*) into active_count from public.external_course_executions e
      where (scoped='platform' or e.scope_key=scoped) and e.state<>'finished';
    if active_count>=policy.max_active then raise exception 'COMPUTE_CONCURRENCY_LIMIT'; end if;
    select coalesce(sum(coalesce(e.actual_cost_micros,e.estimated_cost_micros)),0) into spent
      from public.external_course_executions e where (scoped='platform' or e.scope_key=scoped)
      and (e.created_at>=date_trunc('day',now()) or e.state<>'finished');
    if spent+projected>policy.daily_limit_micros then raise exception 'DAILY_COMPUTE_BUDGET_EXCEEDED'; end if;
    select coalesce(sum(coalesce(e.actual_cost_micros,e.estimated_cost_micros)),0) into spent
      from public.external_course_executions e where (scoped='platform' or e.scope_key=scoped)
      and (e.created_at>=date_trunc('month',now()) or e.state<>'finished');
    if spent+projected>policy.monthly_limit_micros then raise exception 'MONTHLY_COMPUTE_BUDGET_EXCEEDED'; end if;
  end loop;
  scoped := coalesce('tenant:'||owner_tenant::text,'platform');
  select * into policy from public.external_compute_policies where scope_key=scoped;
  insert into public.external_course_executions(job_id,tenant_id,actor_id,scope_key,provider,idempotency_key,
    estimated_cost_micros,credits_reserved,cpu_micros_per_second,memory_micros_per_gib_second)
  values(p_job,owner_tenant,p_actor,scoped,'modal',p_key,projected,
    case when owner_tenant is null then 0 else policy.credits_per_job end,
    policy.cpu_micros_per_second,policy.memory_micros_per_gib_second) returning * into r;
  if owner_tenant is not null then
    select * into credit_result from public.consume_tenant_course_builder_credits(owner_tenant,p_actor,
      'course-creation-learning-platform','external_compute:reserve',r.credits_reserved,'external:'||r.id::text||':reserve',
      jsonb_build_object('attempt_id',r.id,'reservation',true));
    if credit_result.success is distinct from true then raise exception 'INSUFFICIENT_CREDITS'; end if;
  end if;
  update public.ultimate_build_jobs set external_execution_id=r.id where id=j.id;
  return next r;
end $$;

create or replace function public.begin_external_course_dispatch(p_attempt uuid)
returns setof public.external_course_executions language sql security invoker set search_path=''
as $$ update public.external_course_executions e set state='dispatching'
  where e.id=p_attempt and e.state='prepared'
    and exists(select 1 from public.external_compute_policies p where p.scope_key=e.scope_key and p.enabled)
    and exists(select 1 from public.external_compute_policies p where p.scope_key='platform' and p.enabled)
  returning e.*; $$;

create or replace function public.ack_external_course_dispatch(p_attempt uuid,p_execution text)
returns boolean language plpgsql security invoker set search_path='' as $$
begin
  if p_execution !~ '^fc-[A-Za-z0-9]+$' then raise exception 'MODAL_EXECUTION_ID_REQUIRED'; end if;
  update public.external_course_executions set provider_execution_id=p_execution,
    state=case when state='dispatching' then 'submitted' else state end
    where id=p_attempt and state in ('dispatching','running','finished','cancel_requested','uncertain')
    and (provider_execution_id is null or provider_execution_id=p_execution);
  if not found then raise exception 'DISPATCH_ACK_NOT_PERSISTED'; end if;
  return true;
end $$;

create or replace function public.mark_external_course_uncertain(p_attempt uuid) returns void
language sql security invoker set search_path='' as $$
  update public.external_course_executions set state='uncertain' where id=p_attempt and state in ('dispatching','submitted'); $$;

create or replace function public.request_external_course_cancel(p_attempt uuid)
returns setof public.external_course_executions language sql security invoker set search_path='' as $$
  update public.external_course_executions set state='cancel_requested'
  where id=p_attempt and state<>'finished' returning *; $$;

create or replace function public.claim_external_course_job(p_attempt uuid,p_worker text)
returns setof public.ultimate_build_jobs language plpgsql security invoker set search_path='' as $$
declare r public.external_course_executions%rowtype; j public.ultimate_build_jobs%rowtype;
begin
  if nullif(btrim(p_worker),'') is null then raise exception 'WORKER_REQUIRED'; end if;
  select * into r from public.external_course_executions where id=p_attempt for update;
  if not found or r.state not in ('dispatching','submitted','uncertain') or r.worker_id is not null then return; end if;
  if not exists(select 1 from public.external_compute_policies where scope_key=r.scope_key and enabled)
    or not exists(select 1 from public.external_compute_policies where scope_key='platform' and enabled) then return; end if;
  if r.tenant_id is not null and not exists(select 1 from public.organizations o
    join public.organization_subscriptions s on s.organization_id=o.id
    join public.plan_features pf on pf.plan_id=s.plan_id join public.features f on f.id=pf.feature_id
    where o.tenant_id=r.tenant_id and s.status='active' and s.current_period_end>now()
    and f.code in ('course_builder','course_factory')) then return; end if;
  select q.* into j from public.ultimate_build_jobs q join public.ultimate_course_builds b on b.id=q.build_id
    join public.courses c on c.id=b.course_id where q.id=r.job_id and q.external_execution_id=r.id
    and q.status='queued' and q.lease_owner is null and (q.lease_expires_at is null or q.lease_expires_at<=now())
    and q.available_at<=now() and q.attempts<q.max_attempts and c.status<>'archived'::public.course_status
    for update of q;
  if not found then return; end if;
  update public.external_course_executions set state='running',worker_id=p_worker,started_at=now() where id=r.id;
  update public.ultimate_build_jobs set status='running',attempts=attempts+1,execution_generation=execution_generation+1,
    lease_owner=p_worker,heartbeat_at=now(),lease_expires_at=now()+interval '300 seconds',updated_at=now()
    where id=j.id returning * into j;
  insert into public.ultimate_job_attempt_history(job_id,execution_generation,worker_id,event_type,details)
    values(j.id,j.execution_generation,p_worker,'claimed',jsonb_build_object('provider',r.provider,'attempt_id',r.id));
  return next j;
end $$;

create or replace function public.finish_external_course_execution(p_attempt uuid,p_worker text,p_usage jsonb)
returns boolean language plpgsql security invoker set search_path='' as $$
declare r public.external_course_executions%rowtype; seconds numeric; charged integer; refund integer; measured bigint;
begin
  select * into r from public.external_course_executions where id=p_attempt for update;
  if not found or r.worker_id is distinct from p_worker then raise exception 'EXECUTION_OWNER_MISMATCH'; end if;
  if r.state='finished' then
    if r.usage<>p_usage then raise exception 'SETTLEMENT_CONFLICT'; end if;
    return false;
  end if;
  seconds := (p_usage->>'wall_seconds')::numeric;
  if seconds is null or seconds<0 or seconds>1860 or seconds='NaN'::numeric then raise exception 'BOUNDED_USAGE_REQUIRED'; end if;
  -- Do not settle while a different worker owns a lease or this worker still runs.
  if exists(select 1 from public.ultimate_build_jobs where id=r.job_id and status='running' and lease_expires_at>now()) then
    raise exception 'CANONICAL_JOB_STILL_LEASED'; end if;
  charged := least(r.credits_reserved,ceil(r.credits_reserved*seconds/1800));
  refund := r.credits_reserved-charged;
  measured := ceil(seconds*(2*r.cpu_micros_per_second+4*r.memory_micros_per_gib_second));
  if refund>0 then perform public.refund_tenant_course_builder_credits(r.tenant_id,r.actor_id,
    'course-creation-learning-platform','external_compute:release',refund,'external:'||r.id::text||':refund',
    jsonb_build_object('attempt_id',r.id)); end if;
  insert into public.provider_usage_ledger(scope_key,tenant_id,actor_id,job_id,artifact_fingerprint,provider,model,operation,
    input_units,output_units,estimated_cost_micros,actual_cost_micros,latency_ms,status,retry_classification)
    values(r.scope_key,r.tenant_id,r.actor_id,r.job_id,'external:'||r.id::text,r.provider,'cpu-2-memory-4096',
      'external_course_render',seconds*2,seconds*4,measured,null,ceil(seconds*1000),'finished','single_authorized_attempt');
  -- Keep the upper-bound budget reservation until invoice reconciliation.
  -- Observed allocation time is telemetry, not an authoritative provider bill.
  update public.external_course_executions set state='finished',finished_at=now(),usage=p_usage,
    credits_settled=charged where id=r.id;
  return true;
end $$;

-- Preserve the current role-aware Google claim implementation and all its recovery and
-- priority behavior; exclude external receipts at the canonical SQL boundary.
do $migration$
declare definition text;
begin
  select pg_get_functiondef('public.claim_ultimate_course_role_job(text,integer,text)'::regprocedure) into definition;
  if position('WHERE j.external_execution_id IS NULL AND j.status=''queued''' in definition)>0 then return; end if;
  if position('WHERE j.status=''queued'' AND j.available_at<=now()' in definition)=0 then
    raise exception 'CANONICAL_CLAIM_CHANGED_REVIEW_REQUIRED'; end if;
  definition := replace(definition,'WHERE j.status=''queued'' AND j.available_at<=now()',
    'WHERE j.external_execution_id IS NULL AND j.status=''queued'' AND j.available_at<=now()');
  definition := replace(definition,'WHERE status=''running'' AND lease_expires_at<now()',
    'WHERE external_execution_id IS NULL AND status=''running'' AND lease_expires_at<now()');
  execute definition;
end $migration$;

do $permissions$
declare f record;
begin
  for f in select oid::regprocedure as name from pg_proc where pronamespace='public'::regnamespace
    and proname in ('prepare_external_course_execution','begin_external_course_dispatch','ack_external_course_dispatch',
      'mark_external_course_uncertain','request_external_course_cancel','claim_external_course_job','finish_external_course_execution') loop
    execute format('revoke all on function %s from public,anon,authenticated',f.name);
    execute format('grant execute on function %s to service_role',f.name);
  end loop;
end $permissions$;
commit;
