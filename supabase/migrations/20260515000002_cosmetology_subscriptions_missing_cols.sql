-- Add columns that were present in the CREATE TABLE migration but missing from
-- the live table (the table was created via an earlier/partial mechanism).
-- These columns are read by the learner dashboard billing summary.

ALTER TABLE public.cosmetology_subscriptions
  ADD COLUMN IF NOT EXISTS customer_phone TEXT,
  ADD COLUMN IF NOT EXISTS full_tuition_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS amount_paid_at_checkout NUMERIC,
  ADD COLUMN IF NOT EXISTS remaining_balance NUMERIC,
  ADD COLUMN IF NOT EXISTS fully_paid BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS payment_model TEXT,
  ADD COLUMN IF NOT EXISTS bnpl_provider TEXT,
  ADD COLUMN IF NOT EXISTS affirm_charge_id TEXT,
  ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_payment_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
  ADD COLUMN IF NOT EXISTS canceled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deactivation_reason TEXT;
