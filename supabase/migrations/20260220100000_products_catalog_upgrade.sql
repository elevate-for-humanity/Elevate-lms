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
    CHECK (license_type IN ('managed', 'source_use', 'enterprise', NULL)),
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
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);

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
CREATE POLICY products_public_read ON products FOR SELECT
  USING (true);

CREATE POLICY products_tenant_insert ON products FOR INSERT
  WITH CHECK (is_super_admin() OR tenant_id = get_current_tenant_id());

CREATE POLICY products_tenant_update ON products FOR UPDATE
  USING (is_super_admin() OR tenant_id = get_current_tenant_id());

CREATE POLICY products_tenant_delete ON products FOR DELETE
  USING (is_super_admin());
