-- Demo Tenant
-- Creates a demo tenant with sanitized data for testing and demonstrations

-- Create demo tenant
INSERT INTO tenants (name, slug, active, license_type, created_at, updated_at)
VALUES ('Demo Organization', 'demo', true, 'trial', NOW(), NOW())
ON CONFLICT (slug) DO NOTHING;

-- Add demo branding
INSERT INTO tenant_branding (
  tenant_id,
  brand_name,
  primary_color,
  secondary_color,
  support_email,
  support_phone,
  meta_title,
  meta_description,
  footer_text
)
SELECT 
  id,
  'Demo Organization',
  '#3b82f6', -- blue-500
  '#1e293b', -- slate-800
  'demo@example.com',
  '555-0100',
  'Demo Organization - Workforce Training',
  'Demo tenant for testing and demonstrations',
  'This is a demo tenant with sample data'
FROM tenants
WHERE slug = 'demo'
ON CONFLICT (tenant_id) DO NOTHING;

-- Add demo domain
INSERT INTO tenant_domains (tenant_id, domain, is_primary, verified)
SELECT 
  id,
  'demo.localhost',
  true,
  true
FROM tenants
WHERE slug = 'demo'
ON CONFLICT (domain) DO NOTHING;

COMMENT ON TABLE tenants IS 'Demo tenant created for testing - all data is sanitized';
