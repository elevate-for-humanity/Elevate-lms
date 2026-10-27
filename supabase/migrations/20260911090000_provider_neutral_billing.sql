-- Stripe columns elsewhere remain immutable historical references; new billing writes here.
create table if not exists public.billing_invoices (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('quickbooks', 'stripe')),
  provider_invoice_id text,
  invoice_number text,
  idempotency_key text not null unique,
  customer_external_key text not null,
  customer_email text not null,
  total_cents bigint not null check (total_cents >= 0),
  currency text not null default 'USD',
  status text not null default 'draft' check (status in ('draft','open','paid','past_due','void','uncollectible','failed')),
  due_at date,
  paid_at timestamptz,
  payment_url text,
  provider_payload jsonb not null default '{}'::jsonb,
  fulfillment_type text,
  fulfillment_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_invoice_id)
);

create table if not exists public.billing_schedules (
  id uuid primary key default gen_random_uuid(),
  customer_external_key text not null,
  customer_name text not null,
  customer_email text not null,
  canonical_product_key text not null,
  product_name text not null,
  product_description text,
  provider text not null default 'quickbooks' check (provider in ('quickbooks', 'stripe')),
  amount_cents bigint not null check (amount_cents > 0),
  cadence text not null check (cadence in ('weekly','monthly','quarterly','annual')),
  next_invoice_date date not null,
  remaining_invoices integer check (remaining_invoices is null or remaining_invoices >= 0),
  status text not null default 'active' check (status in ('active','paused','completed','canceled')),
  legacy_stripe_subscription_id text,
  fulfillment_type text,
  fulfillment_payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, customer_external_key, canonical_product_key)
);

create index if not exists billing_invoices_customer_idx on public.billing_invoices (customer_external_key, created_at desc);
create index if not exists billing_invoices_status_due_idx on public.billing_invoices (status, due_at);
create index if not exists billing_schedules_next_idx on public.billing_schedules (status, next_invoice_date);
alter table public.billing_invoices enable row level security;
alter table public.billing_schedules enable row level security;

create table if not exists public.billing_fulfillment_jobs (
  id uuid primary key default gen_random_uuid(),
  billing_invoice_id uuid not null references public.billing_invoices(id) on delete cascade,
  fulfillment_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','completed','failed')),
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (billing_invoice_id)
);
create index if not exists billing_fulfillment_jobs_pending_idx on public.billing_fulfillment_jobs (status, created_at);
alter table public.billing_fulfillment_jobs enable row level security;
comment on table public.billing_invoices is 'Canonical invoice ledger across providers. Stripe rows are historical; QuickBooks owns new invoices.';
comment on table public.billing_schedules is 'Manual invoice schedules; never stores card data and never auto-debits students.';

-- Add provider-neutral references without deleting Stripe history columns.
alter table if exists public.licenses add column if not exists billing_provider text;
alter table if exists public.licenses add column if not exists provider_subscription_id text;
alter table if exists public.subscriptions add column if not exists billing_provider text;
alter table if exists public.subscriptions add column if not exists provider_subscription_id text;
alter table if exists public.subscriptions add column if not exists provider_customer_id text;
alter table if exists public.program_enrollments add column if not exists billing_provider text;
alter table if exists public.program_enrollments add column if not exists provider_subscription_id text;
alter table if exists public.donations add column if not exists provider text;
alter table if exists public.donations add column if not exists provider_invoice_id text;
alter table if exists public.exam_bookings add column if not exists provider text;
alter table if exists public.exam_bookings add column if not exists provider_invoice_id uuid;
alter table if exists public.store_orders add column if not exists billing_provider text;
alter table if exists public.store_orders add column if not exists provider_invoice_id text;
alter table if exists public.user_entitlements add column if not exists billing_provider text;
alter table if exists public.user_entitlements add column if not exists provider_payment_id text;
alter table if exists public.organization_subscriptions add column if not exists billing_provider text;
alter table if exists public.organization_subscriptions add column if not exists provider_subscription_id text;
alter table if exists public.organization_subscriptions add column if not exists provider_customer_id text;
alter table if exists public.host_shop_partnerships add column if not exists billing_provider text;
alter table if exists public.host_shop_partnerships add column if not exists provider_subscription_id text;
alter table if exists public.implementation_orders add column if not exists billing_provider text;
alter table if exists public.implementation_orders add column if not exists provider_invoice_id text;
alter table if exists public.payment_logs add column if not exists billing_provider text;
alter table if exists public.payment_logs add column if not exists billing_invoice_id uuid references public.billing_invoices(id) on delete set null;
create unique index if not exists payment_logs_billing_invoice_uidx on public.payment_logs (billing_invoice_id) where billing_invoice_id is not null;
alter table if exists public.implementation_orders add column if not exists checkout_attempt_id uuid;
create unique index if not exists implementation_orders_checkout_attempt_uidx
  on public.implementation_orders (checkout_attempt_id) where checkout_attempt_id is not null;
alter table if exists public.store_orders add column if not exists checkout_attempt_id uuid;
create unique index if not exists store_orders_checkout_attempt_uidx
  on public.store_orders (checkout_attempt_id) where checkout_attempt_id is not null;
