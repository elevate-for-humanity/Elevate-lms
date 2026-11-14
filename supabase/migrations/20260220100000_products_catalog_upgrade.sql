-- ============================================================================
-- Products Catalog Upgrade
-- ============================================================================
-- Adds missing columns needed by store pages and checkout flows.
-- Existing data is preserved — all new columns are nullable or have defaults.
-- ============================================================================

-- Stripe integration columns
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stripe_product_id text,
  ADD COLUMN IF NOT EXISTS billing_type text DEFAULT 'one_time'
    CHECK (billing_type IN ('one_time', 'subscription', 'usage')),
  ADD COLUMN IF NOT EXISTS recurring_interval text
    CHECK (recurring_interval IN ('month', 'year', NULL)),
  ADD COLUMN IF NOT EXISTS trial_days integer DEFAULT 0;

-- Licensing columns
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS license_type text
    CHECK (license_type IN ('managed', 'source_use', 'enterprise', 'single', 'school', NULL)),
  ADD COLUMN IF NOT EXISTS seat_limit integer,
  ADD COLUMN IF NOT EXISTS requires_approval boolean DEFAULT false;

-- Pricing columns
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS compare_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS setup_fee numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'usd';

-- Catalog display columns
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS icon text,
  ADD COLUMN IF NOT EXISTS demo_url text,
  ADD COLUMN IF NOT EXISTS documentation_url text;

-- Tenant isolation
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS tenant_id uuid REFERENCES tenants(id);

CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_stripe_product_id ON products(stripe_product_id);
CREATE INDEX IF NOT EXISTS idx_products_billing_type ON products(billing_type);

-- Backfill tenant_id on existing products
UPDATE products
SET tenant_id = (SELECT id FROM tenants WHERE slug = 'elevate-for-humanity' LIMIT 1)
WHERE tenant_id IS NULL;

-- Add auto-populate trigger
DROP TRIGGER IF EXISTS trg_auto_tenant_products ON products;
CREATE TRIGGER trg_auto_tenant_products
  BEFORE INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION auto_populate_tenant_id();

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Products are publicly readable (catalog), but only tenant-scoped for writes
DROP POLICY IF EXISTS products_public_read ON products;
CREATE POLICY products_public_read ON products FOR SELECT
  USING (true);

DROP POLICY IF EXISTS products_tenant_insert ON products;
CREATE POLICY products_tenant_insert ON products FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS products_tenant_update ON products;
CREATE POLICY products_tenant_update ON products FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

DROP POLICY IF EXISTS products_tenant_delete ON products;
CREATE POLICY products_tenant_delete ON products FOR DELETE
  USING (is_super_admin());

-- ============================================================================
-- Additional catalog columns for checkout pages and store listings
-- ============================================================================

