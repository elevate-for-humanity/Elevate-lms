-- =============================================
-- ENTERPRISE LICENSING MIGRATION
-- Verified against codebase 2026-01-19
-- =============================================

-- 1. ADD STATUS TO EXISTING TENANTS TABLE
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. CREATE LICENSES TABLE
DROP TABLE IF EXISTS licenses CASCADE;
CREATE TABLE licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key TEXT NOT NULL,
  domain TEXT,
  customer_email TEXT NOT NULL,
  tenant_id UUID,
  tier TEXT DEFAULT 'basic',
  status TEXT DEFAULT 'active',
  max_users INTEGER DEFAULT 100,
  max_deployments INTEGER DEFAULT 1,
  features TEXT[],
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE LICENSE_PURCHASES TABLE
DROP TABLE IF EXISTS license_purchases CASCADE;
CREATE TABLE license_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  license_type TEXT NOT NULL,
  product_slug TEXT,
  stripe_payment_intent_id TEXT,
  stripe_checkout_session_id TEXT,
  tenant_id UUID,
  status TEXT DEFAULT 'pending',
  amount_cents INTEGER,
  currency TEXT DEFAULT 'usd',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE PROCESSED_STRIPE_EVENTS TABLE
DROP TABLE IF EXISTS processed_stripe_events CASCADE;
CREATE TABLE processed_stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  payment_intent_id TEXT,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

-- 5. CREATE PROVISIONING_EVENTS TABLE
DROP TABLE IF EXISTS provisioning_events CASCADE;
CREATE TABLE provisioning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  payment_intent_id TEXT,
  correlation_id TEXT,
  step TEXT NOT NULL,
  status TEXT NOT NULL,
  error TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CREATE LICENSE_VIOLATIONS TABLE
DROP TABLE IF EXISTS license_violations CASCADE;
CREATE TABLE license_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID,
  violation_type TEXT NOT NULL,
  feature TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CREATE JOB_QUEUE TABLE
DROP TABLE IF EXISTS job_queue CASCADE;
CREATE TABLE job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  payload JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- 8. CREATE INDEXES
CREATE INDEX idx_licenses_tenant_id ON licenses(tenant_id);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_license_purchases_stripe_payment_intent_id ON license_purchases(stripe_payment_intent_id);
CREATE INDEX idx_license_purchases_status ON license_purchases(status);
CREATE INDEX idx_processed_stripe_events_stripe_event_id ON processed_stripe_events(stripe_event_id);
CREATE INDEX idx_provisioning_events_tenant_id ON provisioning_events(tenant_id);
CREATE INDEX idx_provisioning_events_correlation_id ON provisioning_events(correlation_id);
CREATE INDEX idx_license_violations_tenant_id ON license_violations(tenant_id);
CREATE INDEX idx_job_queue_status ON job_queue(status);

-- 9. ENABLE RLS
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE provisioning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_violations ENABLE ROW LEVEL SECURITY;

-- 10. CREATE PERMISSIVE POLICIES (service role access)
CREATE POLICY "licenses_all" ON licenses FOR ALL USING (true);
CREATE POLICY "license_purchases_all" ON license_purchases FOR ALL USING (true);
CREATE POLICY "provisioning_events_all" ON provisioning_events FOR ALL USING (true);
CREATE POLICY "license_violations_all" ON license_violations FOR ALL USING (true);

-- DONE
SELECT 'SUCCESS' as result;
