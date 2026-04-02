-- Add payment tracking columns to applications table.
-- These allow the approval pipeline to gate on payment_status
-- without querying stripe_sessions_staging as a side-channel.

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS payment_status    text NOT NULL DEFAULT 'unpaid',
  ADD COLUMN IF NOT EXISTS payment_intent_id text;

-- Index for payment-gated approval queries
CREATE INDEX IF NOT EXISTS idx_applications_payment_status
  ON public.applications(payment_status);

-- Backfill: mark any application that already has a linked paid Stripe session as paid.
-- Safe to run multiple times (IF NOT EXISTS + WHERE clause).
UPDATE public.applications a
SET    payment_status = 'paid'
FROM   public.stripe_sessions_staging s
WHERE  s.application_id = a.id
  AND  s.payment_status = 'paid'
  AND  a.payment_status = 'unpaid';
