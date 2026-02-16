-- Donations and Campaigns System
-- Full Stripe integration for Rise Foundation donations

-- Campaigns Table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  goal_amount DECIMAL(10,2) NOT NULL,
  current_amount DECIMAL(10,2) DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  image_url TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Donations Table
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_name TEXT NOT NULL,
  donor_email TEXT NOT NULL,
  donor_phone TEXT,
  amount DECIMAL(10,2) NOT NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  payment_status TEXT CHECK (payment_status IN (
    'pending',
    'processing',
    'succeeded',
    'failed',
    'refunded',
    'cancelled'
  )) DEFAULT 'pending',
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_checkout_session_id TEXT,
  receipt_sent BOOLEAN DEFAULT false,
  receipt_sent_at TIMESTAMPTZ,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('monthly', 'quarterly', 'yearly')),
  stripe_subscription_id TEXT,
  anonymous BOOLEAN DEFAULT false,
  message TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_active ON campaigns(is_active);
CREATE INDEX IF NOT EXISTS idx_campaigns_dates ON campaigns(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_donations_campaign ON donations(campaign_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(payment_status);
CREATE INDEX IF NOT EXISTS idx_donations_stripe_intent ON donations(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_donations_stripe_session ON donations(stripe_checkout_session_id);
CREATE INDEX IF NOT EXISTS idx_donations_user ON donations(user_id);
CREATE INDEX IF NOT EXISTS idx_donations_email ON donations(donor_email);
CREATE INDEX IF NOT EXISTS idx_donations_created ON donations(created_at);

-- RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- Anyone can view active campaigns
CREATE POLICY "Anyone can view active campaigns"
  ON campaigns FOR SELECT
  USING (is_active = true);

-- Admin can manage campaigns
CREATE POLICY "Admin can manage campaigns"
  ON campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Users can view their own donations
CREATE POLICY "Users can view own donations"
  ON donations FOR SELECT
  USING (
    user_id = auth.uid()
    OR donor_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Anyone can create donations (for checkout)
CREATE POLICY "Anyone can create donations"
  ON donations FOR INSERT
  WITH CHECK (true);

-- System can update donations (for webhooks)
CREATE POLICY "System can update donations"
  ON donations FOR UPDATE
  USING (true);

-- Admin can view all donations
CREATE POLICY "Admin can view all donations"
  ON donations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Function to update campaign amount when donation succeeds
CREATE OR REPLACE FUNCTION update_campaign_amount()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'succeeded' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'succeeded') THEN
    UPDATE campaigns
    SET current_amount = current_amount + NEW.amount,
        updated_at = NOW()
    WHERE id = NEW.campaign_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER donation_succeeded_update_campaign
AFTER INSERT OR UPDATE ON donations
FOR EACH ROW
EXECUTE FUNCTION update_campaign_amount();

COMMENT ON TABLE campaigns IS 'Fundraising campaigns for Rise Foundation';
COMMENT ON TABLE donations IS 'Donations with Stripe integration';

-- Seed initial campaign
INSERT INTO campaigns (name, description, goal_amount, start_date, is_active) VALUES
  ('General Fund', 'Support our mission to elevate individuals and communities through education and workforce development.', 50000.00, CURRENT_DATE, true)
ON CONFLICT DO NOTHING;
