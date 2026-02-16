-- Add tenant_licenses table for subscription management
-- This enables Stripe-based license enforcement for Sponsor-in-a-Box

-- Create tenant_licenses table
CREATE TABLE IF NOT EXISTS tenant_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan TEXT NOT NULL, -- 'starter', 'pro', 'enterprise'
  max_employers INTEGER NOT NULL,
  max_apprentices INTEGER NOT NULL,
  active BOOLEAN DEFAULT true,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenant_licenses_tenant ON tenant_licenses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_licenses_stripe_sub ON tenant_licenses(stripe_subscription_id);

-- Add RLS policies
ALTER TABLE tenant_licenses ENABLE ROW LEVEL SECURITY;

-- Tenants can view their own license
CREATE POLICY "Tenants can view own license"
  ON tenant_licenses FOR SELECT
  USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

-- Only service role can insert/update licenses (via Stripe webhooks)
CREATE POLICY "Service role can manage licenses"
  ON tenant_licenses FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_tenant_licenses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenant_licenses_updated_at
  BEFORE UPDATE ON tenant_licenses
  FOR EACH ROW
  EXECUTE FUNCTION update_tenant_licenses_updated_at();

-- Add license usage view for easy monitoring
CREATE OR REPLACE VIEW license_usage AS
SELECT
  tl.tenant_id,
  tl.plan,
  tl.max_employers,
  tl.max_apprentices,
  tl.active,
  COUNT(DISTINCT e.id) as current_employers,
  COUNT(DISTINCT a.id) as current_apprentices,
  ROUND((COUNT(DISTINCT e.id)::numeric / NULLIF(tl.max_employers, 0)) * 100, 1) as employer_usage_pct,
  ROUND((COUNT(DISTINCT a.id)::numeric / NULLIF(tl.max_apprentices, 0)) * 100, 1) as apprentice_usage_pct
FROM tenant_licenses tl
LEFT JOIN employers e ON e.tenant_id = tl.tenant_id
LEFT JOIN apprentices a ON a.tenant_id = tl.tenant_id
GROUP BY tl.tenant_id, tl.plan, tl.max_employers, tl.max_apprentices, tl.active;

-- Grant permissions on view
GRANT SELECT ON license_usage TO authenticated;

-- Add comment for documentation
COMMENT ON TABLE tenant_licenses IS 'Manages subscription-based license limits for tenants. Updated via Stripe webhooks.';
COMMENT ON VIEW license_usage IS 'Real-time view of license usage vs limits for monitoring and enforcement.';
