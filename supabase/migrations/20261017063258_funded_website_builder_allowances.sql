-- Payment-backed Website Builder allowances. No invoices or charges are created.
-- Paid access and its credit grant commit together; a payment can fund only once.
create table public.website_builder_paid_grants (
  billing_invoice_id uuid primary key references public.billing_invoices(id),
  user_id uuid not null references auth.users(id),
  plan text not null check (plan in ('starter','professional','enterprise')),
  credits integer not null check (credits > 0),
  period_start timestamptz not null,
  period_end timestamptz not null,
  created_at timestamptz not null default now()
);
alter table public.website_builder_paid_grants enable row level security;
revoke all on public.website_builder_paid_grants from public, anon, authenticated;
grant select, insert on public.website_builder_paid_grants to service_role;

create or replace function public.activate_paid_website_builder_v1(p_invoice_id uuid)
returns boolean language plpgsql security definer set search_path = public
as $$
declare
  v_invoice public.billing_invoices%rowtype;
  v_user uuid;
  v_plan text;
  v_credits integer;
  v_min_cents integer;
  v_start timestamptz;
  v_end timestamptz;
  v_balance integer;
begin
  if (select auth.role()) is distinct from 'service_role' then raise exception 'not authorized'; end if;
  select * into v_invoice from public.billing_invoices where id=p_invoice_id for update;
  if not found or v_invoice.status is distinct from 'paid' or v_invoice.paid_at is null
    or upper(v_invoice.currency) <> 'USD'
    or v_invoice.fulfillment_type is distinct from 'individual_app_subscription'
    or (v_invoice.fulfillment_payload->>'app_slug') is distinct from 'website-builder'
    then raise exception 'verified Website Builder payment required'; end if;
  v_user := (v_invoice.fulfillment_payload->>'user_id')::uuid;
  v_plan := v_invoice.fulfillment_payload->>'plan_id';
  if v_user is null or v_invoice.customer_external_key <> 'user:' || v_user::text then
    raise exception 'payment owner mismatch'; end if;
  case v_plan
    when 'starter' then v_credits:=500; v_min_cents:=2900;
    when 'professional' then v_credits:=2500; v_min_cents:=7900;
    when 'enterprise' then v_credits:=10000; v_min_cents:=19900;
    else raise exception 'unknown Website Builder plan';
  end case;
  if v_invoice.fulfillment_payload->>'amount_cents' is null or v_invoice.total_cents < v_min_cents or v_invoice.total_cents <>
    (v_invoice.fulfillment_payload->>'amount_cents')::bigint then
    raise exception 'payment amount mismatch'; end if;
  -- Lock by billing owner before touching the subscription and wallet.
  perform pg_advisory_xact_lock(hashtextextended('website-builder:' || v_user::text, 0));
  if exists(select 1 from public.website_builder_paid_grants where billing_invoice_id=p_invoice_id) then return false; end if;
  v_start:=v_invoice.paid_at; v_end:=v_start + interval '1 month';
  if v_start > now() or v_end <= now() then raise exception 'payment period is not current'; end if;
  if exists(select 1 from public.user_app_subscriptions where user_id=v_user and app_slug='website-builder'
    and current_period_start > v_start) then raise exception 'superseded payment'; end if;
  insert into public.user_app_subscriptions(user_id,app_slug,plan,status,trial_ends_at,current_period_start,current_period_end,billing_provider,provider_subscription_id,updated_at)
    values(v_user,'website-builder',v_plan,'active',null,v_start,v_end,v_invoice.provider,
      'schedule:user:' || v_user::text || ':individual-app-website-builder',now())
    on conflict(user_id,app_slug) do update set plan=excluded.plan,status='active',trial_ends_at=null,
      current_period_start=v_start,current_period_end=v_end,billing_provider=excluded.billing_provider,
      provider_subscription_id=excluded.provider_subscription_id,updated_at=now();
  insert into public.user_app_credit_wallets(user_id,app_slug,balance,lifetime_granted,lifetime_used)
    values(v_user,'website-builder',0,0,0) on conflict(user_id,app_slug) do nothing;
  select balance into v_balance from public.user_app_credit_wallets where user_id=v_user and app_slug='website-builder' for update;
  if v_balance > 0 then
    insert into public.user_app_credit_ledger(user_id,app_slug,operation,credits_delta,balance_after,source,metadata)
      values(v_user,'website-builder','period_reset',-v_balance,0,'expiry',jsonb_build_object('billing_invoice_id',p_invoice_id));
  end if;
  update public.user_app_credit_wallets set balance=v_credits,lifetime_granted=lifetime_granted+v_credits,updated_at=now()
    where user_id=v_user and app_slug='website-builder';
  insert into public.user_app_credit_ledger(user_id,app_slug,operation,credits_delta,balance_after,source,metadata)
    values(v_user,'website-builder','paid_monthly_allowance',v_credits,v_credits,'payment',jsonb_build_object('billing_invoice_id',p_invoice_id,'plan',v_plan,'period_end',v_end));
  insert into public.website_builder_paid_grants(billing_invoice_id,user_id,plan,credits,period_start,period_end)
    values(p_invoice_id,v_user,v_plan,v_credits,v_start,v_end);
  return true;
