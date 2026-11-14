-- Sezzle integration schema additions
-- Run in Supabase SQL Editor if these columns/tables don't exist yet

-- Add Sezzle columns to applications table (safe: IF NOT EXISTS via DO block)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'sezzle_session_uuid') THEN
    ALTER TABLE applications ADD COLUMN sezzle_session_uuid TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'sezzle_order_uuid') THEN
    ALTER TABLE applications ADD COLUMN sezzle_order_uuid TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'sezzle_reference_id') THEN
    ALTER TABLE applications ADD COLUMN sezzle_reference_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'sezzle_card_token') THEN
    ALTER TABLE applications ADD COLUMN sezzle_card_token TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'payment_provider') THEN
    ALTER TABLE applications ADD COLUMN payment_provider TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'payment_status') THEN
    ALTER TABLE applications ADD COLUMN payment_status TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'payment_amount_cents') THEN
    ALTER TABLE applications ADD COLUMN payment_amount_cents INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'payment_completed_at') THEN
    ALTER TABLE applications ADD COLUMN payment_completed_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'payment_reference') THEN
    ALTER TABLE applications ADD COLUMN payment_reference TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'applications' AND column_name = 'internal_order_id') THEN
    ALTER TABLE applications ADD COLUMN internal_order_id TEXT;
  END IF;
END $$;

-- Create payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  provider_session_id TEXT,
  provider_order_id TEXT,
  reference_id TEXT,
  internal_order_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending',
  customer_email TEXT,
  customer_name TEXT,
  program_slug TEXT,
  program_name TEXT,
  application_id TEXT,
  enrollment_id TEXT,
  card_token TEXT,
  metadata JSONB,
  -- Status timestamps
  authorized_at TIMESTAMPTZ,
  authorized_amount_cents INTEGER,
  captured_at TIMESTAMPTZ,
  captured_amount_cents INTEGER,
  refunded_at TIMESTAMPTZ,
  refunded_amount_cents INTEGER,
  released_at TIMESTAMPTZ,
  checkout_completed_at TIMESTAMPTZ,
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_order_id TEXT;
CREATE INDEX IF NOT EXISTS idx_payments_provider_order ON payments(provider_order_id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS provider_session_id TEXT;
CREATE INDEX IF NOT EXISTS idx_payments_provider_session ON payments(provider_session_id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS reference_id TEXT;
CREATE INDEX IF NOT EXISTS idx_payments_reference ON payments(reference_id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS customer_email TEXT;
CREATE INDEX IF NOT EXISTS idx_payments_email ON payments(customer_email);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- RLS for payments
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on payments" ON payments;
CREATE POLICY "Service role full access on payments"
  ON payments FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create sezzle_card_events table if it doesn't exist (used by SezzleVirtualCard component)
CREATE TABLE IF NOT EXISTS sezzle_card_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT,
  order_uuid TEXT,
  event_type TEXT NOT NULL,
  card_token TEXT,
  amount_cents INTEGER,
  customer_email TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sezzle_card_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role full access on sezzle_card_events" ON sezzle_card_events;
CREATE POLICY "Service role full access on sezzle_card_events"
  ON sezzle_card_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
