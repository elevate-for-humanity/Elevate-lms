-- Digital purchases table for one-time product sales
CREATE TABLE IF NOT EXISTS digital_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id TEXT UNIQUE NOT NULL,
  stripe_payment_intent_id TEXT,
  product_name TEXT NOT NULL,
  price_id TEXT NOT NULL,
  amount_total INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  customer_email TEXT NOT NULL,
  download_url TEXT,
  download_expires_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick session lookups
CREATE INDEX idx_digital_purchases_session ON digital_purchases(stripe_session_id);
CREATE INDEX idx_digital_purchases_email ON digital_purchases(customer_email);
CREATE INDEX idx_digital_purchases_status ON digital_purchases(status);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_digital_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_digital_purchases_updated_at
  BEFORE UPDATE ON digital_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_digital_purchases_updated_at();

-- RLS policies
ALTER TABLE digital_purchases ENABLE ROW LEVEL SECURITY;

-- Allow public insert for webhook
CREATE POLICY "Allow webhook inserts" ON digital_purchases
  FOR INSERT WITH CHECK (true);

-- Allow users to view their own purchases by email
CREATE POLICY "Users can view own purchases" ON digital_purchases
  FOR SELECT USING (customer_email = current_setting('request.jwt.claims', true)::json->>'email');
