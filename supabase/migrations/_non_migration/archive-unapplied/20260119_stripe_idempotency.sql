-- SECTION 2: Stripe Event Idempotency Table
-- Prevents duplicate processing of webhook events

CREATE TABLE IF NOT EXISTS processed_stripe_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  payment_intent_id TEXT,
  event_type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_processed_stripe_events_event_id 
  ON processed_stripe_events(stripe_event_id);

CREATE INDEX IF NOT EXISTS idx_processed_stripe_events_payment_intent 
  ON processed_stripe_events(payment_intent_id);

-- SECTION 8: Provisioning Audit Log Table
CREATE TABLE IF NOT EXISTS provisioning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  payment_intent_id TEXT,
  correlation_id TEXT,
  step TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('started', 'completed', 'failed')),
  error TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provisioning_events_tenant 
  ON provisioning_events(tenant_id);

CREATE INDEX IF NOT EXISTS idx_provisioning_events_payment_intent 
  ON provisioning_events(payment_intent_id);

CREATE INDEX IF NOT EXISTS idx_provisioning_events_correlation 
  ON provisioning_events(correlation_id);

-- Comment for documentation
COMMENT ON TABLE processed_stripe_events IS 'Idempotency table to prevent duplicate webhook processing';
COMMENT ON TABLE provisioning_events IS 'Audit log for license provisioning steps';

-- SECTION 5: Row Level Security for tenant isolation

-- Enable RLS on tenants table
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Tenants: users can only see their own tenant
CREATE POLICY "Users can view own tenant" ON tenants
  FOR SELECT
  USING (id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

-- Enable RLS on licenses table
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

-- Licenses: users can only see licenses for their tenant
CREATE POLICY "Users can view own tenant licenses" ON licenses
  FOR SELECT
  USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

-- Enable RLS on license_purchases table
ALTER TABLE license_purchases ENABLE ROW LEVEL SECURITY;

-- License purchases: users can only see purchases for their tenant
CREATE POLICY "Users can view own tenant purchases" ON license_purchases
  FOR SELECT
  USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

-- Enable RLS on provisioning_events table
ALTER TABLE provisioning_events ENABLE ROW LEVEL SECURITY;

-- Provisioning events: users can only see events for their tenant
CREATE POLICY "Users can view own tenant provisioning events" ON provisioning_events
  FOR SELECT
  USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

-- Service role bypass for admin operations
-- Note: Service role key bypasses RLS by default in Supabase

-- SECTION 6: License violations table for enforcement logging
CREATE TABLE IF NOT EXISTS license_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  violation_type TEXT NOT NULL,
  feature TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_license_violations_tenant 
  ON license_violations(tenant_id);

CREATE INDEX IF NOT EXISTS idx_license_violations_type 
  ON license_violations(violation_type);

-- Enable RLS on license_violations
ALTER TABLE license_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tenant violations" ON license_violations
  FOR SELECT
  USING (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

-- SECTION 7: Job queue table for async processing
CREATE TABLE IF NOT EXISTS job_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_job_queue_status ON job_queue(status);
CREATE INDEX IF NOT EXISTS idx_job_queue_type ON job_queue(type);
CREATE INDEX IF NOT EXISTS idx_job_queue_created ON job_queue(created_at);
