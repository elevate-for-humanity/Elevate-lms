create table if not exists public.user_billing_customers (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text not null unique,
  stripe_default_payment_method_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_billing_customers enable row level security;

drop policy if exists "Users can view their billing customer" on public.user_billing_customers;
create policy "Users can view their billing customer"
  on public.user_billing_customers
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

comment on table public.user_billing_customers is
  'Canonical Stripe customer mapping for every authenticated platform user. Writes are server-only.';

