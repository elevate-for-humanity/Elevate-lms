-- White-Label / Multi-Tenant Architecture
-- Enables licensing EFH to multiple schools/organizations

CREATE TABLE IF NOT EXISTS public.tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  primary_color text DEFAULT '#000000',
  secondary_color text DEFAULT '#ffffff',
  domain text,
  active boolean DEFAULT true,
  license_type text DEFAULT 'standard', -- standard | enterprise | custom
  license_expires_at timestamptz,
  settings jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add tenant_id to key tables
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

ALTER TABLE public.programs
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_active ON tenants(active);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant ON user_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_programs_tenant ON programs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_tenant ON enrollments(tenant_id);

-- RLS Policies
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Users can view their own tenant
CREATE POLICY "Users can view their tenant"
  ON tenants
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT tenant_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Admins can view all tenants
CREATE POLICY "Admins can view all tenants"
  ON tenants
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
      AND user_profiles.tenant_id IS NULL -- Super admin
    )
  );

-- Service role can manage tenants
CREATE POLICY "Service role can manage tenants"
  ON tenants
  FOR ALL
  TO service_role
  USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_tenants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_tenants_updated_at();

-- Seed default tenant (EFH Core)
INSERT INTO tenants (name, slug, active, license_type)
VALUES ('Elevate for Humanity', 'efh-core', true, 'enterprise')
ON CONFLICT (slug) DO NOTHING;

-- Comments
COMMENT ON TABLE tenants IS 'Multi-tenant white-label organizations';
COMMENT ON COLUMN tenants.slug IS 'URL-safe identifier for tenant';
COMMENT ON COLUMN tenants.license_type IS 'Type of license: standard, enterprise, custom';
COMMENT ON COLUMN tenants.settings IS 'Tenant-specific configuration and feature flags';
