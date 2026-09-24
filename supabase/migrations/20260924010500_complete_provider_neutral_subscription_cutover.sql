-- Complete the active subscription cutover to provider-neutral billing fields.
-- Historical migrations remain immutable; this migration changes the live schema safely.

alter table if exists public.user_app_subscriptions
  add column if not exists billing_provider text,
  add column if not exists provider_customer_id text,
  add column if not exists provider_subscription_id text,
  add column if not exists provider_payment_id text;

alter table if exists public.organization_subscriptions
  add column if not exists provider_customer_id text,
  add column if not exists provider_payment_id text;

-- Preserve any historical identifiers before runtime stops depending on legacy columns.
update public.user_app_subscriptions
set
  provider_customer_id = coalesce(provider_customer_id, stripe_customer_id),
  provider_subscription_id = coalesce(provider_subscription_id, stripe_subscription_id),
  billing_provider = coalesce(billing_provider, case when stripe_subscription_id is not null then 'legacy_stripe' end)
where stripe_customer_id is not null or stripe_subscription_id is not null;

update public.organization_subscriptions
set
  provider_customer_id = coalesce(provider_customer_id, stripe_customer_id),
  provider_subscription_id = coalesce(provider_subscription_id, stripe_subscription_id),
  billing_provider = coalesce(billing_provider, case when stripe_subscription_id is not null then 'legacy_stripe' end)
where stripe_customer_id is not null or stripe_subscription_id is not null;

create index if not exists user_app_subscriptions_provider_subscription_idx
  on public.user_app_subscriptions (billing_provider, provider_subscription_id)
  where provider_subscription_id is not null;

create index if not exists organization_subscriptions_provider_subscription_idx
  on public.organization_subscriptions (billing_provider, provider_subscription_id)
  where provider_subscription_id is not null;
