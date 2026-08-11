-- Community Hub commercialization: entitlement SKU + tenant-owned access tiers.

insert into public.saas_addon_catalog (code, name, monthly_price, feature_codes, active, sort_order)
values (
  'community-hub',
  'Community Hub',
  39.00,
  array['community','community_groups','community_events','community_gamification','community_memberships']::text[],
  true,
  28
)
on conflict (code) do update set
  name = excluded.name,
  monthly_price = excluded.monthly_price,
  feature_codes = excluded.feature_codes,
  active = excluded.active,
  sort_order = excluded.sort_order;

create table if not exists public.community_membership_plans (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  name text not null,
  slug text not null,
  description text,
  access_level text not null default 'basic' check (access_level in ('free','basic','premium','vip','cohort')),
  amount_cents integer not null default 0 check (amount_cents >= 0),
  currency text not null default 'usd',
  billing_interval text check (billing_interval is null or billing_interval in ('month','year')),
  stripe_offer_id uuid references public.tenant_offers(id) on delete set null,
  entitlements jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id, slug)
);

create table if not exists public.community_member_access (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null,
  member_id uuid references public.community_members(id) on delete cascade,
  user_id uuid,
  plan_id uuid references public.community_membership_plans(id) on delete set null,
  status text not null default 'active' check (status in ('trialing','active','past_due','paused','canceled','expired')),
  stripe_subscription_id text,
  started_at timestamptz not null default now(),
  current_period_end timestamptz,
  canceled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.community_events add column if not exists tenant_id uuid;
alter table public.community_events add column if not exists created_by uuid;
alter table public.community_events add column if not exists access_level text not null default 'free';
alter table public.community_groups add column if not exists access_level text not null default 'free';
alter table public.community_posts add column if not exists access_level text not null default 'free';

create index if not exists community_membership_plans_tenant_idx on public.community_membership_plans(tenant_id, active, created_at desc);
create index if not exists community_member_access_tenant_idx on public.community_member_access(tenant_id, status, created_at desc);
create index if not exists community_member_access_user_idx on public.community_member_access(user_id, tenant_id);
create index if not exists community_events_tenant_idx on public.community_events(tenant_id, start_date);

alter table public.community_membership_plans enable row level security;
alter table public.community_member_access enable row level security;

drop policy if exists "service role community membership plans" on public.community_membership_plans;
create policy "service role community membership plans" on public.community_membership_plans
  for all to service_role using (true) with check (true);
drop policy if exists "service role community member access" on public.community_member_access;
create policy "service role community member access" on public.community_member_access
  for all to service_role using (true) with check (true);

comment on table public.community_membership_plans is 'Tenant-owned free and paid community access tiers.';
comment on table public.community_member_access is 'Member entitlement state for tenant community plans; Stripe remains billing source of truth.';
