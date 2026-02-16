-- Tenant Branding Table
-- Stores white-label branding for each tenant

CREATE TABLE IF NOT EXISTS tenant_branding (
  tenant_id uuid PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  brand_name text,
  logo_url text,
  logo_dark_url text,
  favicon_url text,
  primary_color text DEFAULT '#000000',
  secondary_color text DEFAULT '#ffffff',
  accent_color text,
  support_email text,
  support_phone text,
  footer_text text,
  meta_title text,
  meta_description text,
  og_image_url text,
  custom_css text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE tenant_branding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant branding"
  ON tenant_branding FOR SELECT
  TO authenticated, anon
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
    OR auth.uid() IS NULL -- Allow anon for public pages
  );

CREATE POLICY "Admins can update their tenant branding"
  ON tenant_branding FOR UPDATE
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Service role can manage all branding"
  ON tenant_branding FOR ALL
  TO service_role
  USING (true);

-- Insert default branding for efh-core tenant
INSERT INTO tenant_branding (
  tenant_id,
  brand_name,
  primary_color,
  secondary_color,
  support_email,
  support_phone,
  meta_title,
  meta_description
)
SELECT 
  id,
  'Elevate for Humanity',
  '#f97316', -- orange-600
  '#1e293b', -- slate-800
  'info@elevateforhumanity.org',
  '317-314-3757',
  'Elevate for Humanity - Workforce Development',
  'Empowering individuals through workforce training and career development programs'
FROM tenants
WHERE slug = 'efh-core'
ON CONFLICT (tenant_id) DO NOTHING;

COMMENT ON TABLE tenant_branding IS 'White-label branding configuration for each tenant';