end;
$$;
revoke all on function public.activate_paid_website_builder_v1(uuid) from public,anon,authenticated;
grant execute on function public.activate_paid_website_builder_v1(uuid) to service_role;

-- Only the backend may choose usage costs or initialize trial funds.
-- A browser cannot mint an arbitrary trial balance or submit a zero-cost operation.
revoke all on function public.ensure_app_trial_wallet(uuid,text,integer) from public,anon,authenticated;
revoke all on function public.consume_app_credits(uuid,text,text,integer) from public,anon,authenticated;
grant execute on function public.ensure_app_trial_wallet(uuid,text,integer) to service_role;
grant execute on function public.consume_app_credits(uuid,text,text,integer) to service_role;

create or replace function public.consume_website_builder_credits_v1(
  p_user_id uuid, p_operation text, p_quantity integer default 1
)
returns table(success boolean,balance integer)
language plpgsql security definer set search_path=public
as $$
declare v_cost integer; v_subscription public.user_app_subscriptions%rowtype;
begin
  if (select auth.role()) is distinct from 'service_role' then raise exception 'not authorized'; end if;
  if p_quantity is null or p_quantity < 1 or p_quantity > 3
    or (p_quantity <> 1 and p_operation <> 'initial_site_generation') then raise exception 'invalid usage quantity'; end if;
  v_cost := case p_operation
    when 'initial_site_generation' then 60 when 'paris_edit' then 8
    when 'assistant_chat' then 12 when 'marketing_generation' then 25
    when 'image_generation' then 40 when 'grant_draft' then 80
    when 'course_generation' then 150 when 'video_generation' then 200 else null end;
  if v_cost is null then raise exception 'invalid Website Builder operation'; end if;
  select * into v_subscription from public.user_app_subscriptions
    where user_id=p_user_id and app_slug='website-builder' for share;
  if not found or not coalesce((
    (v_subscription.status='trial' and v_subscription.trial_ends_at > now()) or
    (v_subscription.status='active' and v_subscription.current_period_start <= now()
      and v_subscription.current_period_end > now())
  ),false) then return query select false,0; return; end if;
  return query select * from public.consume_app_credits(p_user_id,'website-builder',p_operation,v_cost*p_quantity);
end;
$$;
revoke all on function public.consume_website_builder_credits_v1(uuid,text,integer) from public,anon,authenticated;
grant execute on function public.consume_website_builder_credits_v1(uuid,text,integer) to service_role;

-- Owners may read their Website Builder entitlement, but only the backend may
-- create/change it. Other app flows retain their existing policies.
create policy website_builder_backend_insert on public.user_app_subscriptions
  as restrictive for insert to authenticated with check (app_slug is distinct from 'website-builder');
create policy website_builder_backend_update on public.user_app_subscriptions
  as restrictive for update to authenticated using (app_slug is distinct from 'website-builder')
  with check (app_slug is distinct from 'website-builder');
create policy website_builder_backend_delete on public.user_app_subscriptions
  as restrictive for delete to authenticated using (app_slug is distinct from 'website-builder');
create index website_builder_paid_grants_user_idx on public.website_builder_paid_grants(user_id);

-- The existing Course Builder wallet had no QuickBooks renewal grant path.
create or replace function public.grant_course_builder_paid_invoice_v1(p_invoice_id uuid)
returns boolean language plpgsql security definer set search_path=public
as $$
declare v_invoice public.billing_invoices%rowtype; v_tenant uuid;
  v_months integer; v_end timestamptz; v_applied boolean;
