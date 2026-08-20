-- Canonical apprenticeship billing contract.
-- Amounts are stored in integer cents. No apprentice receives an inferred
-- installment amount; each self-pay plan must be explicitly configured.
-- Billing enforcement is opt-in per enrollment so apprentices who are not yet
-- paying (for example, Davon) are not accidentally marked delinquent.

alter table if exists public.program_enrollments
  add column if not exists installment_amount_cents integer,
  add column if not exists billing_interval text,
  add column if not exists stripe_price_id text,
  add column if not exists billing_enforcement_enabled boolean not null default false,
  add column if not exists payment_grace_days integer not null default 7,
  add column if not exists billing_state text,
  add column if not exists billing_state_changed_at timestamptz,
  add column if not exists billing_last_reconciled_at timestamptz,
  add column if not exists last_stripe_invoice_id text,
  add column if not exists last_invoice_status text,
  add column if not exists last_invoice_amount_cents integer,
  add column if not exists last_invoice_at timestamptz;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'program_enrollments_billing_interval_check'
  ) then
    alter table public.program_enrollments
      add constraint program_enrollments_billing_interval_check
      check (billing_interval is null or billing_interval in ('week', 'month'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'program_enrollments_installment_amount_check'
  ) then
    alter table public.program_enrollments
      add constraint program_enrollments_installment_amount_check
      check (installment_amount_cents is null or installment_amount_cents > 0);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'program_enrollments_payment_grace_days_check'
  ) then
    alter table public.program_enrollments
      add constraint program_enrollments_payment_grace_days_check
      check (payment_grace_days between 0 and 30);
  end if;
end $$;

create index if not exists idx_program_enrollments_apprentice_billing
  on public.program_enrollments (billing_enforcement_enabled, status, billing_state, stripe_subscription_id)
  where program_slug ilike '%apprentice%';

comment on column public.program_enrollments.installment_amount_cents is
  'Canonical recurring apprentice installment in cents. Must be explicitly configured; never inferred from malformed legacy amount fields.';
comment on column public.program_enrollments.billing_interval is
  'Recurring Stripe billing interval. Supported values: week or month.';
comment on column public.program_enrollments.billing_enforcement_enabled is
  'Explicit opt-in switch for payment enforcement. False means no delinquency rules, automatic invoicing enforcement, or access consequence should be applied.';
comment on column public.program_enrollments.billing_state is
  'Operational billing state. Financial state must not automatically delete earned training/progress records.';
