-- Licenses Table
-- Tracks license state and feature access for each tenant

CREATE TABLE IF NOT EXISTS licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('trial', 'starter', 'professional', 'enterprise', 'custom')),
  status text NOT NULL DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'suspended', 'cancelled')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  max_students integer,
  max_staff integer,
  max_programs integer,
  features jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_licenses_tenant ON licenses(tenant_id);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_licenses_ends_at ON licenses(ends_at);

-- RLS
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant license"
  ON licenses FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can update their tenant license"
  ON licenses FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Service role can manage all licenses"
  ON licenses FOR ALL
  TO service_role
  USING (true);

-- Insert default license for efh-core tenant
INSERT INTO licenses (
  tenant_id,
  plan,
  status,
  starts_at,
  max_students,
  max_staff,
  max_programs,
  features
)
SELECT 
  id,
  'enterprise',
  'active',
  NOW(),
  NULL, -- unlimited
  NULL, -- unlimited
  NULL, -- unlimited
  '{"advanced_analytics": true, "custom_branding": true, "api_access": true, "sso": true}'::jsonb
FROM tenants
WHERE slug = 'efh-core'
ON CONFLICT (tenant_id) DO NOTHING;

-- Insert trial license for demo tenant
INSERT INTO licenses (
  tenant_id,
  plan,
  status,
  starts_at,
  ends_at,
  max_students,
  max_staff,
  max_programs,
  features
)
SELECT 
  id,
  'trial',
  'active',
  NOW(),
  NOW() + INTERVAL '30 days',
  100,
  5,
  10,
  '{"advanced_analytics": false, "custom_branding": true, "api_access": false, "sso": false}'::jsonb
FROM tenants
WHERE slug = 'demo'
ON CONFLICT (tenant_id) DO NOTHING;

-- Function to check if license is active
CREATE OR REPLACE FUNCTION is_license_active(p_tenant_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_status text;
  v_ends_at timestamptz;
BEGIN
  SELECT status, ends_at INTO v_status, v_ends_at
  FROM licenses
  WHERE tenant_id = p_tenant_id;
  
  IF v_status = 'active' THEN
    IF v_ends_at IS NULL OR v_ends_at > NOW() THEN
      RETURN true;
    END IF;
  END IF;
  
  RETURN false;
END;
$$;

-- Function to check feature access
CREATE OR REPLACE FUNCTION has_feature_access(p_tenant_id uuid, p_feature text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_features jsonb;
BEGIN
  SELECT features INTO v_features
  FROM licenses
  WHERE tenant_id = p_tenant_id;
  
  RETURN COALESCE((v_features->>p_feature)::boolean, false);
END;
$$;

COMMENT ON TABLE licenses IS 'License state and feature access for each tenant';
COMMENT ON FUNCTION is_license_active IS 'Check if tenant license is currently active';
COMMENT ON FUNCTION has_feature_access IS 'Check if tenant has access to specific feature';