begin
  if (select auth.role()) is distinct from 'service_role' then raise exception 'not authorized'; end if;
  select * into v_invoice from public.billing_invoices where id=p_invoice_id for update;
  if not found or v_invoice.status is distinct from 'paid' or v_invoice.paid_at is null
    or upper(v_invoice.currency) is distinct from 'USD'
    or v_invoice.fulfillment_type is distinct from 'platform_subscription'
    then raise exception 'verified platform payment required'; end if;
  if not coalesce((v_invoice.fulfillment_payload->'addon_codes') ? 'course-creation-learning-platform',false) then return false; end if;
  v_tenant:=(v_invoice.fulfillment_payload->>'tenant_id')::uuid;
  if v_tenant is null or (v_invoice.fulfillment_payload->>'organization_id') is null
    or v_invoice.customer_external_key is distinct from 'organization:' || (v_invoice.fulfillment_payload->>'organization_id')
    then raise exception 'payment owner mismatch'; end if;
  perform pg_advisory_xact_lock(hashtextextended('course-builder-funded:' || v_tenant::text,0));
  if exists(select 1 from public.tenant_course_builder_credit_ledger where idempotency_key='billing-invoice:' || p_invoice_id::text || ':course-builder') then return false; end if;
  if exists(select 1 from public.tenant_course_builder_credit_wallets where tenant_id=v_tenant and app_slug='course-creation-learning-platform' and current_period_start > v_invoice.paid_at) then raise exception 'superseded payment'; end if;
  v_months:=case v_invoice.fulfillment_payload->>'billing_interval' when 'monthly' then 1 when 'annual' then 12 else null end;
  if v_months is null or (v_invoice.fulfillment_payload->>'amount_cents') is null
    or v_invoice.total_cents < 7900*v_months
    or v_invoice.total_cents <> (v_invoice.fulfillment_payload->>'amount_cents')::bigint
    then raise exception 'payment amount or interval mismatch'; end if;
  v_end:=v_invoice.paid_at + make_interval(months=>v_months);
  if v_invoice.paid_at > now() or v_end <= now() then raise exception 'payment period is not current'; end if;
  select applied into v_applied from public.grant_tenant_course_builder_credits(v_tenant,
    'course-creation-learning-platform',2500*v_months,'paid_subscription_allowance',
    'billing-invoice:' || p_invoice_id::text || ':course-builder',v_invoice.paid_at,v_end,
    jsonb_build_object('billing_invoice_id',p_invoice_id,'billing_provider',v_invoice.provider));
  update public.tenant_course_builder_credit_ledger set source='billing_invoice'
    where idempotency_key='billing-invoice:' || p_invoice_id::text || ':course-builder';
  return v_applied;
end;
$$;
revoke all on function public.grant_course_builder_paid_invoice_v1(uuid) from public,anon,authenticated;
grant execute on function public.grant_course_builder_paid_invoice_v1(uuid) to service_role;

-- Expired paid periods cannot keep dispatching new Course Builder work.
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
  v_period_end timestamptz;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'service role required'; end if;
  if p_cost <= 0 or nullif(trim(p_idempotency_key), '') is null then raise exception 'positive cost and idempotency key required'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_idempotency_key, 0));

  select l.balance_after, l.credits_delta into v_balance, v_delta
  from public.tenant_course_builder_credit_ledger l
  where l.idempotency_key = p_idempotency_key;
  if found then return query select false, v_delta < 0, v_balance; return; end if;

  select w.balance,w.current_period_end into v_balance,v_period_end
  from public.tenant_course_builder_credit_wallets w
  where w.tenant_id = p_tenant_id and w.app_slug = p_app_slug
  for update;
  if v_balance is null or v_balance < p_cost or v_period_end is null or v_period_end <= now() then
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


-- Qualify wallet columns: RETURNS TABLE(balance) otherwise shadows balance.
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

  update public.tenant_course_builder_credit_wallets as w
  set balance = w.balance + p_credits,
      lifetime_granted = w.lifetime_granted + p_credits,
      current_period_start = coalesce(p_period_start, w.current_period_start),
      current_period_end = coalesce(p_period_end, w.current_period_end),
      updated_at = now()
  where tenant_id = p_tenant_id and app_slug = p_app_slug
  returning w.balance into v_balance;

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


-- Qualify wallet columns: RETURNS TABLE(balance) otherwise shadows balance.
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

  update public.tenant_course_builder_credit_wallets as w
  set balance = w.balance + p_credits,
      lifetime_used = greatest(0, w.lifetime_used - p_credits),
      updated_at = now()
  where tenant_id = p_tenant_id and app_slug = p_app_slug
  returning w.balance into v_balance;
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

