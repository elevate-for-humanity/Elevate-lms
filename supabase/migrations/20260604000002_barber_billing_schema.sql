-- Barber billing schema additions
--
-- Adds columns the webhook already writes but that don't exist in the DB:
--   barber_subscriptions: payment_status, failed_payment_at, suspension_deadline
--   applications: submit_token guard + backfill for nulls
--
-- Creates billing_events table for the weekly billing cron audit log.
-- All statements are idempotent (IF NOT EXISTS / IF NOT EXISTS guards).

-- ─── barber_subscriptions: payment lifecycle columns ────────────────────────

ALTER TABLE public.barber_subscriptions
  ADD COLUMN IF NOT EXISTS payment_status       TEXT    NOT NULL DEFAULT 'active'
    CHECK (payment_status IN ('active', 'past_due', 'suspended', 'cancelled', 'paid_in_full')),
  ADD COLUMN IF NOT EXISTS failed_payment_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_deadline  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason    TEXT;

CREATE INDEX IF NOT EXISTS idx_barber_subscriptions_payment_status
  ON public.barber_subscriptions (payment_status)
  WHERE payment_status IN ('past_due', 'suspended');

-- ─── applications: submit_token guard ───────────────────────────────────────
-- submit_token is defined in the CREATE TABLE baseline but may be null on
-- rows inserted before the column existed. Backfill those rows.

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS submit_token UUID DEFAULT gen_random_uuid();

UPDATE public.applications
  SET submit_token = gen_random_uuid()
  WHERE submit_token IS NULL;

-- Unique index (safe to re-run)
CREATE UNIQUE INDEX IF NOT EXISTS applications_submit_token_uq
  ON public.applications (submit_token)
  WHERE submit_token IS NOT NULL;

-- ─── billing_events: weekly billing cron audit log ──────────────────────────
-- One row per billing attempt (success or failure) from the weekly cron.
-- Separate from barber_payments (which is the Stripe-confirmed ledger).

CREATE TABLE IF NOT EXISTS public.billing_events (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_subscription_id  UUID        REFERENCES public.barber_subscriptions(id) ON DELETE CASCADE,
  user_id                 UUID        REFERENCES auth.users(id),
  event_type              TEXT        NOT NULL
    CHECK (event_type IN ('charge_attempted', 'charge_succeeded', 'charge_failed',
                          'suspended', 'reinstated', 'cancelled', 'paid_in_full')),
  amount_cents            INTEGER,
  stripe_invoice_id       TEXT,
  stripe_payment_intent   TEXT,
  weeks_remaining_before  INTEGER,
  weeks_remaining_after   INTEGER,
  failure_reason          TEXT,
  metadata                JSONB,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

-- Admins and service role can read all; users can read their own
CREATE POLICY "billing_events_service_role" ON public.billing_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "billing_events_user_read" ON public.billing_events
  FOR SELECT USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_billing_events_subscription
  ON public.billing_events (barber_subscription_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_events_user
  ON public.billing_events (user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_events_invoice_unique
  ON public.billing_events (stripe_invoice_id)
  WHERE stripe_invoice_id IS NOT NULL;
