-- Create funding_payments table for tracking sponsor payments
CREATE TABLE IF NOT EXISTS funding_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
  funding_source TEXT NOT NULL DEFAULT 'WIOA',
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  status TEXT NOT NULL DEFAULT 'created',
  amount NUMERIC(10, 2),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_funding_payments_student_id ON funding_payments(student_id);
CREATE INDEX IF NOT EXISTS idx_funding_payments_program_id ON funding_payments(program_id);
CREATE INDEX IF NOT EXISTS idx_funding_payments_status ON funding_payments(status);
CREATE INDEX IF NOT EXISTS idx_funding_payments_stripe_session ON funding_payments(stripe_checkout_session_id);

-- Add RLS policies
ALTER TABLE funding_payments ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own funding payments
CREATE POLICY "Users can view own funding payments"
  ON funding_payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = student_id);

-- Allow service role to manage all funding payments
CREATE POLICY "Service role can manage funding payments"
  ON funding_payments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE funding_payments IS 'Tracks sponsor-paid funding (WIOA, WRG, etc.) for student enrollments';
