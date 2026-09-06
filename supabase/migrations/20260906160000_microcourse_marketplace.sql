-- Third-party microcourse marketplace.
-- Stripe account: elevateforhumanity.org (acct_1OKSVyH4a2yrVOt5).
-- Funds flow: platform charge, then separate provider transfers.
create extension if not exists pgcrypto;

create table if not exists public.microcourse_providers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete restrict,
  provider_key text not null unique check (provider_key ~ '^[a-z0-9-]+$'),
  display_name text not null,
  stripe_account_id text unique,
  transfers_capability_status text not null default 'inactive'
    check (transfers_capability_status in ('inactive','pending','active','restricted')),
  onboarding_status text not null default 'not_started'
    check (onboarding_status in ('not_started','pending','complete','restricted')),
  active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (not active or (stripe_account_id is not null and transfers_capability_status = 'active'))
);

create table if not exists public.microcourses (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.microcourse_providers(id) on delete restrict,
  course_id uuid references public.courses(id) on delete set null,
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  description text,
  category text not null,
  duration_hours numeric(8,2) check (duration_hours is null or duration_hours > 0),
  provider_cost_cents integer not null check (provider_cost_cents > 0),
  markup_bps integer not null default 5000 check (markup_bps = 5000),
  retail_price_cents integer generated always as
    (((provider_cost_cents::bigint * (10000 + markup_bps)) + 9999) / 10000)::integer stored,
  currency text not null default 'usd' check (currency = lower(currency) and length(currency) = 3),
  stripe_product_id text unique,
  stripe_price_id text unique,
  bnpl_enabled boolean not null default true,
  provider_enrollment_url text,
  image_url text,
  status text not null default 'draft'
    check (status in ('draft','active','paused','archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'active' or (stripe_product_id is not null and stripe_price_id is not null))
);

create table if not exists public.microcourse_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  customer_email text,
  currency text not null default 'usd',
  retail_total_cents integer not null check (retail_total_cents > 0),
  provider_total_cents integer not null check (provider_total_cents > 0),
  elevate_gross_cents integer generated always as (retail_total_cents - provider_total_cents) stored,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  stripe_charge_id text unique,
  transfer_group text not null unique,
  status text not null default 'awaiting_payment'
    check (status in ('awaiting_payment','paid','provider_transfer_pending','provider_paid','access_ready','failed','refunded','disputed')),
  access_status text not null default 'locked'
    check (access_status in ('locked','provisioning','ready','paused','revoked')),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (retail_total_cents >= provider_total_cents)
);

create table if not exists public.microcourse_order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.microcourse_orders(id) on delete restrict,
  microcourse_id uuid not null references public.microcourses(id) on delete restrict,
  provider_id uuid not null references public.microcourse_providers(id) on delete restrict,
  title_snapshot text not null,
  stripe_price_id text not null,
  provider_cost_cents integer not null check (provider_cost_cents > 0),
  retail_price_cents integer not null check (retail_price_cents > 0),
  provider_transfer_id text unique,
  transfer_status text not null default 'pending'
    check (transfer_status in ('pending','transferred','reversed','failed')),
  access_status text not null default 'locked'
    check (access_status in ('locked','provisioning','ready','paused','revoked')),
  unique(order_id, microcourse_id)
);

create table if not exists public.microcourse_settlement_ledger (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.microcourse_orders(id) on delete restrict,
  order_item_id uuid references public.microcourse_order_items(id) on delete restrict,
  event_type text not null check (event_type in ('payment','provider_transfer','elevate_markup','refund','transfer_reversal','dispute')),
  amount_cents integer not null,
  currency text not null default 'usd',
  stripe_event_id text,
  stripe_object_id text,
  idempotency_key text not null unique,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists microcourses_catalog_idx on public.microcourses(status, category);
create index if not exists microcourse_items_order_idx on public.microcourse_order_items(order_id);
create index if not exists microcourse_orders_user_idx on public.microcourse_orders(user_id, created_at desc);

alter table public.microcourse_providers enable row level security;
alter table public.microcourses enable row level security;
alter table public.microcourse_orders enable row level security;
alter table public.microcourse_order_items enable row level security;
alter table public.microcourse_settlement_ledger enable row level security;

drop policy if exists "public reads active microcourse providers" on public.microcourse_providers;
create policy "public reads active microcourse providers" on public.microcourse_providers
for select to anon, authenticated using (active);

drop policy if exists "public reads active microcourses" on public.microcourses;
create policy "public reads active microcourses" on public.microcourses
for select to anon, authenticated using (
  status = 'active' and exists (
    select 1 from public.microcourse_providers p where p.id = provider_id and p.active
  )
);

drop policy if exists "buyers read own microcourse orders" on public.microcourse_orders;
create policy "buyers read own microcourse orders" on public.microcourse_orders
for select to authenticated using (user_id = auth.uid());

drop policy if exists "buyers read own microcourse order items" on public.microcourse_order_items;
create policy "buyers read own microcourse order items" on public.microcourse_order_items
for select to authenticated using (
  exists (select 1 from public.microcourse_orders o where o.id = order_id and o.user_id = auth.uid())
);

revoke insert, update, delete on public.microcourse_providers from anon, authenticated;
revoke insert, update, delete on public.microcourses from anon, authenticated;
revoke insert, update, delete on public.microcourse_orders from anon, authenticated;
revoke insert, update, delete on public.microcourse_order_items from anon, authenticated;
revoke all on public.microcourse_settlement_ledger from anon, authenticated;

comment on column public.microcourses.provider_cost_cents is 'Amount owed to the certifier, in minor currency units.';
comment on column public.microcourses.retail_price_cents is 'Provider cost plus the required 50% Elevate markup.';
comment on table public.microcourse_settlement_ledger is 'Append-only settlement evidence. Application code must never update or delete rows.';
