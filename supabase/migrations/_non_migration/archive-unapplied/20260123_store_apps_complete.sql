-- Store Apps - Complete Database Setup
-- Creates tables for SAM.gov, Grants, and Website Builder apps

-- =====================================================
-- USER APP SUBSCRIPTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS user_app_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_slug VARCHAR(100) NOT NULL,
  plan VARCHAR(50) NOT NULL DEFAULT 'starter',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  stripe_subscription_id VARCHAR(255),
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, app_slug)
);

-- =====================================================
-- SAM.GOV APP TABLES
-- =====================================================

-- Entity registrations
CREATE TABLE IF NOT EXISTS sam_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_name VARCHAR(255) NOT NULL,
  dba_name VARCHAR(255),
  uei VARCHAR(12),
  cage_code VARCHAR(5),
  ein VARCHAR(10),
  physical_address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip VARCHAR(10),
  country VARCHAR(100) DEFAULT 'United States',
  congressional_district VARCHAR(10),
  entity_type VARCHAR(100),
  organization_structure VARCHAR(100),
  state_of_incorporation VARCHAR(2),
  business_start_date DATE,
  fiscal_year_end VARCHAR(10),
  registration_status VARCHAR(50) DEFAULT 'draft',
  current_step INTEGER DEFAULT 1,
  sam_expiration_date DATE,
  naics_codes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SAM registration documents
CREATE TABLE IF NOT EXISTS sam_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES sam_entities(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  verified BOOLEAN DEFAULT false
);

-- SAM compliance alerts
CREATE TABLE IF NOT EXISTS sam_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES sam_entities(id) ON DELETE CASCADE,
  alert_type VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  due_date DATE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- GRANTS APP TABLES
-- =====================================================

-- Grant opportunities (cached from grants.gov)
CREATE TABLE IF NOT EXISTS grant_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grants_gov_id VARCHAR(100) UNIQUE,
  title TEXT NOT NULL,
  agency VARCHAR(255),
  description TEXT,
  amount_min DECIMAL(15,2),
  amount_max DECIMAL(15,2),
  deadline DATE,
  category VARCHAR(100),
  eligibility TEXT,
  cfda_number VARCHAR(20),
  opportunity_status VARCHAR(50) DEFAULT 'open',
  posted_date DATE,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User saved grants
CREATE TABLE IF NOT EXISTS user_saved_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grant_id UUID NOT NULL REFERENCES grant_opportunities(id) ON DELETE CASCADE,
  notes TEXT,
  match_score INTEGER,
  saved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, grant_id)
);

-- Grant applications
CREATE TABLE IF NOT EXISTS grant_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  grant_id UUID REFERENCES grant_opportunities(id),
  grant_title TEXT NOT NULL,
  agency VARCHAR(255),
  requested_amount DECIMAL(15,2),
  status VARCHAR(50) DEFAULT 'draft',
  progress INTEGER DEFAULT 0,
  deadline DATE,
  submitted_at TIMESTAMPTZ,
  awarded_at TIMESTAMPTZ,
  awarded_amount DECIMAL(15,2),
  application_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant application documents
