-- Program Holder Licensing System
-- Creates tables for MOU-based licensing with application/approval workflow

-- Program holder applications
CREATE TABLE IF NOT EXISTS program_holder_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Organization Info
  organization_name TEXT NOT NULL,
  legal_name TEXT NOT NULL,
  tax_id TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Indiana',
  zip TEXT NOT NULL,
  website TEXT,
  
  -- Contact Info
  contact_name TEXT NOT NULL,
  contact_title TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  
  -- Programs
  programs_offered TEXT NOT NULL,
  students_per_year TEXT NOT NULL,
  wioa_experience TEXT NOT NULL,
  compliance_history TEXT NOT NULL,
  
  -- References
  reference1_name TEXT NOT NULL,
  reference1_organization TEXT NOT NULL,
  reference1_email TEXT NOT NULL,
  reference1_phone TEXT NOT NULL,
  reference2_name TEXT NOT NULL,
  reference2_organization TEXT NOT NULL,
  reference2_email TEXT NOT NULL,
  reference2_phone TEXT NOT NULL,
  
  -- Why Join
  why_join TEXT NOT NULL,
  goals TEXT NOT NULL,
  
  -- Tier Selection
  tier TEXT NOT NULL CHECK (tier IN ('small', 'medium', 'large', 'enterprise')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  
  -- Review
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  rejection_reason TEXT,
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Program holder licenses (after approval)
CREATE TABLE IF NOT EXISTS program_holder_licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES program_holder_applications(id),
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  
  -- License Details
  tier TEXT NOT NULL CHECK (tier IN ('small', 'medium', 'large', 'enterprise')),
  monthly_price INTEGER NOT NULL,
  setup_fee INTEGER NOT NULL,
  max_students INTEGER NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'awaiting_mou' CHECK (status IN (
    'awaiting_mou',
    'mou_signed',
    'awaiting_payment',
    'active',
    'suspended',
    'cancelled'
  )),
  
  -- MOU
  mou_generated_at TIMESTAMPTZ,
  mou_signed_at TIMESTAMPTZ,
  mou_document_url TEXT,
  mou_signed_by TEXT,
  
  -- Payment
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  first_payment_at TIMESTAMPTZ,
  last_payment_at TIMESTAMPTZ,
  
  -- Dates
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- License usage tracking
CREATE TABLE IF NOT EXISTS program_holder_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_id UUID NOT NULL REFERENCES program_holder_licenses(id),
  
  -- Current Usage
  active_students INTEGER NOT NULL DEFAULT 0,
  total_programs INTEGER NOT NULL DEFAULT 0,
  storage_used_gb DECIMAL NOT NULL DEFAULT 0,
  
  -- Recorded At
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- License events (audit log)
CREATE TABLE IF NOT EXISTS program_holder_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_id UUID REFERENCES program_holder_licenses(id),
  application_id UUID REFERENCES program_holder_applications(id),
  
  event_type TEXT NOT NULL,
  event_data JSONB,
  performed_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_applications_status ON program_holder_applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created ON program_holder_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_email ON program_holder_applications(contact_email);

CREATE INDEX IF NOT EXISTS idx_licenses_status ON program_holder_licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_user ON program_holder_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_licenses_org ON program_holder_licenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_licenses_stripe_customer ON program_holder_licenses(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_usage_license ON program_holder_usage(license_id);
CREATE INDEX IF NOT EXISTS idx_usage_recorded ON program_holder_usage(recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_events_license ON program_holder_events(license_id);
CREATE INDEX IF NOT EXISTS idx_events_application ON program_holder_events(application_id);
CREATE INDEX IF NOT EXISTS idx_events_created ON program_holder_events(created_at DESC);

-- RLS Policies
ALTER TABLE program_holder_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_holder_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_holder_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_holder_events ENABLE ROW LEVEL SECURITY;

-- Applications: Applicants can view their own, admins can view all
CREATE POLICY "Applicants can view own applications"
  ON program_holder_applications FOR SELECT
  USING (contact_email = auth.jwt() ->> 'email');

CREATE POLICY "Admins can view all applications"
  ON program_holder_applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Licenses: License holders can view their own, admins can view all
CREATE POLICY "License holders can view own license"
  ON program_holder_licenses FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage all licenses"
  ON program_holder_licenses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Usage: License holders can view their own, admins can view all
CREATE POLICY "License holders can view own usage"
  ON program_holder_usage FOR SELECT
  USING (
    license_id IN (
      SELECT id FROM program_holder_licenses
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all usage"
  ON program_holder_usage FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Events: License holders can view their own, admins can view all
CREATE POLICY "License holders can view own events"
  ON program_holder_events FOR SELECT
  USING (
    license_id IN (
      SELECT id FROM program_holder_licenses
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all events"
  ON program_holder_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Functions
CREATE OR REPLACE FUNCTION update_program_holder_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON program_holder_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_program_holder_updated_at();

CREATE TRIGGER update_licenses_updated_at
  BEFORE UPDATE ON program_holder_licenses
  FOR EACH ROW
  EXECUTE FUNCTION update_program_holder_updated_at();

-- Comments
COMMENT ON TABLE program_holder_applications IS 'Applications to join program holder network via MOU';
COMMENT ON TABLE program_holder_licenses IS 'Active program holder licenses after approval';
COMMENT ON TABLE program_holder_usage IS 'Usage tracking for program holder licenses';
COMMENT ON TABLE program_holder_events IS 'Audit log for program holder activities';
