-- Correct the clone (self-host) license prices in the `products` table.
--
-- The 2026-02-20 catalog seed priced these rows at $2,500 / $7,500 / $25,000,
-- but the store advertises them at $299 / $999 / $5,000 and the canonical
-- code catalog (lib/data/store-products.ts CLONE_LICENSES) carries the same
-- advertised prices with Stripe product/price IDs. The cart-checkout API
-- revalidates browser-cart slugs against this table and invoices the DB
-- price, so a client-side add-to-cart fix alone would have charged buyers
-- the seeded price instead of the advertised one.
--
-- Idempotent: safe to re-run. Aligns the DB rows with the advertised prices,
-- the code catalog names/descriptions, and the Stripe product/price IDs.

ALTER TABLE products ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

INSERT INTO products (slug, name, description, price_cents, billing_type, license_type, catalog_group, features, sort_order, is_active, type, category, stripe_product_id, stripe_price_id)
VALUES
  ('starter-license', 'Elevate LMS Starter License',
   'Single site license with 1 year updates and email support.',
   29900, 'one_time', 'single', 'clone',
   ARRAY['Complete Next.js codebase', 'Single site deployment', '1 year of updates', 'Email support', 'Documentation access'],
   60, true, 'license', 'clone',
   'prod_ToOiTGsUDJPopc', 'price_1SqluuIRNf5vPH3A7VEoPwRw'),

  ('pro-license', 'Elevate LMS Pro License',
   'Multi-site license with lifetime updates and Dev Studio.',
   99900, 'one_time', 'school', 'clone',
   ARRAY['Complete Next.js codebase', 'Multi-site deployment', 'Lifetime updates', 'Priority support', 'Dev Studio included', 'API documentation'],
   61, true, 'license', 'clone',
   'prod_ToOiCEdY0Z48Mp', 'price_1SqluuIRNf5vPH3AAHrdLDu3'),

  ('enterprise-clone-license', 'Elevate LMS Enterprise License',
   'Unlimited sites, white-label, dedicated support, and custom features.',
   500000, 'one_time', 'enterprise', 'clone',
   ARRAY['Complete Next.js codebase', 'Unlimited site deployments', 'White-label rights', 'Dedicated support channel', 'Custom feature development', 'Architecture consultation', 'Source code escrow'],
   62, true, 'license', 'clone',
   'prod_ToOiS4Hg9blBzB', 'price_1SqluuIRNf5vPH3ALcAcExyz')

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
  stripe_product_id = EXCLUDED.stripe_product_id,
  stripe_price_id = EXCLUDED.stripe_price_id;

