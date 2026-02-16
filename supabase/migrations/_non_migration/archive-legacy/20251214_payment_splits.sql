-- Payment Splits Table
-- Tracks how payments are split between vendor and Elevate for Humanity

CREATE TABLE IF NOT EXISTS payment_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE CASCADE,
  transaction_id TEXT, -- Affirm/Stripe transaction ID
  total_amount NUMERIC(10, 2) NOT NULL,
  vendor_name TEXT NOT NULL, -- 'milady', 'none', etc.
  vendor_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  elevate_amount NUMERIC(10, 2) NOT NULL,
  vendor_paid_at TIMESTAMPTZ,
  vendor_payment_id TEXT,
  payment_method TEXT NOT NULL, -- 'affirm', 'stripe', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_splits_enrollment 
  ON payment_splits(enrollment_id);

CREATE INDEX IF NOT EXISTS idx_payment_splits_vendor 
  ON payment_splits(vendor_name);

CREATE INDEX IF NOT EXISTS idx_payment_splits_payment_method 
  ON payment_splits(payment_method);

CREATE INDEX IF NOT EXISTS idx_payment_splits_created 
  ON payment_splits(created_at DESC);

-- RLS Policies
ALTER TABLE payment_splits ENABLE ROW LEVEL SECURITY;

-- Students can view their own payment splits
DROP POLICY IF EXISTS "payment_splits_read_own" ON payment_splits;
CREATE POLICY "payment_splits_read_own"
  ON payment_splits
  FOR SELECT
  TO authenticated
  USING (
    enrollment_id IN (
      SELECT id FROM enrollments WHERE user_id = auth.uid()
    )
  );

-- Service role can manage all splits
DROP POLICY IF EXISTS "payment_splits_service_all" ON payment_splits;
CREATE POLICY "payment_splits_service_all"
  ON payment_splits
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE payment_splits IS 'Tracks payment splits between vendor and Stripe account balance';
COMMENT ON COLUMN payment_splits.total_amount IS 'Total amount student paid via Affirm (e.g., $4,890)';
COMMENT ON COLUMN payment_splits.vendor_amount IS 'Amount paid to vendor for enrollment (e.g., $295 for Milady)';
COMMENT ON COLUMN payment_splits.elevate_amount IS 'Amount deposited to Stripe account balance (e.g., $4,595)';
COMMENT ON COLUMN payment_splits.vendor_paid_at IS 'When vendor was paid (NULL if not yet paid)';
