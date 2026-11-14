-- Commercial demo handoff, launch foundation and tenant commerce foundation.
-- Additive by design: does not replace existing Store billing tables.

create extension if not exists pgcrypto;

create table if not exists public.demo_sales_sessions (
  id uuid primary key default gen_random_uuid(),
  session_token text not null unique,
  product_key text not null,
  scenario_key text,
  state jsonb not null default '{}'::jsonb,
  events jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  converted_at timestamptz,
  converted_user_id uuid,
  converted_tenant_id uuid,
  converted_workspace_id uuid,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  created_at timestamptz not null default now()
);
create index if not exists demo_sales_sessions_product_idx on public.demo_sales_sessions(product_key, created_at desc);
create index if not exists demo_sales_sessions_conversion_idx on public.demo_sales_sessions(converted_at);
create index if not exists demo_sales_sessions_expiry_idx on public.demo_sales_sessions(expires_at);

create table if not exists public.launch_foundations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  organization_id uuid,
  user_id uuid not null,
  website_id uuid,
  input jsonb not null default '{}'::jsonb,
  foundation jsonb not null default '{}'::jsonb,
  status text not null default 'generated' check (status in ('generated','materialized','failed','archived')),
  model_provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists launch_foundations_tenant_idx on public.launch_foundations(tenant_id, created_at desc);
create index if not exists launch_foundations_user_idx on public.launch_foundations(user_id, created_at desc);

create table if not exists public.organization_payment_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique,
  organization_id uuid,
  stripe_account_id text not null unique,
  account_type text not null default 'express',
  charges_enabled boolean not null default false,
  payouts_enabled boolean not null default false,
  details_submitted boolean not null default false,
  status text not null default 'pending' check (status in ('pending','onboarding','active','restricted','disabled')),
  requirements jsonb not null default '{}'::jsonb,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists organization_payment_accounts_org_idx on public.organization_payment_accounts(organization_id);
create index if not exists organization_payment_accounts_status_idx on public.organization_payment_accounts(status);

create table if not exists public.tenant_offers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  organization_id uuid,
  name text not null,
  description text,
  public_slug text not null,
  pricing_type text not null default 'one_time' check (pricing_type in ('one_time','subscription')),
  amount_cents integer not null check (amount_cents >= 50),
  currency text not null default 'usd',
  billing_interval text check (billing_interval is null or billing_interval in ('day','week','month','year')),
  active boolean not null default true,
  access_config jsonb not null default '{}'::jsonb,
  platform_fee_bps integer not null default 0 check (platform_fee_bps between 0 and 5000),
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id, public_slug)
);
create index if not exists tenant_offers_tenant_idx on public.tenant_offers(tenant_id, active, created_at desc);

create table if not exists public.tenant_orders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  offer_id uuid references public.tenant_offers(id) on delete set null,
  stripe_account_id text not null,
  stripe_checkout_session_id text not null unique,
  stripe_payment_intent_id text,
  stripe_subscription_id text,
  customer_email text,
  amount_total integer,
  currency text,
  status text not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tenant_orders_tenant_idx on public.tenant_orders(tenant_id, created_at desc);
create index if not exists tenant_orders_offer_idx on public.tenant_orders(offer_id, created_at desc);
create index if not exists tenant_orders_status_idx on public.tenant_orders(status, created_at desc);

-- Community commercialization needs explicit tenant ownership. Keep columns
-- nullable for legacy rows so this migration does not break existing content.
alter table public.community_groups add column if not exists tenant_id uuid;
alter table public.community_groups add column if not exists created_by uuid;
alter table public.community_posts add column if not exists tenant_id uuid;
alter table public.community_members add column if not exists tenant_id uuid;
create index if not exists community_groups_tenant_idx on public.community_groups(tenant_id, created_at desc);
create index if not exists community_posts_tenant_idx on public.community_posts(tenant_id, created_at desc);
create index if not exists community_members_tenant_idx on public.community_members(tenant_id, created_at desc);

alter table public.demo_sales_sessions enable row level security;
alter table public.launch_foundations enable row level security;
alter table public.organization_payment_accounts enable row level security;
alter table public.tenant_offers enable row level security;
alter table public.tenant_orders enable row level security;

drop policy if exists "service role demo sales sessions" on public.demo_sales_sessions;
create policy "service role demo sales sessions" on public.demo_sales_sessions for all to service_role using (true) with check (true);
drop policy if exists "service role launch foundations" on public.launch_foundations;
create policy "service role launch foundations" on public.launch_foundations for all to service_role using (true) with check (true);
drop policy if exists "service role organization payment accounts" on public.organization_payment_accounts;
create policy "service role organization payment accounts" on public.organization_payment_accounts for all to service_role using (true) with check (true);
drop policy if exists "service role tenant offers" on public.tenant_offers;
create policy "service role tenant offers" on public.tenant_offers for all to service_role using (true) with check (true);
drop policy if exists "service role tenant orders" on public.tenant_orders;
create policy "service role tenant orders" on public.tenant_orders for all to service_role using (true) with check (true);

comment on table public.demo_sales_sessions is 'Ephemeral, non-production-data sales sandboxes that can be converted into real workspaces.';
comment on table public.organization_payment_accounts is 'Stripe Connect account state for tenant-owned commerce. Never stores bank or identity data.';
comment on table public.tenant_orders is 'Platform-side mirror of tenant connected-account Checkout sessions; Stripe remains payment source of truth.';