ALTER TABLE products ADD COLUMN IF NOT EXISTS price_cents INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS long_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ideal_for TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS apps_included JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS setup_fee_cents INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS catalog_group TEXT DEFAULT 'store' CHECK (catalog_group IN ('store', 'addon', 'clone'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure slug is unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug ON products (slug);

-- Index for catalog queries
CREATE INDEX IF NOT EXISTS idx_products_catalog ON products (catalog_group, is_active, sort_order);

-- Backfill price_cents from existing price column
UPDATE products SET price_cents = (price * 100)::integer WHERE price_cents IS NULL AND price IS NOT NULL;

-- ============================================================================
-- Seed the full catalog (upsert to avoid duplicates)
-- ============================================================================

-- ============ STORE_PRODUCTS (platform licenses) ============

INSERT INTO products (slug, name, description, long_description, price_cents, billing_type, license_type, catalog_group, features, ideal_for, apps_included, setup_fee_cents, sort_order, is_active, is_featured, type, category)
VALUES
  ('efh-core-platform', 'EFH Core Workforce Platform',
   'Full workforce development platform with enrollment, compliance, and credential management.',
   'Complete workforce development LMS with automated enrollment, WIOA compliance, credential issuance, employer matching, and grant reporting. White-labeled to your organization.',
   150000, 'subscription', 'single', 'store',
   '["Automated enrollment pipeline", "WIOA eligibility & compliance", "Credential issuance", "Student & employer portals", "PIRL reporting", "Grant tracking", "White-label branding", "Email & phone support"]'::jsonb,
   'Training providers and workforce organizations managing up to 500 learners.',
   '["enrollment", "compliance", "credentials", "reporting", "employer-portal"]'::jsonb,
   500000, 10, true, true, 'license', 'platform'),

  ('school-license', 'School License',
   'Multi-program workforce platform for training schools and institutions.',
   'Everything in Core plus multi-program support, advanced analytics, course builder, and priority support. For organizations running multiple training programs.',
   250000, 'subscription', 'school', 'store',
   '["Everything in Core Platform", "Unlimited programs", "Course builder", "Advanced analytics", "Priority support", "Custom integrations", "API access", "Dedicated account manager"]'::jsonb,
   'Training schools and institutions running multiple programs with 500+ learners.',
   '["enrollment", "compliance", "credentials", "reporting", "employer-portal", "course-builder", "analytics", "api"]'::jsonb,
   750000, 20, true, true, 'license', 'platform'),

  ('enterprise-license', 'Enterprise License',
   'Full source-use license for large organizations and state agencies.',
   'Deploy on your infrastructure with full source code access. For state agencies and large workforce networks that need complete control over their platform.',
   7500000, 'one_time', 'enterprise', 'store',
   '["Everything in School License", "Full source code access", "Self-hosted deployment", "40 hours implementation support", "Annual updates & patches", "Volume licensing", "Custom SLA", "On-premise option"]'::jsonb,
   'State agencies, large workforce networks, and organizations requiring on-premise deployment.',
   '["enrollment", "compliance", "credentials", "reporting", "employer-portal", "course-builder", "analytics", "api", "mobile-app", "ai-tutor"]'::jsonb,
   0, 30, true, false, 'license', 'platform'),

  ('monthly-subscription', 'Monthly Platform Subscription',
   'Month-to-month platform access with no long-term commitment.',
   'Full platform access billed monthly. Same features as the annual plan. Cancel anytime.',
   150000, 'subscription', 'single', 'store',
   '["Full platform access", "All three portals", "WIOA compliance tools", "Credential issuance", "Email support", "Cancel anytime"]'::jsonb,
   'Organizations that prefer monthly billing flexibility.',
   '["enrollment", "compliance", "credentials", "reporting"]'::jsonb,
   0, 40, true, false, 'subscription', 'platform')

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  long_description = EXCLUDED.long_description,
  price_cents = EXCLUDED.price_cents,
  billing_type = EXCLUDED.billing_type,
  license_type = EXCLUDED.license_type,
  catalog_group = EXCLUDED.catalog_group,
  features = EXCLUDED.features,
  ideal_for = EXCLUDED.ideal_for,
  apps_included = EXCLUDED.apps_included,
  setup_fee_cents = EXCLUDED.setup_fee_cents,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  is_featured = EXCLUDED.is_featured,
  type = EXCLUDED.type,
  category = EXCLUDED.category,
  updated_at = NOW();

-- ============ COMMUNITY_ADDONS ============

INSERT INTO products (slug, name, description, price_cents, billing_type, catalog_group, features, sort_order, is_active, type, category)
VALUES
  ('community-hub', 'Community Hub Add-on',
   'Discussion forums, events, and community features for your platform.',
   0, 'one_time', 'addon',
   '["Discussion forums", "Event management", "Member directory", "Content sharing"]'::jsonb,
   50, true, 'addon', 'community'),

  ('community-basic', 'Community Edition - Basic',
   'Essential community features for small organizations.',
   4900, 'subscription', 'addon',
   '["Up to 100 members", "Discussion forums", "Basic analytics", "Email notifications"]'::jsonb,
   51, true, 'addon', 'community'),

  ('community-pro', 'Community Edition - Pro',
   'Advanced community features with unlimited members.',
   14900, 'subscription', 'addon',
   '["Unlimited members", "Advanced moderation", "Custom branding", "API access", "Priority support"]'::jsonb,
   52, true, 'addon', 'community'),

  ('community-enterprise', 'Community Edition - Enterprise',
   'Enterprise community features with SSO and custom integrations.',
   49900, 'subscription', 'addon',
   '["Everything in Pro", "SSO integration", "Custom workflows", "Dedicated support", "SLA guarantee"]'::jsonb,
   53, true, 'addon', 'community')

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  billing_type = EXCLUDED.billing_type,
  catalog_group = EXCLUDED.catalog_group,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  type = EXCLUDED.type,
  category = EXCLUDED.category,
  updated_at = NOW();

-- ============ CLONE_LICENSES ============

INSERT INTO products (slug, name, description, price_cents, billing_type, license_type, catalog_group, features, sort_order, is_active, type, category)
VALUES
  ('starter-license', 'Clone License - Starter',
   'Source code license for a single deployment.',
   250000, 'one_time', 'single', 'clone',
   '["Full source code", "Single deployment", "6 months updates", "Community support", "Documentation"]'::jsonb,
   60, true, 'license', 'clone'),

  ('pro-license', 'Clone License - Pro',
   'Source code license with extended support and multiple deployments.',
   750000, 'one_time', 'school', 'clone',
   '["Full source code", "Up to 5 deployments", "12 months updates", "Priority support", "Implementation guide", "API documentation"]'::jsonb,
   61, true, 'license', 'clone'),

  ('enterprise-clone-license', 'Clone License - Enterprise',
   'Unlimited deployment source code license with dedicated support.',
   2500000, 'one_time', 'enterprise', 'clone',
   '["Full source code", "Unlimited deployments", "24 months updates", "Dedicated support", "Custom integrations", "Training sessions", "SLA guarantee"]'::jsonb,
   62, true, 'license', 'clone')

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  billing_type = EXCLUDED.billing_type,
  license_type = EXCLUDED.license_type,
  catalog_group = EXCLUDED.catalog_group,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  type = EXCLUDED.type,
  category = EXCLUDED.category,
  updated_at = NOW();
