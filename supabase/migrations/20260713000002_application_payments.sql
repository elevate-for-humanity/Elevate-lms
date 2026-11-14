-- Program Application Payments Table
-- Stores $15 application fee payments for all programs

CREATE TABLE IF NOT EXISTS application_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Stripe Payment Info
  stripe_session_id VARCHAR(255) UNIQUE,
  stripe_payment_intent VARCHAR(255),
  
  -- Application Reference
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  program_slug VARCHAR(100),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Customer Info
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  
  -- Payment Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending',
    'completed',
    'refunded',
    'failed'
  )),
  
  -- Amount (always $15 = 1500 cents)
  amount_cents INTEGER DEFAULT 1500,
  
  -- Timestamps
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_application_payments_session ON application_payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_application_payments_email ON application_payments(customer_email);
CREATE INDEX IF NOT EXISTS idx_application_payments_program ON application_payments(program_slug);
CREATE INDEX IF NOT EXISTS idx_application_payments_user ON application_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_application_payments_status ON application_payments(status);

-- RLS Policies
ALTER TABLE application_payments ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for webhook)
CREATE POLICY "Service role can do everything"
  ON application_payments FOR ALL
  USING (auth.role() = 'service_role');

-- Public can insert (from webhook only)
CREATE POLICY "Service can insert applications"
  ON application_payments FOR INSERT
  WITH CHECK (true);

-- Users can view their own applications
CREATE POLICY "Users can view own applications"
  ON application_payments FOR SELECT
  USING (user_id = auth.uid());

-- Admins can read all
CREATE POLICY "Admins can read all applications"
  ON application_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER application_payments_updated_at
  BEFORE UPDATE ON application_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
