-- Invoice settlement is distinct from graduation-based host-shop payouts.
create table if not exists public.school_invoice_orders (
  id uuid primary key default gen_random_uuid(),
  billing_invoice_id uuid not null unique references public.billing_invoices(id),
  enrollment_id uuid not null unique references public.program_enrollments(id),
  program_holder_id uuid not null references public.program_holders(id),
  program_id uuid not null references public.programs(id),
  student_id uuid not null references public.profiles(id),
  retail_amount_cents integer not null check (retail_amount_cents > 0),
  school_amount_cents integer not null check (school_amount_cents > 0),
  elevate_amount_cents integer not null check (elevate_amount_cents > 0),
  settlement_status text not null default 'awaiting_school_invoice'
    check (settlement_status in ('awaiting_school_invoice','invoice_received','paid','disputed')),
  school_invoice_reference text,
  school_payment_reference text,
  school_paid_at timestamptz,
  registration_status text not null default 'pending'
    check (registration_status in ('pending','submitted','confirmed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (retail_amount_cents = school_amount_cents + elevate_amount_cents),
  check (school_amount_cents = elevate_amount_cents),
  check (settlement_status <> 'paid' or
    (school_invoice_reference is not null and school_payment_reference is not null and school_paid_at is not null))
);
alter table public.school_invoice_orders enable row level security;
revoke all on public.school_invoice_orders from anon, authenticated;
grant all on public.school_invoice_orders to service_role;
comment on table public.school_invoice_orders is 'Confirmed student payments awaiting school invoice settlement. Recording a liability never implies money was transferred or a school seat was confirmed.';
