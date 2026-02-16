-- ============================================================================
-- Managed Licenses Table
-- Separate from the white-label `licenses` table (license keys for deployments).
-- This table tracks org-based trial and managed platform licenses.
-- Used by /api/trial/start-managed
-- ============================================================================

CREATE TABLE IF NOT EXISTS managed_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'trial'
    CHECK (status IN ('trial', 'active', 'past_due', 'canceled', 'suspended')),
  tier TEXT NOT NULL DEFAULT 'trial'
    CHECK (tier IN ('trial', 'managed-trial', 'starter', 'pro', 'enterprise')),
  plan_id TEXT NOT NULL,

  -- Trial tracking
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

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

ALTER TABLE managed_licenses ADD COLUMN IF NOT EXISTS organization_id TEXT;
CREATE INDEX IF NOT EXISTS idx_managed_licenses_org ON managed_licenses(organization_id);
ALTER TABLE managed_licenses ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_managed_licenses_status ON managed_licenses(status);
ALTER TABLE managed_licenses ADD COLUMN IF NOT EXISTS expires_at TEXT;
CREATE INDEX IF NOT EXISTS idx_managed_licenses_expires ON managed_licenses(expires_at);

-- RLS
ALTER TABLE managed_licenses ENABLE ROW LEVEL SECURITY;

-- Service role full access (used by trial API with SUPABASE_SERVICE_ROLE_KEY)
DROP POLICY IF EXISTS "Service role manages managed_licenses" ON managed_licenses;
CREATE POLICY "Service role manages managed_licenses"
  ON managed_licenses FOR ALL
  USING (auth.role() = 'service_role');

-- Admins can view all managed licenses
DROP POLICY IF EXISTS "Admins view managed licenses" ON managed_licenses;
CREATE POLICY "Admins view managed licenses"
  ON managed_licenses FOR SELECT
  USING (public.is_admin());

-- Add organization_id to license_events (trial API inserts it)
ALTER TABLE license_events
  ADD COLUMN IF NOT EXISTS organization_id UUID;

ALTER TABLE license_events ADD COLUMN IF NOT EXISTS organization_id TEXT;
CREATE INDEX IF NOT EXISTS idx_license_events_org ON license_events(organization_id);
