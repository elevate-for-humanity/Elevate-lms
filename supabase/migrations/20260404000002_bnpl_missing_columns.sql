-- Add missing columns required by Affirm and Sezzle webhook handlers.
-- All columns use IF NOT EXISTS — safe to re-run.

-- ── payments ─────────────────────────────────────────────────────────────────
-- Sezzle webhook writes these on order.authorized / order.captured / order.refunded
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS provider              TEXT,
  ADD COLUMN IF NOT EXISTS amount_cents          INTEGER,
  ADD COLUMN IF NOT EXISTS customer_name         TEXT,
  ADD COLUMN IF NOT EXISTS program_slug          TEXT,
  ADD COLUMN IF NOT EXISTS program_name          TEXT,
  ADD COLUMN IF NOT EXISTS application_id        UUID,
  ADD COLUMN IF NOT EXISTS internal_order_id     TEXT,
  ADD COLUMN IF NOT EXISTS card_token            TEXT,
  ADD COLUMN IF NOT EXISTS authorized_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS authorized_amount_cents INTEGER,
  ADD COLUMN IF NOT EXISTS captured_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS captured_amount_cents INTEGER,
  ADD COLUMN IF NOT EXISTS refunded_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refunded_amount_cents INTEGER,
  ADD COLUMN IF NOT EXISTS released_at           TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS checkout_completed_at TIMESTAMPTZ;

-- ── barber_subscriptions ──────────────────────────────────────────────────────
-- Affirm webhook writes affirm_charge_id; deactivation writes deactivated_at / deactivation_reason
ALTER TABLE public.barber_subscriptions
  ADD COLUMN IF NOT EXISTS affirm_charge_id      TEXT,
  ADD COLUMN IF NOT EXISTS deactivated_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deactivation_reason   TEXT;

-- ── applications ─────────────────────────────────────────────────────────────
-- Affirm webhook writes affirm_charge_id, payment_amount, payment_completed_at, refund_amount, refunded_at
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS affirm_charge_id      TEXT,
  ADD COLUMN IF NOT EXISTS payment_amount        NUMERIC,
  ADD COLUMN IF NOT EXISTS payment_amount_cents  INTEGER,
  ADD COLUMN IF NOT EXISTS payment_completed_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS refund_amount         NUMERIC,
  ADD COLUMN IF NOT EXISTS refunded_at           TIMESTAMPTZ;
