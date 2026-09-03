-- Products catalog_group backfill for store license pages.
-- Idempotent: safe to re-run. Aligns DB with lib/store/db.ts getCatalogProducts() filters.

ALTER TABLE products ADD COLUMN IF NOT EXISTS price_cents INTEGER;
ALTER TABLE products ADD COLUMN IF NOT EXISTS long_description TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS ideal_for TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS apps_included JSONB DEFAULT '[]'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS setup_fee_cents INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS catalog_group TEXT DEFAULT 'store';

UPDATE products
SET price_cents = (price * 100)::integer
WHERE price_cents IS NULL AND price IS NOT NULL;

UPDATE products
SET catalog_group = 'clone'
WHERE category = 'clone'
   OR slug IN ('starter-license', 'pro-license', 'enterprise-clone-license');

UPDATE products
SET catalog_group = 'addon'
WHERE type IN ('addon', 'digital', 'course', 'physical', 'program')
   OR category IN (
     'grants', 'compliance', 'ai-tools', 'apps', 'certification',
     'safety', 'shop', 'resources', 'training', 'developer', 'community'
   );

UPDATE products
SET catalog_group = 'store'
WHERE type IN ('license', 'subscription')
  AND category IN ('platform', 'infrastructure');

UPDATE products
SET catalog_group = 'store'
WHERE slug IN (
  'monthly-subscription',
  'monthly-core',
  'monthly-institutional',
  'monthly-enterprise'
);

CREATE INDEX IF NOT EXISTS idx_products_catalog ON products (catalog_group, is_active, sort_order);
