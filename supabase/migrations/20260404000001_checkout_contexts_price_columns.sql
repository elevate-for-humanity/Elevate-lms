-- Add server-authoritative price resolution columns to checkout_contexts.
-- These are written by the checkout API and read by the capture/webhook handlers
-- to verify the amount Affirm/Sezzle authorized matches what was required.

ALTER TABLE public.checkout_contexts
  ADD COLUMN IF NOT EXISTS required_amount_cents INTEGER,
  ADD COLUMN IF NOT EXISTS overpay_amount_cents   INTEGER DEFAULT 0;

-- Fix expires_at: was re-added as TEXT by the original migration's ALTER TABLE,
-- overriding the TIMESTAMPTZ from CREATE TABLE. Cast existing values and retype.
-- Safe: all existing values are ISO strings or NULL.
ALTER TABLE public.checkout_contexts
  ALTER COLUMN expires_at TYPE TIMESTAMPTZ
  USING expires_at::TIMESTAMPTZ;
