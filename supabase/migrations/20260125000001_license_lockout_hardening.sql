-- License Lockout Hardening Migration
-- Adds columns and functions for total lockout on non-payment

-- Add missing columns to licenses table
ALTER TABLE licenses 
ADD COLUMN IF NOT EXISTS tenant_id UUID,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS paid_through TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_reason TEXT,
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'standard';

-- Create index for tenant lookups
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS tenant_id TEXT;
CREATE INDEX IF NOT EXISTS idx_licenses_tenant_id ON licenses(tenant_id);
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
CREATE INDEX IF NOT EXISTS idx_licenses_stripe_subscription_id ON licenses(stripe_subscription_id);
ALTER TABLE licenses ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
CREATE INDEX IF NOT EXISTS idx_licenses_stripe_customer_id ON licenses(stripe_customer_id);

-- Stripe webhook events table for idempotency
CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT DEFAULT 'processing',
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stripe_webhook_events ADD COLUMN IF NOT EXISTS stripe_event_id TEXT;
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_stripe_event_id ON stripe_webhook_events(stripe_event_id);

-- Function: Get active license for tenant
CREATE OR REPLACE FUNCTION get_active_license(p_tenant_id UUID)
RETURNS TABLE (
  id UUID,
  tenant_id UUID,
  status TEXT,
  plan_type TEXT,
  expires_at TIMESTAMPTZ,
  paid_through TIMESTAMPTZ,
  features JSONB,
  max_users INTEGER
) AS $$
BEGIN
  -- Auto-expire licenses past their expiry date
  UPDATE licenses l
  SET status = 'expired', updated_at = NOW()
  WHERE l.tenant_id = p_tenant_id
    AND l.status = 'active'
    AND l.expires_at < NOW();

  -- Return active license if exists
  RETURN QUERY
  SELECT 
    l.id,
    l.tenant_id,
    l.status,
    l.plan_type,
    l.expires_at,
    l.paid_through,
    l.features,
    l.max_users
  FROM licenses l
  WHERE l.tenant_id = p_tenant_id
    AND l.status = 'active'
  ORDER BY l.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Check if license is active (boolean)
CREATE OR REPLACE FUNCTION is_license_active(p_tenant_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM get_active_license(p_tenant_id);
  
  RETURN v_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Suspend license
CREATE OR REPLACE FUNCTION suspend_license(
  p_tenant_id UUID,
  p_reason TEXT DEFAULT 'payment_failed'
)
RETURNS VOID AS $$
BEGIN
  UPDATE licenses
  SET 
    status = 'suspended',
    suspended_at = NOW(),
    suspended_reason = p_reason,
    updated_at = NOW()
  WHERE tenant_id = p_tenant_id
    AND status IN ('active', 'trial');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Activate license (after payment)
CREATE OR REPLACE FUNCTION activate_license(
  p_tenant_id UUID,
  p_paid_through TIMESTAMPTZ
)
RETURNS VOID AS $$
BEGIN
  UPDATE licenses
  SET 
    status = 'active',
    suspended_at = NULL,
    suspended_reason = NULL,
    paid_through = p_paid_through,
    updated_at = NOW()
  WHERE tenant_id = p_tenant_id
    AND status IN ('suspended', 'trial', 'past_due');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Expire license
CREATE OR REPLACE FUNCTION expire_license(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE licenses
  SET 
    status = 'expired',
    updated_at = NOW()
  WHERE tenant_id = p_tenant_id
    AND status != 'expired';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_active_license(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_license_active(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION suspend_license(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION activate_license(UUID, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION expire_license(UUID) TO service_role;
