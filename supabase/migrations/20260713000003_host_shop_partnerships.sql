-- Host Shop Partnerships Table
-- Stores approved host shop partnerships with subscription tiers

CREATE TABLE IF NOT EXISTS host_shop_partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Application Reference
  application_id UUID REFERENCES host_shop_applications(id) ON DELETE SET NULL,
  
  -- Business Information
  business_name VARCHAR(255) NOT NULL,
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
  website VARCHAR(255),
  
  -- Contact Information
  contact_name VARCHAR(255) NOT NULL,
  contact_email VARCHAR(255) NOT NULL,
  contact_phone VARCHAR(50),
  
  -- Partnership Status
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN (
    'active',
    'suspended',
    'expired',
    'cancelled',
    'pending'
  )),
  
  -- Partner Tier
  partner_tier VARCHAR(50) DEFAULT 'free' CHECK (partner_tier IN (
    'free',
    'bronze',
    'silver',
    'gold',
    'platinum'
  )),
  
  -- Subscription Info
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  subscription_status VARCHAR(50),
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  
  -- Partner Benefits
  certificate_issued BOOLEAN DEFAULT false,
  certificate_issued_at TIMESTAMPTZ,
  badge_enabled BOOLEAN DEFAULT false,
  badge_enabled_at TIMESTAMPTZ,
  directory_listing BOOLEAN DEFAULT false,
  directory_listing_at TIMESTAMPTZ,
  portal_access_enabled BOOLEAN DEFAULT false,
  portal_access_at TIMESTAMPTZ,
  
  -- Welcome Kit
  welcome_email_sent BOOLEAN DEFAULT false,
  welcome_email_sent_at TIMESTAMPTZ,
  welcome_kit_sent BOOLEAN DEFAULT false,
  welcome_kit_sent_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_completed_at TIMESTAMPTZ,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Compliance
  license_verified BOOLEAN DEFAULT false,
  license_verified_at TIMESTAMPTZ,
  business_verified BOOLEAN DEFAULT false,
  business_verified_at TIMESTAMPTZ,
  
  -- Notes
  internal_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_host_shop_partnerships_email ON host_shop_partnerships(contact_email);
CREATE INDEX IF NOT EXISTS idx_host_shop_partnerships_status ON host_shop_partnerships(status);
CREATE INDEX IF NOT EXISTS idx_host_shop_partnerships_tier ON host_shop_partnerships(partner_tier);
CREATE INDEX IF NOT EXISTS idx_host_shop_partnerships_stripe ON host_shop_partnerships(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_host_shop_partnerships_stripe_sub ON host_shop_partnerships(stripe_subscription_id);

-- RLS Policies
ALTER TABLE host_shop_partnerships ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role can do everything"
  ON host_shop_partnerships FOR ALL
  USING (auth.role() = 'service_role');

-- Public can view approved partners (directory)
CREATE POLICY "Public can view active partners"
  ON host_shop_partnerships FOR SELECT
  USING (
    status = 'active' 
    AND directory_listing = true
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER host_shop_partnerships_updated_at
  BEFORE UPDATE ON host_shop_partnerships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Audit log trigger
CREATE OR REPLACE FUNCTION log_host_shop_partnership_changes()
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
    'host_shop_partnerships',
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

CREATE TRIGGER host_shop_partnerships_audit
  AFTER INSERT OR UPDATE OR DELETE ON host_shop_partnerships
  FOR EACH ROW
  EXECUTE FUNCTION log_host_shop_partnership_changes();
