-- Tenant Domains Table
-- Supports custom domains and subdomains for tenant resolution

CREATE TABLE IF NOT EXISTS public.tenant_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  domain text NOT NULL UNIQUE,
  is_primary boolean DEFAULT false,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tenant_domains_tenant ON tenant_domains(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_domain ON tenant_domains(domain);
CREATE INDEX IF NOT EXISTS idx_tenant_domains_primary ON tenant_domains(tenant_id, is_primary) WHERE is_primary = true;

-- Only one primary domain per tenant
CREATE UNIQUE INDEX IF NOT EXISTS idx_tenant_domains_one_primary 
  ON tenant_domains(tenant_id) 
  WHERE is_primary = true;

-- RLS
ALTER TABLE tenant_domains ENABLE ROW LEVEL SECURITY;

-- Users can view domains for their tenant
CREATE POLICY "Users can view their tenant domains"
  ON tenant_domains
  FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Service role can manage domains
CREATE POLICY "Service role can manage domains"
  ON tenant_domains
  FOR ALL
  TO service_role
  USING (true);

-- Comments
COMMENT ON TABLE tenant_domains IS 'Custom domains and subdomains for tenant resolution';
COMMENT ON COLUMN tenant_domains.domain IS 'Full domain (e.g., workforce.indiana.gov or indiana-wdb.platform.com)';
COMMENT ON COLUMN tenant_domains.is_primary IS 'Primary domain shown in emails and links';
COMMENT ON COLUMN tenant_domains.verified IS 'Domain ownership verified via DNS';
