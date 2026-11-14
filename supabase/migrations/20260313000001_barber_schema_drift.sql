-- Fix schema drift between barber webhook code and production DB.
--
-- Three tables affected:
--   program_enrollments  — 3 genuinely missing cols + 2 name-mismatch cols already exist
--   barber_subscriptions — 11 missing cols for payment tracking / BNPL / balance
--   barber_payments      — 4 missing cols for payment ledger
--
-- All statements use ADD COLUMN IF NOT EXISTS so this is safe to re-run.

-- ─── program_enrollments ────────────────────────────────────────────────────
-- stripe_checkout_session_id and enrollment_confirmed_at already exist under
-- those names. The webhook uses stripe_session_id / confirmed_at — those are
-- fixed in the webhook code (see app/api/barber/webhook/route.ts), not here.
--
-- stripe_customer_id and barber_sub_id already exist in production (added
-- by a prior manual migration). Only stripe_subscription_id is absent.

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS stripe_subscription_id  TEXT;

-- stripe_customer_id and barber_sub_id indexes (safe if already exist)
CREATE INDEX IF NOT EXISTS idx_program_enrollments_stripe_customer
  ON public.program_enrollments (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_program_enrollments_barber_sub
  ON public.program_enrollments (barber_sub_id)
  WHERE barber_sub_id IS NOT NULL;

-- ─── barber_subscriptions ───────────────────────────────────────────────────
-- Payment tracking, BNPL support, balance calculations, cancellation.

ALTER TABLE public.barber_subscriptions
  ADD COLUMN IF NOT EXISTS customer_phone          TEXT,
  ADD COLUMN IF NOT EXISTS full_tuition_amount     NUMERIC,
  ADD COLUMN IF NOT EXISTS amount_paid_at_checkout NUMERIC,
  ADD COLUMN IF NOT EXISTS remaining_balance       NUMERIC,
  ADD COLUMN IF NOT EXISTS payment_method          TEXT,
  ADD COLUMN IF NOT EXISTS bnpl_provider           TEXT,
  ADD COLUMN IF NOT EXISTS fully_paid              BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS payment_model           TEXT,
  ADD COLUMN IF NOT EXISTS canceled_at             TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_payment_date       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS hours_remaining         INTEGER;

-- ─── barber_payments ────────────────────────────────────────────────────────
-- Immutable payment ledger — one row per Stripe invoice paid.

ALTER TABLE public.barber_payments
  ADD COLUMN IF NOT EXISTS stripe_subscription_id  TEXT,
  ADD COLUMN IF NOT EXISTS stripe_invoice_id       TEXT,
  ADD COLUMN IF NOT EXISTS amount_paid             NUMERIC,
  ADD COLUMN IF NOT EXISTS payment_date            TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS invoice_url             TEXT;

CREATE INDEX IF NOT EXISTS idx_barber_payments_subscription
  ON public.barber_payments (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_barber_payments_invoice_unique
  ON public.barber_payments (stripe_invoice_id)
  WHERE stripe_invoice_id IS NOT NULL;