CREATE TABLE IF NOT EXISTS grant_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES grant_applications(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- WEBSITE BUILDER APP TABLES
-- =====================================================

-- User websites
CREATE TABLE IF NOT EXISTS user_websites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  site_name VARCHAR(255) NOT NULL,
  tagline TEXT,
  domain VARCHAR(255),
  subdomain VARCHAR(100),
  template_id VARCHAR(100),
  primary_color VARCHAR(7) DEFAULT '#2563eb',
  secondary_color VARCHAR(7) DEFAULT '#10b981',
  logo_url TEXT,
  favicon_url TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Website pages
CREATE TABLE IF NOT EXISTS website_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES user_websites(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  is_home BOOLEAN DEFAULT false,
  blocks JSONB DEFAULT '[]',
  seo_title VARCHAR(255),
  seo_description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(website_id, slug)
);

-- Website media library
CREATE TABLE IF NOT EXISTS website_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  website_id UUID NOT NULL REFERENCES user_websites(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  alt_text TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE user_app_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sam_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sam_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE sam_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_saved_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE website_media ENABLE ROW LEVEL SECURITY;

-- User app subscriptions - users can only see their own
CREATE POLICY "Users own subscriptions" ON user_app_subscriptions 
  FOR ALL USING (auth.uid() = user_id);

-- SAM entities - users can only see their own
CREATE POLICY "Users own SAM entities" ON sam_entities 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own SAM documents" ON sam_documents 
  FOR ALL USING (entity_id IN (SELECT id FROM sam_entities WHERE user_id = auth.uid()));

CREATE POLICY "Users own SAM alerts" ON sam_alerts 
  FOR ALL USING (entity_id IN (SELECT id FROM sam_entities WHERE user_id = auth.uid()));

-- Grant opportunities - public read
CREATE POLICY "Public grant opportunities" ON grant_opportunities 
  FOR SELECT USING (true);

CREATE POLICY "Users own saved grants" ON user_saved_grants 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own grant applications" ON grant_applications 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own grant documents" ON grant_documents 
  FOR ALL USING (application_id IN (SELECT id FROM grant_applications WHERE user_id = auth.uid()));

-- Websites - users can only see their own
CREATE POLICY "Users own websites" ON user_websites 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users own website pages" ON website_pages 
  FOR ALL USING (website_id IN (SELECT id FROM user_websites WHERE user_id = auth.uid()));

CREATE POLICY "Users own website media" ON website_media 
  FOR ALL USING (website_id IN (SELECT id FROM user_websites WHERE user_id = auth.uid()));

-- =====================================================
-- SEED DATA - PRODUCTS
-- =====================================================

-- Add app products to products table
INSERT INTO products (name, slug, description, price, type, category, is_active) VALUES
  ('SAM.gov Assistant - Starter', 'sam-gov-starter', 'SAM.gov registration for 1 entity', 49, 'app', 'government', true),
  ('SAM.gov Assistant - Professional', 'sam-gov-pro', 'SAM.gov registration for 5 entities', 149, 'app', 'government', true),
  ('SAM.gov Assistant - Enterprise', 'sam-gov-enterprise', 'Unlimited SAM.gov entities', 399, 'app', 'government', true),
  ('Grants Discovery - Starter', 'grants-starter', 'Basic grant search and tracking', 99, 'app', 'funding', true),
  ('Grants Discovery - Professional', 'grants-pro', 'Advanced grant management', 199, 'app', 'funding', true),
  ('Grants Discovery - Enterprise', 'grants-enterprise', 'Full grant suite with API', 499, 'app', 'funding', true),
  ('Website Builder - Starter', 'website-builder-starter', '1 website with basic features', 29, 'app', 'website', true),
  ('Website Builder - Professional', 'website-builder-pro', '5 websites with advanced features', 79, 'app', 'website', true),
  ('Website Builder - Enterprise', 'website-builder-enterprise', 'Unlimited websites', 199, 'app', 'website', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  type = EXCLUDED.type,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active;

-- =====================================================
-- SEED DATA - GRANT OPPORTUNITIES
-- =====================================================

INSERT INTO grant_opportunities (grants_gov_id, title, agency, description, amount_min, amount_max, deadline, category, opportunity_status) VALUES
  ('WIOA-2026-001', 'Workforce Innovation and Opportunity Act (WIOA) Adult Program', 'Department of Labor', 'Funding for adult workforce training and employment services under WIOA Title I.', 500000, 2000000, '2026-03-15', 'Workforce Development', 'open'),
  ('CDBG-2026-001', 'Community Development Block Grant (CDBG)', 'HUD', 'Flexible funding for community development activities including job training facilities.', 100000, 500000, '2026-02-28', 'Community Development', 'open'),
  ('DOL-RA-2026', 'Registered Apprenticeship Technical Assistance', 'Department of Labor', 'Support for expanding registered apprenticeship programs in high-demand industries.', 250000, 1000000, '2026-04-01', 'Workforce Development', 'open'),
  ('ED-AEFLA-2026', 'Adult Education and Family Literacy Act', 'Department of Education', 'Grants for adult education, literacy, and workforce preparation programs.', 200000, 750000, '2026-03-30', 'Education', 'open'),
  ('DOL-YB-2026', 'YouthBuild Program', 'Department of Labor', 'Education and job training for at-risk youth ages 16-24.', 700000, 1100000, '2026-05-15', 'Youth Development', 'open'),
  ('HHS-CSBG-2026', 'Community Services Block Grant', 'HHS', 'Funding to reduce poverty and revitalize low-income communities.', 150000, 400000, '2026-04-15', 'Community Development', 'open'),
  ('DOL-NFJP-2026', 'National Farmworker Jobs Program', 'Department of Labor', 'Training and employment services for migrant and seasonal farmworkers.', 300000, 800000, '2026-05-01', 'Workforce Development', 'open'),
  ('ED-PERKINS-2026', 'Carl D. Perkins Career and Technical Education', 'Department of Education', 'Support for career and technical education programs.', 100000, 500000, '2026-06-01', 'Education', 'open')
ON CONFLICT (grants_gov_id) DO UPDATE SET
  title = EXCLUDED.title,
  agency = EXCLUDED.agency,
  description = EXCLUDED.description,
  amount_min = EXCLUDED.amount_min,
  amount_max = EXCLUDED.amount_max,
  deadline = EXCLUDED.deadline,
  category = EXCLUDED.category,
  opportunity_status = EXCLUDED.opportunity_status;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_user_app_subscriptions_user ON user_app_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_app_subscriptions_app ON user_app_subscriptions(app_slug);
CREATE INDEX IF NOT EXISTS idx_sam_entities_user ON sam_entities(user_id);
CREATE INDEX IF NOT EXISTS idx_grant_opportunities_deadline ON grant_opportunities(deadline);
CREATE INDEX IF NOT EXISTS idx_grant_opportunities_category ON grant_opportunities(category);
CREATE INDEX IF NOT EXISTS idx_grant_applications_user ON grant_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_websites_user ON user_websites(user_id);
