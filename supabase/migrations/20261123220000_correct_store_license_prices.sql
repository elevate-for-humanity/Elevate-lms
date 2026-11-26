-- Correct the remaining store license prices in the `products` table.
--
-- Audit (DB seed 20260220100000_products_catalog_upgrade.sql vs the
-- canonical code catalog lib/data/store-products.ts, corroborated by the
-- prices verified on the live store Nov 23, 2026):
--
--   slug                  DB seed                              Advertised
--   --------------------  -----------------------------------  ----------
--   efh-core-platform     $1,500 + $5,000 setup, subscription  $4,999 one-time
--   school-license        $2,500/mo + $7,500 setup             $15,000 one-time
--   enterprise-license    $75,000 one-time                     $50,000 one-time
--   monthly-subscription  $1,500/mo                            $499/mo
--   community-hub         $0 one-time                          $2,499 one-time
--   community-basic       $49/mo                               $99/mo
--   community-pro         $149/mo                              $199/mo
--   community-enterprise  $499/mo                              $299/mo
--
-- The cart-checkout API revalidates browser-cart slugs against this table
-- and invoices the DB price_cents, so the seeded rows would have charged
-- buyers the wrong amounts (Core buyers $1,500 instead of $4,999, School
-- buyers $2,500 instead of $15,000, Enterprise buyers $75,000 instead of
-- $50,000, monthly subscribers $1,500/mo instead of $499/mo, and so on).
-- The code catalog carries no setup fees for these products, so
-- setup_fee_cents is corrected to 0; the checkout API invoices
-- price_cents only today, but the rows now match the catalog on every
-- field so no future setup-fee use can overcharge either.
--
-- Note on enterprise-license: the seeded $75,000 matches the Source-Use
-- offering ("from $75,000") on the /licenses pages, but that offering has
-- no slug and no cart path. The enterprise-license slug is the store's
-- Enterprise Workforce Solution at $50,000 (also what the earlier
-- 20260123000001 seed priced it at), so the row is corrected to $50,000.
-- Source-Use stays a contact-sales offering; it is not given a slug here.
--
-- Idempotent: safe to re-run. The companion migration
-- 20261123213000_correct_clone_license_prices.sql corrected the three
-- clone licenses; this file covers the remaining store + community rows.

ALTER TABLE products ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- ============ STORE_PRODUCTS (platform licenses) ============

INSERT INTO products (slug, name, description, long_description, price_cents, billing_type, license_type, catalog_group, features, ideal_for, apps_included, setup_fee_cents, sort_order, is_active, is_featured, type, category, stripe_product_id, stripe_price_id)
VALUES
  ('efh-core-platform', 'EFH Core Workforce Platform',
   'Full workforce-ready LMS, enrollment, payments, and admin system.',
   'The complete Elevate For Humanity platform with everything you need to launch and manage workforce training programs. Includes LMS, student enrollment, payment processing, admin dashboard, and mobile app.',
   499900, 'one_time', 'single', 'store',
   ARRAY['Unlimited students and courses', 'SCORM and xAPI support', 'Stripe payment integration', 'Mobile-responsive design', 'Progress tracking and certificates', 'Email notifications', 'Basic reporting and analytics', '1 year of updates and support'],
   'Small training providers, nonprofits starting workforce programs, individual instructors, and pilot programs.',
   '["lms", "enrollment", "admin", "payments", "mobile-app"]'::jsonb,
   0, 10, true, true, 'license', 'platform',
   'prod_ToOZIXY6zYbhRB', 'price_1SqlmaIRNf5vPH3ACHgpKmel'),

  ('school-license', 'School / Training Provider License',
   'White-label license for schools, nonprofits, and workforce providers.',
   'Full platform access with white-labeling, partner dashboard, case management, and compliance tools. Perfect for schools and training providers serving multiple programs and funding sources.',
   1500000, 'one_time', 'school', 'store',
   ARRAY['Everything in Core Platform', 'White-label branding', 'Partner dashboard for instructors', 'Case management tools', 'WIOA and grant compliance reporting', 'Multi-program management', 'Advanced analytics', 'Priority support', 'Lifetime updates'],
   'Community colleges, workforce development boards, training providers with WIOA contracts, and nonprofits with multiple programs.',
   '["lms", "enrollment", "admin", "payments", "partner-dashboard", "case-management", "compliance", "mobile-app"]'::jsonb,
   0, 20, true, true, 'license', 'platform',
   'prod_ToOZBAQ4kvlKKk', 'price_1SqlmbIRNf5vPH3AAK1dIDMK'),

  ('enterprise-license', 'Enterprise Workforce Solution',
   'Full enterprise deployment with employer portal, AI tutor, and custom integrations.',
   'The complete workforce ecosystem with employer partnerships, AI-powered learning, custom integrations, and dedicated support. Built for large-scale workforce initiatives.',
   5000000, 'one_time', 'enterprise', 'store',
   ARRAY['Everything in School License', 'Employer portal and job matching', 'AI tutor and personalized learning', 'Custom integrations (API access)', 'Multi-tenant architecture', 'Dedicated account manager', 'Custom training and onboarding', 'SLA with 99.9% uptime', 'Lifetime updates and priority support'],
   'State workforce agencies, large workforce boards, multi-state training networks, and enterprise employers with training programs.',
   '["lms", "enrollment", "admin", "payments", "partner-dashboard", "case-management", "employer-portal", "compliance", "mobile-app", "ai-tutor"]'::jsonb,
   0, 30, true, false, 'license', 'platform',
   'prod_ToOZ6fD0L8CUyV', 'price_1SqlmbIRNf5vPH3AAxjxhPYN'),

  ('monthly-subscription', 'Monthly Subscription',
   'Pay-as-you-go access to the core platform with monthly billing.',
   'Get started with no upfront cost. Monthly subscription includes the core platform with LMS, enrollment, and admin tools. Cancel anytime.',
   49900, 'subscription', 'single', 'store',
   ARRAY['All core platform features', 'Up to 100 active students', 'Basic support', 'Monthly updates', 'Cancel anytime'],
   'New training providers testing the platform, seasonal programs, small cohorts, and budget-conscious organizations.',
   '["lms", "enrollment", "admin", "payments", "mobile-app"]'::jsonb,
   0, 40, true, false, 'subscription', 'platform',
   'prod_ToOZPCv9vGYJgc', 'price_1SqlmcIRNf5vPH3AtcLZ9zYR')

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
  stripe_product_id = EXCLUDED.stripe_product_id,
  stripe_price_id = EXCLUDED.stripe_price_id;

