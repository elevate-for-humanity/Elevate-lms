-- Create referral_codes table
CREATE TABLE IF NOT EXISTS referral_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('student', 'affiliate', 'partner')),
  discount_percentage INTEGER DEFAULT 0,
  commission_percentage INTEGER DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referrals table
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  reward_amount DECIMAL(10, 2),
  reward_paid BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referred_id)
);

-- Create affiliate_applications table
CREATE TABLE IF NOT EXISTS affiliate_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  website TEXT,
  social_media TEXT,
  audience TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create affiliate_payouts table
CREATE TABLE IF NOT EXISTS affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method TEXT NOT NULL,
  payment_details JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_enabled ON referral_codes(enabled);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_id ON referrals(referred_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_referral_code ON referrals(referral_code);

CREATE INDEX IF NOT EXISTS idx_affiliate_applications_user_id ON affiliate_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_applications_status ON affiliate_applications(status);

CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_user_id ON affiliate_payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_payouts_status ON affiliate_payouts(status);

-- Enable Row Level Security
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_codes

-- Users can view their own codes
CREATE POLICY "Users can view their own referral codes"
  ON referral_codes FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own codes
CREATE POLICY "Users can create their own referral codes"
  ON referral_codes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own codes
CREATE POLICY "Users can update their own referral codes"
  ON referral_codes FOR UPDATE
  USING (auth.uid() = user_id);

-- Anyone can view enabled codes (for validation)
CREATE POLICY "Anyone can view enabled referral codes"
  ON referral_codes FOR SELECT
  USING (enabled = true);

-- RLS Policies for referrals

-- Users can view referrals where they are the referrer
CREATE POLICY "Users can view their referrals"
  ON referrals FOR SELECT
  USING (auth.uid() = referrer_id);

-- Users can view referrals where they are the referred
CREATE POLICY "Users can view referrals about them"
  ON referrals FOR SELECT
  USING (auth.uid() = referred_id);

-- System can create referrals
CREATE POLICY "System can create referrals"
  ON referrals FOR INSERT
  WITH CHECK (true);

-- System can update referrals
CREATE POLICY "System can update referrals"
  ON referrals FOR UPDATE
  USING (true);

-- RLS Policies for affiliate_applications

-- Users can view their own applications
CREATE POLICY "Users can view their own affiliate applications"
  ON affiliate_applications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own applications
CREATE POLICY "Users can create affiliate applications"
  ON affiliate_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all applications
CREATE POLICY "Admins can view all affiliate applications"
  ON affiliate_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update applications
CREATE POLICY "Admins can update affiliate applications"
  ON affiliate_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for affiliate_payouts

-- Users can view their own payouts
CREATE POLICY "Users can view their own payouts"
  ON affiliate_payouts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create payout requests
CREATE POLICY "Users can create payout requests"
  ON affiliate_payouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all payouts
CREATE POLICY "Admins can view all payouts"
  ON affiliate_payouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update payouts
CREATE POLICY "Admins can update payouts"
  ON affiliate_payouts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Comments
COMMENT ON TABLE referral_codes IS 'Referral codes for users to share';
COMMENT ON TABLE referrals IS 'Tracking of referral relationships';
COMMENT ON TABLE affiliate_applications IS 'Applications to become an affiliate';
COMMENT ON TABLE affiliate_payouts IS 'Payout requests and processing';

COMMENT ON COLUMN referral_codes.code IS 'Unique referral code';
COMMENT ON COLUMN referral_codes.type IS 'Type of referral program';
COMMENT ON COLUMN referral_codes.discount_percentage IS 'Discount percentage for referred users';
COMMENT ON COLUMN referral_codes.commission_percentage IS 'Commission percentage for referrer';

COMMENT ON COLUMN referrals.status IS 'Status of the referral';
COMMENT ON COLUMN referrals.reward_amount IS 'Reward amount earned by referrer';
COMMENT ON COLUMN referrals.reward_paid IS 'Whether reward has been paid out';
