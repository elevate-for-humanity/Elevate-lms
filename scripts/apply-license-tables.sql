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
-- STEP 5: License Enforcement & Suspension
-- Ensures licenses control access and revenue

-- ============================================
-- A: STANDARDIZE LICENSE STATUS
-- ============================================

-- Add 'revoked' status if not present
ALTER TABLE licenses 
  DROP CONSTRAINT IF EXISTS licenses_status_check;

ALTER TABLE licenses 
  ADD CONSTRAINT licenses_status_check 
  CHECK (status IN ('active', 'suspended', 'expired', 'revoked'));

-- Add composite index for tenant + status lookups
CREATE INDEX IF NOT EXISTS idx_licenses_tenant_status 
  ON licenses(tenant_id, status);

-- Add suspended_at and suspended_reason for audit trail
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS suspended_reason TEXT;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS revoked_reason TEXT;

-- ============================================
-- D: EXPIRY HANDLING FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION check_and_expire_license(p_license_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_license licenses;
  v_expired BOOLEAN := false;
BEGIN
  SELECT * INTO v_license FROM licenses WHERE id = p_license_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Check if license should be expired
  IF v_license.status = 'active' 
     AND v_license.expires_at IS NOT NULL 
     AND v_license.expires_at < NOW() THEN
    
    UPDATE licenses 
    SET status = 'expired', updated_at = NOW()
    WHERE id = p_license_id;
    
    -- Log the expiry event
    INSERT INTO provisioning_events (
      correlation_id,
      tenant_id,
      step,
      status,
      metadata
    ) VALUES (
      'auto-expire-' || p_license_id::TEXT,
      v_license.tenant_id,
      'license_expired',
      'completed',
      jsonb_build_object(
        'license_id', p_license_id,
        'expired_at', NOW(),
        'original_expiry', v_license.expires_at
      )
    );
    
    v_expired := true;
  END IF;
  
  RETURN v_expired;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================
-- FUNCTION: Get active license for tenant
-- ============================================

CREATE OR REPLACE FUNCTION get_active_license(p_tenant_id UUID)
RETURNS licenses AS $$
DECLARE
  v_license licenses;
BEGIN
  -- First check and expire if needed
  SELECT * INTO v_license 
  FROM licenses 
  WHERE tenant_id = p_tenant_id 
  ORDER BY created_at DESC 
  LIMIT 1;
  
  IF FOUND AND v_license.status = 'active' THEN
    -- Check expiry
    PERFORM check_and_expire_license(v_license.id);
    
    -- Re-fetch after potential expiry
    SELECT * INTO v_license 
    FROM licenses 
    WHERE id = v_license.id;
  END IF;
  
  RETURN v_license;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================
-- FUNCTION: Suspend license (for refunds/disputes)
-- ============================================

CREATE OR REPLACE FUNCTION suspend_license(
  p_license_id UUID,
  p_reason TEXT,
  p_admin_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_license licenses;
BEGIN
  SELECT * INTO v_license FROM licenses WHERE id = p_license_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  UPDATE licenses 
  SET 
    status = 'suspended',
    suspended_at = NOW(),
    suspended_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_license_id;
  
  -- Log the suspension
  INSERT INTO provisioning_events (
    correlation_id,
    tenant_id,
    step,
    status,
    metadata
  ) VALUES (
    'suspend-' || p_license_id::TEXT || '-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    v_license.tenant_id,
    'license_suspended',
    'completed',
    jsonb_build_object(
      'license_id', p_license_id,
      'reason', p_reason,
      'admin_user_id', p_admin_user_id,
      'previous_status', v_license.status
    )
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================
-- FUNCTION: Reactivate license
-- ============================================

CREATE OR REPLACE FUNCTION reactivate_license(
  p_license_id UUID,
  p_admin_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_license licenses;
BEGIN
  SELECT * INTO v_license FROM licenses WHERE id = p_license_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Only reactivate if suspended (not revoked or expired)
  IF v_license.status != 'suspended' THEN
    RETURN false;
  END IF;
  
  UPDATE licenses 
  SET 
    status = 'active',
    suspended_at = NULL,
    suspended_reason = NULL,
    updated_at = NOW()
  WHERE id = p_license_id;
  
  -- Log the reactivation
  INSERT INTO provisioning_events (
    correlation_id,
    tenant_id,
    step,
    status,
    metadata
  ) VALUES (
    'reactivate-' || p_license_id::TEXT || '-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    v_license.tenant_id,
    'license_reactivated',
    'completed',
    jsonb_build_object(
      'license_id', p_license_id,
      'admin_user_id', p_admin_user_id,
      'previous_status', v_license.status
    )
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- ============================================
-- FUNCTION: Revoke license (admin action)
-- ============================================

CREATE OR REPLACE FUNCTION revoke_license(
  p_license_id UUID,
  p_reason TEXT,
  p_admin_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_license licenses;
BEGIN
  SELECT * INTO v_license FROM licenses WHERE id = p_license_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  UPDATE licenses 
  SET 
    status = 'revoked',
    revoked_at = NOW(),
    revoked_reason = p_reason,
    updated_at = NOW()
  WHERE id = p_license_id;
  
  -- Log the revocation
  INSERT INTO provisioning_events (
    correlation_id,
    tenant_id,
    step,
    status,
    metadata
  ) VALUES (
    'revoke-' || p_license_id::TEXT || '-' || EXTRACT(EPOCH FROM NOW())::TEXT,
    v_license.tenant_id,
    'license_revoked',
    'completed',
    jsonb_build_object(
      'license_id', p_license_id,
      'reason', p_reason,
      'admin_user_id', p_admin_user_id,
      'previous_status', v_license.status
    )
  );
  
  -- Also log to admin audit
  INSERT INTO admin_audit_events (
    admin_user_id,
    target_tenant_id,
    action,
    table_accessed,
    reason
  ) VALUES (
    p_admin_user_id,
    v_license.tenant_id,
    'revoke_license',
    'licenses',
    p_reason
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

COMMENT ON FUNCTION check_and_expire_license IS 'Auto-expires license if past expiry date';
COMMENT ON FUNCTION get_active_license IS 'Returns active license for tenant, checking expiry';
COMMENT ON FUNCTION suspend_license IS 'Suspends license (refund/dispute)';
COMMENT ON FUNCTION reactivate_license IS 'Reactivates suspended license';
COMMENT ON FUNCTION revoke_license IS 'Permanently revokes license (admin action)';

-- ============================================
-- D: BATCH EXPIRY FUNCTION (for cron)
-- ============================================

CREATE OR REPLACE FUNCTION expire_all_overdue_licenses()
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER := 0;
  v_license RECORD;
BEGIN
  FOR v_license IN 
    SELECT id, tenant_id 
    FROM licenses 
    WHERE status = 'active' 
    AND expires_at IS NOT NULL 
    AND expires_at < NOW()
  LOOP
    PERFORM check_and_expire_license(v_license.id);
    v_count := v_count + 1;
  END LOOP;
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

COMMENT ON FUNCTION expire_all_overdue_licenses IS 'Batch expire all overdue licenses - call from daily cron';

-- ============================================
-- E: SUSPEND BY STRIPE SUBSCRIPTION ID
-- ============================================

CREATE OR REPLACE FUNCTION suspend_license_by_stripe_id(
  p_stripe_subscription_id TEXT,
  p_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_license licenses;
BEGIN
  SELECT * INTO v_license 
  FROM licenses 
  WHERE stripe_subscription_id = p_stripe_subscription_id;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  RETURN suspend_license(v_license.id, p_reason, NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public;

-- Add stripe_customer_id column if missing
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
CREATE INDEX IF NOT EXISTS idx_licenses_stripe_customer ON licenses(stripe_customer_id);

COMMENT ON FUNCTION suspend_license_by_stripe_id IS 'Suspend license by Stripe subscription ID';