-- ============ COMMUNITY_ADDONS ============

INSERT INTO products (slug, name, description, price_cents, billing_type, license_type, catalog_group, features, sort_order, is_active, type, category, stripe_product_id, stripe_price_id)
VALUES
  ('community-hub', 'Community Hub Add-On',
   'Complete community platform with discussions, groups, leaderboards, and events.',
   249900, 'one_time', 'single', 'addon',
   ARRAY['Discussion forums with categories', 'Member groups and networking', 'Leaderboards and gamification', 'Points, badges, and achievements', 'Events calendar and RSVPs', 'Member directory and profiles', 'Real-time activity feed', 'Classroom integration', 'Mobile-responsive design', 'Moderation tools'],
   50, true, 'addon', 'community',
   NULL, NULL),

  ('community-basic', 'Community Edition - Basic',
   'Add community marketplace features to your platform.',
   9900, 'subscription', 'single', 'addon',
   ARRAY['1 program owner account', 'Create unlimited courses', 'Community marketplace listing', 'Up to 100 community members', 'Discussion forums', 'Basic analytics'],
   51, true, 'addon', 'community',
   'prod_ToOcx8FkIywNrw', 'price_1SqlpMIRNf5vPH3AuvVYn1Qa'),

  ('community-pro', 'Community Edition - Pro',
   'Full community platform with multiple program owners.',
   19900, 'subscription', 'school', 'addon',
   ARRAY['Up to 5 program owner accounts', 'Unlimited courses and products', 'Community marketplace', 'Up to 500 community members', 'Discussion forums with moderation', 'Shop marketplace', 'Advanced analytics', 'Priority support'],
   52, true, 'addon', 'community',
   'prod_ToOcdTkz2xafSu', 'price_1SqlpMIRNf5vPH3A7FsVZBeC'),

  ('community-enterprise', 'Community Edition - Enterprise',
   'Unlimited community features for large organizations.',
   29900, 'subscription', 'enterprise', 'addon',
   ARRAY['Unlimited program owners', 'Unlimited courses and products', 'Unlimited community members', 'White-label community branding', 'Advanced moderation tools', 'Shop marketplace with revenue sharing', 'Custom integrations', 'Dedicated account manager', 'SLA with 99.9% uptime'],
   53, true, 'addon', 'community',
   'prod_ToOcgzaU2klz7V', 'price_1SqlpNIRNf5vPH3AqltrUPSP')

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
  stripe_product_id = COALESCE(EXCLUDED.stripe_product_id, products.stripe_product_id),
  stripe_price_id = COALESCE(EXCLUDED.stripe_price_id, products.stripe_price_id);

