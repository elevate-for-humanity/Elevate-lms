-- Durable, server-owned records for standalone platform implementation sales.
-- Public clients never read or write this table; checkout and Stripe webhooks
-- use the server-side Supabase admin client.

create table if not exists public.implementation_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  package_id text not null,
  package_name text not null,
  payment_choice text not null check (payment_choice in ('deposit', 'full')),
  status text not null default 'pending'
    check (status in ('pending', 'deposit_paid', 'paid_in_full', 'payment_failed', 'cancelled', 'refunded')),
  package_total_cents integer not null check (package_total_cents > 0),
  checkout_amount_cents integer not null check (checkout_amount_cents > 0),
  amount_paid_cents integer not null default 0 check (amount_paid_cents >= 0),
  balance_due_cents integer not null check (balance_due_cents >= 0),
  installment_count integer not null default 0 check (installment_count >= 0),
  installment_amount_cents integer not null default 0 check (installment_amount_cents >= 0),
  installments_paid integer not null default 0 check (installments_paid >= 0),
  customer_email text,
  customer_name text,
  customer_phone text,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  stripe_customer_id text,
  paid_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint implementation_orders_paid_not_above_total
    check (amount_paid_cents <= package_total_cents),
  constraint implementation_orders_installments_not_above_total
    check (installments_paid <= installment_count)
);

create unique index if not exists implementation_orders_checkout_session_uq
  on public.implementation_orders (stripe_checkout_session_id)
  where stripe_checkout_session_id is not null;

create index if not exists implementation_orders_status_created_idx
  on public.implementation_orders (status, created_at desc);

create index if not exists implementation_orders_customer_email_idx
  on public.implementation_orders (lower(customer_email))
  where customer_email is not null;

alter table public.implementation_orders enable row level security;
revoke all on table public.implementation_orders from anon, authenticated;
grant all on table public.implementation_orders to service_role;

comment on table public.implementation_orders is
  'Server-owned standalone platform sales, deposits, remaining balances, and manual installment schedules.';
comment on column public.implementation_orders.balance_due_cents is
  'Remaining contract balance after confirmed Stripe payments; later manual invoices update this value.';
