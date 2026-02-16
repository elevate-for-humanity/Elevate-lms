-- License Management Tables
-- Run this migration to set up license tracking

-- Organizations table (licensees)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('workforce_board', 'nonprofit', 'training_provider', 'apprenticeship_sponsor', 'government', 'other')),
  domain TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Licenses table
CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'past_due', 'canceled', 'suspended')),
  plan_id TEXT NOT NULL,
  
  -- Trial tracking
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  
  -- Stripe integration
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  
  -- Billing period
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  
  -- Payment tracking
  last_payment_status TEXT,
  last_invoice_url TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  canceled_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  
  UNIQUE(organization_id)
);

-- License usage tracking
CREATE TABLE IF NOT EXISTS license_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES licenses(id) ON DELETE CASCADE,
  
  -- Current counts
  student_count INTEGER DEFAULT 0,
  admin_count INTEGER DEFAULT 0,
  program_count INTEGER DEFAULT 0,
  
  -- Limits from plan
  student_limit INTEGER,
  admin_limit INTEGER,
  program_limit INTEGER,
  
  -- Tracking
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(license_id)
);

-- Trial signups (before organization is created)
CREATE TABLE IF NOT EXISTS trial_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  organization_type TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_phone TEXT,
  plan_id TEXT NOT NULL,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'converted', 'expired')),
  converted_at TIMESTAMPTZ,
  organization_id UUID REFERENCES organizations(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

-- License events log
CREATE TABLE IF NOT EXISTS license_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID REFERENCES licenses(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  
  -- Stripe webhook data
  stripe_event_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_licenses_organization ON licenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_stripe_customer ON licenses(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_licenses_stripe_subscription ON licenses(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_license_usage_license ON license_usage(license_id);
CREATE INDEX IF NOT EXISTS idx_trial_signups_email ON trial_signups(email);
CREATE INDEX IF NOT EXISTS idx_trial_signups_status ON trial_signups(status);
CREATE INDEX IF NOT EXISTS idx_license_events_license ON license_events(license_id);
CREATE INDEX IF NOT EXISTS idx_license_events_type ON license_events(event_type);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
DROP TRIGGER IF EXISTS organizations_updated_at ON organizations;
CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS licenses_updated_at ON licenses;
CREATE TRIGGER licenses_updated_at
  BEFORE UPDATE ON licenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS license_usage_updated_at ON license_usage;
CREATE TRIGGER license_usage_updated_at
  BEFORE UPDATE ON license_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_events ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access on organizations" ON organizations
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on licenses" ON licenses
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on license_usage" ON license_usage
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on trial_signups" ON trial_signups
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on license_events" ON license_events
  FOR ALL USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE organizations IS 'Organizations that license the LMS platform';
COMMENT ON TABLE licenses IS 'License records for organizations';
COMMENT ON TABLE license_usage IS 'Current usage counts against license limits';
COMMENT ON TABLE trial_signups IS 'Trial signup requests before conversion';
COMMENT ON TABLE license_events IS 'Audit log of license-related events';
