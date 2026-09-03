-- Tenant-owned Course Builder credit wallet. Course structure and learner LMS
-- delivery are not usage-metered; AI generation, assessment, and media work are.

create table if not exists public.tenant_course_builder_credit_wallets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  app_slug text not null default 'course-creation-learning-platform',
  balance integer not null default 0 check (balance >= 0),
  lifetime_granted integer not null default 0 check (lifetime_granted >= 0),
  lifetime_used integer not null default 0 check (lifetime_used >= 0),
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, app_slug)
);

create table if not exists public.tenant_course_builder_credit_ledger (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  app_slug text not null,
  operation text not null,
  entry_type text not null check (entry_type in ('grant', 'usage', 'refund', 'adjustment')),
  credits_delta integer not null,
  balance_after integer not null check (balance_after >= 0),
  idempotency_key text not null unique,
  source text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_course_builder_credit_ledger_tenant_created
  on public.tenant_course_builder_credit_ledger (tenant_id, created_at desc);
create index if not exists idx_course_builder_credit_ledger_user
  on public.tenant_course_builder_credit_ledger (user_id)
  where user_id is not null;

alter table public.tenant_course_builder_credit_wallets enable row level security;
alter table public.tenant_course_builder_credit_ledger enable row level security;

drop policy if exists "tenant members read course builder wallet" on public.tenant_course_builder_credit_wallets;
create policy "tenant members read course builder wallet"
  on public.tenant_course_builder_credit_wallets for select to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.tenant_id = tenant_course_builder_credit_wallets.tenant_id
  ));

drop policy if exists "tenant members read course builder ledger" on public.tenant_course_builder_credit_ledger;
create policy "tenant members read course builder ledger"
  on public.tenant_course_builder_credit_ledger for select to authenticated
  using (exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid())
      and p.tenant_id = tenant_course_builder_credit_ledger.tenant_id
  ));

revoke all on table public.tenant_course_builder_credit_wallets from public, anon;
revoke all on table public.tenant_course_builder_credit_ledger from public, anon;
grant select on table public.tenant_course_builder_credit_wallets to authenticated;
grant select on table public.tenant_course_builder_credit_ledger to authenticated;
grant select on table public.tenant_course_builder_credit_wallets to service_role;
grant select on table public.tenant_course_builder_credit_ledger to service_role;

create or replace function public.grant_tenant_course_builder_credits(
  p_tenant_id uuid,
  p_app_slug text,
  p_credits integer,
  p_operation text,
  p_idempotency_key text,
  p_period_start timestamptz default null,
  p_period_end timestamptz default null,
  p_metadata jsonb default '{}'::jsonb
)
returns table (applied boolean, balance integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance integer;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service role required'; end if;
  if p_credits <= 0 or nullif(trim(p_idempotency_key), '') is null then raise exception 'positive credits and idempotency key required'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_idempotency_key, 0));

  select l.balance_after into v_balance
  from public.tenant_course_builder_credit_ledger l
  where l.idempotency_key = p_idempotency_key;
  if found then return query select false, v_balance; return; end if;

  insert into public.tenant_course_builder_credit_wallets(tenant_id, app_slug)
  values (p_tenant_id, p_app_slug)
  on conflict (tenant_id, app_slug) do nothing;

  update public.tenant_course_builder_credit_wallets
  set balance = balance + p_credits,
      lifetime_granted = lifetime_granted + p_credits,
      current_period_start = coalesce(p_period_start, current_period_start),
      current_period_end = coalesce(p_period_end, current_period_end),
      updated_at = now()
  where tenant_id = p_tenant_id and app_slug = p_app_slug
  returning tenant_course_builder_credit_wallets.balance into v_balance;

  insert into public.tenant_course_builder_credit_ledger(
    tenant_id, app_slug, operation, entry_type, credits_delta,
    balance_after, idempotency_key, source, metadata
  ) values (
    p_tenant_id, p_app_slug, p_operation, 'grant', p_credits,
    v_balance, p_idempotency_key, 'stripe_invoice', p_metadata
  );
  return query select true, v_balance;
end;
$$;

