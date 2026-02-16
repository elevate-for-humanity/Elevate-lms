-- License Checkout Tables
-- Supports Stripe checkout flow for platform licensing

-- License leads (before purchase)
CREATE TABLE IF NOT EXISTS license_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL,
  organization_name TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'pro', 'enterprise')),
  source TEXT NOT NULL DEFAULT 'website' CHECK (source IN ('website', 'demo', 'contact', 'referral')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_license_leads_email ON license_leads(email);
CREATE INDEX IF NOT EXISTS idx_license_leads_plan ON license_leads(plan);
CREATE INDEX IF NOT EXISTS idx_license_leads_created ON license_leads(created_at);

-- Organizations (customers)
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT DEFAULT 'Indiana',
  zip TEXT,
  stripe_customer_id TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_email ON organizations(email);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe ON organizations(stripe_customer_id);

-- Licenses (active subscriptions)
CREATE TABLE IF NOT EXISTS licenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('starter', 'pro', 'enterprise')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_licenses_org ON licenses(organization_id);
CREATE INDEX IF NOT EXISTS idx_licenses_status ON licenses(status);
CREATE INDEX IF NOT EXISTS idx_licenses_stripe_sub ON licenses(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_licenses_stripe_cust ON licenses(stripe_customer_id);

-- License invoices (for setup fees and one-time charges)
CREATE TABLE IF NOT EXISTS license_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_id UUID REFERENCES licenses(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE,
  amount_due INTEGER NOT NULL, -- in cents
  amount_paid INTEGER DEFAULT 0, -- in cents
  status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
  description TEXT,
  invoice_pdf TEXT, -- URL to PDF
  hosted_invoice_url TEXT, -- Stripe hosted page
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_license ON license_invoices(license_id);
CREATE INDEX IF NOT EXISTS idx_invoices_org ON license_invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON license_invoices(status);

-- RLS Policies
ALTER TABLE license_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_invoices ENABLE ROW LEVEL SECURITY;

-- Admins can view all
CREATE POLICY "Admins can view all license leads"
  ON license_leads FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all organizations"
  ON organizations FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all licenses"
  ON licenses FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all invoices"
  ON license_invoices FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Service role can do everything (for webhooks)
CREATE POLICY "Service role full access leads"
  ON license_leads FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access orgs"
  ON organizations FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access licenses"
  ON licenses FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access invoices"
  ON license_invoices FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Organizations can view their own data
CREATE POLICY "Organizations can view own data"
  ON organizations FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM organization_users WHERE organization_id = id
  ));

CREATE POLICY "Organizations can view own licenses"
  ON licenses FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
  ));

CREATE POLICY "Organizations can view own invoices"
  ON license_invoices FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
  ));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_licenses_updated_at
  BEFORE UPDATE ON licenses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE license_leads IS 'Tracks interest in platform licensing before purchase';
COMMENT ON TABLE organizations IS 'Customer organizations that license the platform';
COMMENT ON TABLE licenses IS 'Active platform licenses (subscriptions)';
COMMENT ON TABLE license_invoices IS 'Invoices for setup fees and one-time charges';
