-- Training Access Keys Table
-- Employees get unique access keys for FREE training

CREATE TABLE IF NOT EXISTS training_access_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  access_key TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  employee_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  access_level TEXT DEFAULT 'full', -- full, limited
  expires_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_access_keys_key ON training_access_keys(access_key);
CREATE INDEX IF NOT EXISTS idx_training_access_keys_email ON training_access_keys(email);
CREATE INDEX IF NOT EXISTS idx_training_access_keys_active ON training_access_keys(is_active);

-- RLS
ALTER TABLE training_access_keys ENABLE ROW LEVEL SECURITY;

-- Users can view their own keys
CREATE POLICY "Users can view own access keys"
  ON training_access_keys
  FOR SELECT
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Service role can manage all
CREATE POLICY "Service role can manage access keys"
  ON training_access_keys
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Function to generate access key
CREATE OR REPLACE FUNCTION generate_access_key()
RETURNS TEXT AS $$
DECLARE
  key TEXT;
  exists BOOLEAN;
BEGIN
  LOOP
    -- Generate format: XXXX-XXXX-XXXX-XXXX
    key := UPPER(
      SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4) || '-' ||
      SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4) || '-' ||
      SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4) || '-' ||
      SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4)
    );
    
    -- Check if key already exists
    SELECT EXISTS(SELECT 1 FROM training_access_keys WHERE access_key = key) INTO exists;
    
    IF NOT exists THEN
      RETURN key;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to create access key for new employee
CREATE OR REPLACE FUNCTION create_employee_access_key(
  p_email TEXT,
  p_employee_name TEXT,
  p_expires_days INTEGER DEFAULT 365
)
RETURNS TEXT AS $$
DECLARE
  v_access_key TEXT;
BEGIN
  -- Generate unique key
  v_access_key := generate_access_key();
  
  -- Insert key
  INSERT INTO training_access_keys (
    access_key,
    email,
    employee_name,
    is_active,
    expires_at
  ) VALUES (
    v_access_key,
    LOWER(p_email),
    p_employee_name,
    true,
    NOW() + (p_expires_days || ' days')::INTERVAL
  );
  
  RETURN v_access_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_training_access_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER training_access_keys_updated_at
  BEFORE UPDATE ON training_access_keys
  FOR EACH ROW
  EXECUTE FUNCTION update_training_access_keys_updated_at();

-- Training Purchases Table
-- Track all course purchases via Stripe

CREATE TABLE IF NOT EXISTS training_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  course_id TEXT,
  course_name TEXT NOT NULL,
  stripe_session_id TEXT UNIQUE NOT NULL,
  stripe_payment_intent TEXT,
  amount_paid DECIMAL(10,2) NOT NULL,
  access_key TEXT NOT NULL,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_training_purchases_email ON training_purchases(email);
CREATE INDEX IF NOT EXISTS idx_training_purchases_stripe_session ON training_purchases(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_training_purchases_access_key ON training_purchases(access_key);
CREATE INDEX IF NOT EXISTS idx_training_purchases_purchased_at ON training_purchases(purchased_at DESC);

-- RLS
ALTER TABLE training_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view own purchases"
  ON training_purchases
  FOR SELECT
  USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Service role can manage all
CREATE POLICY "Service role can manage purchases"
  ON training_purchases
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');