alter table if exists public.tenant_orders alter column stripe_account_id drop not null;
alter table if exists public.tenant_orders alter column stripe_checkout_session_id drop not null;
alter table if exists public.tenant_orders add column if not exists billing_provider text;
alter table if exists public.tenant_orders add column if not exists provider_invoice_id text;
alter table if exists public.tenant_orders add column if not exists checkout_attempt_id uuid;
create unique index if not exists tenant_orders_checkout_attempt_uidx
  on public.tenant_orders (checkout_attempt_id) where checkout_attempt_id is not null;
alter table if exists public.microcourse_orders add column if not exists billing_provider text;
alter table if exists public.microcourse_orders add column if not exists provider_invoice_id text;
alter table if exists public.microcourse_orders add column if not exists checkout_attempt_id uuid;
create unique index if not exists microcourse_orders_checkout_attempt_uidx
  on public.microcourse_orders (checkout_attempt_id) where checkout_attempt_id is not null;
alter table if exists public.microcourse_order_items alter column stripe_price_id drop not null;

create table if not exists public.provider_payables (
  id uuid primary key default gen_random_uuid(),
  billing_invoice_id uuid not null references public.billing_invoices(id) on delete restrict,
  source_type text not null check (source_type in ('tenant_offer','microcourse')),
  source_order_id uuid not null,
  source_item_id uuid not null default '00000000-0000-0000-0000-000000000000'::uuid,
  provider_id uuid not null,
  gross_amount_cents bigint not null check (gross_amount_cents > 0),
  platform_fee_cents bigint not null default 0 check (platform_fee_cents >= 0),
  payable_amount_cents bigint not null check (payable_amount_cents >= 0),
  currency text not null,
  status text not null default 'pending' check (status in ('pending','approved','paid','held','void')),
  approved_at timestamptz,
  paid_at timestamptz,
  payout_reference text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (gross_amount_cents = payable_amount_cents + platform_fee_cents)
);
create unique index if not exists provider_payables_invoice_source_uidx
  on public.provider_payables (billing_invoice_id, source_type, source_order_id, source_item_id);
create index if not exists provider_payables_provider_status_idx on public.provider_payables (provider_id, status, created_at);
alter table public.provider_payables enable row level security;
revoke all on public.provider_payables from anon, authenticated;
comment on table public.provider_payables is 'Merchant-of-record liability ledger. Payouts require a separate approved action; checkout never transfers funds automatically.';

create table if not exists public.billing_migration_authorizations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  billing_schedule_id uuid references public.billing_schedules(id) on delete set null,
  legacy_stripe_subscription_id text,
  customer_name text not null,
  customer_email text not null,
  product_name text not null,
  amount_cents bigint not null check (amount_cents > 0),
  cadence text not null check (cadence in ('weekly','monthly','quarterly','annual')),
  status text not null default 'requested' check (status in ('requested','submitted','approved','rejected','superseded')),
  document_path text,
  document_name text,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, legacy_stripe_subscription_id)
);
create index if not exists billing_migration_authorizations_user_status_idx on public.billing_migration_authorizations (user_id, status, created_at desc);
create index if not exists billing_migration_authorizations_schedule_idx on public.billing_migration_authorizations (billing_schedule_id);
create index if not exists billing_migration_authorizations_reviewer_idx on public.billing_migration_authorizations (reviewed_by) where reviewed_by is not null;
alter table public.billing_migration_authorizations enable row level security;
drop policy if exists "learners read own billing migration authorizations" on public.billing_migration_authorizations;
create policy "learners read own billing migration authorizations" on public.billing_migration_authorizations for select to authenticated using ((select auth.uid()) = user_id);
revoke insert, update, delete on public.billing_migration_authorizations from anon, authenticated;
comment on table public.billing_migration_authorizations is 'Student authorization evidence required before replacing a recurring Stripe subscription with a QuickBooks invoice schedule.';

update public.licenses set billing_provider = 'stripe', provider_subscription_id = stripe_subscription_id
where stripe_subscription_id is not null and billing_provider is null;
update public.subscriptions set billing_provider = 'stripe', provider_subscription_id = stripe_subscription_id
where stripe_subscription_id is not null and billing_provider is null;
update public.program_enrollments set billing_provider = 'stripe', provider_subscription_id = stripe_subscription_id
where stripe_subscription_id is not null and billing_provider is null;

do $$ begin
  if to_regclass('public.licenses') is not null and not exists (
    select 1 from pg_constraint where conname = 'licenses_billing_provider_check'
  ) then
    alter table public.licenses add constraint licenses_billing_provider_check
      check (billing_provider is null or billing_provider in ('quickbooks','stripe')) not valid;
  end if;
end $$;
do $$ begin
  if to_regclass('public.subscriptions') is not null and not exists (
    select 1 from pg_constraint where conname = 'subscriptions_billing_provider_check'
  ) then
    alter table public.subscriptions add constraint subscriptions_billing_provider_check
      check (billing_provider is null or billing_provider in ('quickbooks','stripe')) not valid;
  end if;
end $$;
do $$ begin
  if to_regclass('public.program_enrollments') is not null and not exists (
    select 1 from pg_constraint where conname = 'program_enrollments_billing_provider_check'
  ) then
    alter table public.program_enrollments add constraint program_enrollments_billing_provider_check
      check (billing_provider is null or billing_provider in ('quickbooks','stripe')) not valid;
  end if;
end $$;
