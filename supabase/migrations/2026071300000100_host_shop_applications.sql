-- Host Shop Applications Table
-- Stores host shop partnership applications and fee payments

CREATE TABLE IF NOT EXISTS host_shop_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Stripe Payment Info
  stripe_session_id VARCHAR(255),
  stripe_payment_intent VARCHAR(255),
  
  -- Application Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN (
    'pending',
    'pending_review',
    'approved',
    'rejected',
    'refunded',
    'expired'
  )),
  fee_status VARCHAR(50) DEFAULT 'pending' CHECK (fee_status IN (
    'pending',
    'paid',
    'refunded',
    'failed'
  )),
  fee_amount_cents INTEGER DEFAULT 5000,
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  
  -- Business Information
  business_name VARCHAR(255),
  business_type VARCHAR(50) CHECK (business_type IN (
    'salon',
    'barbershop',
    'spa',
    'nail_studio',
    'esthetics_studio',
    'beauty_salon',
    'other'
  )),
  license_number VARCHAR(100),
  address TEXT,
  
  -- Contact Information
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  
  -- Partner Tiers
  partner_tier VARCHAR(50) DEFAULT 'free' CHECK (partner_tier IN (
    'free',
    'bronze',
    'silver',
    'gold',
    'platinum'
  )),
  tier_started_at TIMESTAMPTZ,
  tier_expires_at TIMESTAMPTZ,
  
  -- Onboarding
  onboarding_completed_at TIMESTAMPTZ,
  welcome_email_sent_at TIMESTAMPTZ,
  certificate_issued_at TIMESTAMPTZ,
  
  -- Compliance
  license_verified BOOLEAN DEFAULT false,
  license_verified_at TIMESTAMPTZ,
  business_verified BOOLEAN DEFAULT false,
  business_verified_at TIMESTAMPTZ,
  
  -- Notes
  internal_notes TEXT,
  rejection_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_host_shop_applications_email ON host_shop_applications(contact_email);
CREATE INDEX IF NOT EXISTS idx_host_shop_applications_status ON host_shop_applications(status);
CREATE INDEX IF NOT EXISTS idx_host_shop_applications_stripe ON host_shop_applications(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_host_shop_applications_business ON host_shop_applications(business_name);

-- RLS Policies
ALTER TABLE host_shop_applications ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (for webhook)
CREATE POLICY "Service role can do everything"
  ON host_shop_applications FOR ALL
  USING (auth.role() = 'service_role');

-- Public can insert (from webhook)
CREATE POLICY "Public can insert host shop applications"
  ON host_shop_applications FOR INSERT
  WITH CHECK (true);

-- Admins can read all
CREATE POLICY "Admins can read host shop applications"
  ON host_shop_applications FOR SELECT
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

CREATE TRIGGER host_shop_applications_updated_at
  BEFORE UPDATE ON host_shop_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Audit log trigger
CREATE OR REPLACE FUNCTION log_host_shop_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    table_name,
    record_id,
    action,
    old_data,
    new_data,
    changed_by
  ) VALUES (
    'host_shop_applications',
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'INSERT'
      WHEN TG_OP = 'UPDATE' THEN 'UPDATE'
      WHEN TG_OP = 'DELETE' THEN 'DELETE'
    END,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END,
    auth.uid()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER host_shop_applications_audit
  AFTER INSERT OR UPDATE OR DELETE ON host_shop_applications
  FOR EACH ROW
  EXECUTE FUNCTION log_host_shop_changes();