create or replace function public.consume_tenant_course_builder_credits(
  p_tenant_id uuid,
  p_user_id uuid,
  p_app_slug text,
  p_operation text,
  p_cost integer,
  p_idempotency_key text,
  p_metadata jsonb default '{}'::jsonb
)
returns table (applied boolean, success boolean, balance integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance integer;
  v_delta integer;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service role required'; end if;
  if p_cost <= 0 or nullif(trim(p_idempotency_key), '') is null then raise exception 'positive cost and idempotency key required'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_idempotency_key, 0));

  select l.balance_after, l.credits_delta into v_balance, v_delta
  from public.tenant_course_builder_credit_ledger l
  where l.idempotency_key = p_idempotency_key;
  if found then return query select false, v_delta < 0, v_balance; return; end if;

  select w.balance into v_balance
  from public.tenant_course_builder_credit_wallets w
  where w.tenant_id = p_tenant_id and w.app_slug = p_app_slug
  for update;
  if v_balance is null or v_balance < p_cost then
    return query select false, false, coalesce(v_balance, 0);
    return;
  end if;

  v_balance := v_balance - p_cost;
  update public.tenant_course_builder_credit_wallets
  set balance = v_balance,
      lifetime_used = lifetime_used + p_cost,
      updated_at = now()
  where tenant_id = p_tenant_id and app_slug = p_app_slug;

  insert into public.tenant_course_builder_credit_ledger(
    tenant_id, user_id, app_slug, operation, entry_type, credits_delta,
    balance_after, idempotency_key, source, metadata
  ) values (
    p_tenant_id, p_user_id, p_app_slug, p_operation, 'usage', -p_cost,
    v_balance, p_idempotency_key, 'course_builder', p_metadata
  );
  return query select true, true, v_balance;
end;
$$;

create or replace function public.refund_tenant_course_builder_credits(
  p_tenant_id uuid,
  p_user_id uuid,
  p_app_slug text,
  p_operation text,
  p_credits integer,
  p_idempotency_key text,
  p_metadata jsonb default '{}'::jsonb
)
returns table (applied boolean, balance integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_balance integer;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service role required'; end if;
  if p_credits <= 0 or nullif(trim(p_idempotency_key), '') is null then raise exception 'positive credits and idempotency key required'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_idempotency_key, 0));
  select l.balance_after into v_balance from public.tenant_course_builder_credit_ledger l where l.idempotency_key = p_idempotency_key;
  if found then return query select false, v_balance; return; end if;

  update public.tenant_course_builder_credit_wallets
  set balance = balance + p_credits,
      lifetime_used = greatest(0, lifetime_used - p_credits),
      updated_at = now()
  where tenant_id = p_tenant_id and app_slug = p_app_slug
  returning tenant_course_builder_credit_wallets.balance into v_balance;
  if v_balance is null then raise exception 'course builder credit wallet not found'; end if;

  insert into public.tenant_course_builder_credit_ledger(
    tenant_id, user_id, app_slug, operation, entry_type, credits_delta,
    balance_after, idempotency_key, source, metadata
  ) values (
    p_tenant_id, p_user_id, p_app_slug, p_operation, 'refund', p_credits,
    v_balance, p_idempotency_key, 'course_builder', p_metadata
  );
  return query select true, v_balance;
end;
$$;

revoke all on function public.grant_tenant_course_builder_credits(uuid,text,integer,text,text,timestamptz,timestamptz,jsonb) from public, anon, authenticated;
revoke all on function public.consume_tenant_course_builder_credits(uuid,uuid,text,text,integer,text,jsonb) from public, anon, authenticated;
revoke all on function public.refund_tenant_course_builder_credits(uuid,uuid,text,text,integer,text,jsonb) from public, anon, authenticated;
grant execute on function public.grant_tenant_course_builder_credits(uuid,text,integer,text,text,timestamptz,timestamptz,jsonb) to service_role;
grant execute on function public.consume_tenant_course_builder_credits(uuid,uuid,text,text,integer,text,jsonb) to service_role;
grant execute on function public.refund_tenant_course_builder_credits(uuid,uuid,text,text,integer,text,jsonb) to service_role;
