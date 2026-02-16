-- ============================================================================
-- STORE SUBSCRIPTION PRODUCTS - SEED DATA
-- ============================================================================
-- Defines store subscription tiers and their entitlements
-- Update Stripe product/price IDs after creating in Stripe Dashboard
-- ============================================================================

-- ============================================================================
-- TIER 1: STORE PRO
-- ============================================================================

INSERT INTO store_products (
  name,
  description,
  stripe_product_id,
  is_subscription,
  is_active,
  features,
  metadata
) VALUES (
  'Store Pro',
  'Professional store access with premium benefits',
  'prod_store_pro', -- UPDATE THIS with real Stripe product ID
  true,
  true,
  jsonb_build_array(
    'Free shipping on all orders',
    '10% discount on all products',
    'Priority customer support',
    'Early access to new products',
    'Exclusive member-only deals'
  ),
  jsonb_build_object(
    'entitlements', jsonb_build_array('store_pro', 'free_shipping', 'priority_support'),
    'discount_percentage', 10,
    'tier', 'pro'
  )
) ON CONFLICT (stripe_product_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Store Pro - Monthly Price
INSERT INTO store_prices (
  store_product_id,
  stripe_price_id,
  interval,
  interval_count,
  amount_cents,
  currency,
  is_active,
  trial_period_days
) VALUES (
  (SELECT id FROM store_products WHERE stripe_product_id = 'prod_store_pro'),
  'price_store_pro_monthly', -- UPDATE THIS with real Stripe price ID
  'month',
  1,
  2900, -- $29.00
  'usd',
  true,
  7 -- 7-day free trial
) ON CONFLICT (stripe_price_id) DO UPDATE SET
  amount_cents = EXCLUDED.amount_cents,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Store Pro - Yearly Price (save $58)
INSERT INTO store_prices (
  store_product_id,
  stripe_price_id,
  interval,
  interval_count,
  amount_cents,
  currency,
  is_active,
  trial_period_days
) VALUES (
  (SELECT id FROM store_products WHERE stripe_product_id = 'prod_store_pro'),
  'price_store_pro_yearly', -- UPDATE THIS with real Stripe price ID
  'year',
  1,
  29000, -- $290.00 (save $58)
  'usd',
  true,
  7 -- 7-day free trial
) ON CONFLICT (stripe_price_id) DO UPDATE SET
  amount_cents = EXCLUDED.amount_cents,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================================
-- TIER 2: VIP ACCESS
-- ============================================================================

INSERT INTO store_products (
  name,
  description,
  stripe_product_id,
  is_subscription,
  is_active,
  features,
  metadata
) VALUES (
  'VIP Access',
  'Premium VIP membership with wholesale pricing and exclusive perks',
  'prod_vip_access', -- UPDATE THIS with real Stripe product ID
  true,
  true,
  jsonb_build_array(
    'Everything in Store Pro',
    'Wholesale pricing (20-40% off)',
    'Exclusive VIP-only products',
    'Early access to sales and launches',
    'Dedicated VIP support line',
    'Free expedited shipping',
    'Monthly VIP member gifts'
  ),
  jsonb_build_object(
    'entitlements', jsonb_build_array('vip_access', 'wholesale_pricing', 'exclusive_products', 'free_shipping', 'priority_support', 'expedited_shipping'),
    'discount_percentage', 25,
    'tier', 'vip'
  )
) ON CONFLICT (stripe_product_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- VIP Access - Monthly Price
INSERT INTO store_prices (
  store_product_id,
  stripe_price_id,
  interval,
  interval_count,
  amount_cents,
  currency,
  is_active,
  trial_period_days
) VALUES (
  (SELECT id FROM store_products WHERE stripe_product_id = 'prod_vip_access'),
  'price_vip_monthly', -- UPDATE THIS with real Stripe price ID
  'month',
  1,
  9900, -- $99.00
  'usd',
  true,
  14 -- 14-day free trial
) ON CONFLICT (stripe_price_id) DO UPDATE SET
  amount_cents = EXCLUDED.amount_cents,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- VIP Access - Yearly Price (save $198)
INSERT INTO store_prices (
  store_product_id,
  stripe_price_id,
  interval,
  interval_count,
  amount_cents,
  currency,
  is_active,
  trial_period_days
) VALUES (
  (SELECT id FROM store_products WHERE stripe_product_id = 'prod_vip_access'),
  'price_vip_yearly', -- UPDATE THIS with real Stripe price ID
  'year',
  1,
  99000, -- $990.00 (save $198)
  'usd',
  true,
  14 -- 14-day free trial
) ON CONFLICT (stripe_price_id) DO UPDATE SET
  amount_cents = EXCLUDED.amount_cents,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================================
-- TIER 3: WHOLESALE PARTNER
-- ============================================================================

INSERT INTO store_products (
  name,
  description,
  stripe_product_id,
  is_subscription,
  is_active,
  features,
  metadata
) VALUES (
  'Wholesale Partner',
  'Business-level wholesale access for resellers and bulk buyers',
  'prod_wholesale_partner', -- UPDATE THIS with real Stripe product ID
  true,
  true,
  jsonb_build_array(
    'Everything in VIP Access',
    'True wholesale pricing (40-60% off)',
    'Bulk ordering capabilities',
    'Net-30 payment terms available',
    'Dedicated account manager',
    'Custom product requests',
    'White-label options',
    'Quarterly business reviews'
  ),
  jsonb_build_object(
    'entitlements', jsonb_build_array('wholesale_partner', 'bulk_ordering', 'net30_terms', 'account_manager', 'custom_products', 'white_label'),
    'discount_percentage', 50,
    'tier', 'wholesale'
  )
) ON CONFLICT (stripe_product_id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  features = EXCLUDED.features,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Wholesale Partner - Monthly Price
INSERT INTO store_prices (
  store_product_id,
  stripe_price_id,
  interval,
  interval_count,
  amount_cents,
  currency,
  is_active,
  trial_period_days
) VALUES (
  (SELECT id FROM store_products WHERE stripe_product_id = 'prod_wholesale_partner'),
  'price_wholesale_monthly', -- UPDATE THIS with real Stripe price ID
  'month',
  1,
  19900, -- $199.00
  'usd',
  true,
  NULL -- No trial for wholesale
) ON CONFLICT (stripe_price_id) DO UPDATE SET
  amount_cents = EXCLUDED.amount_cents,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- Wholesale Partner - Yearly Price (save $398)
INSERT INTO store_prices (
  store_product_id,
  stripe_price_id,
  interval,
  interval_count,
  amount_cents,
  currency,
  is_active,
  trial_period_days
) VALUES (
  (SELECT id FROM store_products WHERE stripe_product_id = 'prod_wholesale_partner'),
  'price_wholesale_yearly', -- UPDATE THIS with real Stripe price ID
  'year',
  1,
  199000, -- $1,990.00 (save $398)
  'usd',
  true,
  NULL -- No trial for wholesale
) ON CONFLICT (stripe_price_id) DO UPDATE SET
  amount_cents = EXCLUDED.amount_cents,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================================
-- HELPER VIEW: SUBSCRIPTION PRICING
-- ============================================================================

CREATE OR REPLACE VIEW store_subscription_pricing AS
SELECT 
  p.id as product_id,
  p.name as product_name,
  p.description,
  p.features,
  p.metadata,
  pr.id as price_id,
  pr.stripe_price_id,
  pr.interval,
  pr.amount_cents,
  pr.amount_cents / 100.0 as amount_dollars,
  pr.trial_period_days,
  pr.is_active,
  CASE 
    WHEN pr.interval = 'month' THEN 'Monthly'
    WHEN pr.interval = 'year' THEN 'Yearly'
    ELSE pr.interval
  END as billing_period,
  CASE 
    WHEN pr.interval = 'year' THEN 
      ROUND((pr.amount_cents / 12.0) / 100.0, 2)
    ELSE 
      pr.amount_cents / 100.0
  END as effective_monthly_price
FROM store_products p
JOIN store_prices pr ON pr.store_product_id = p.id
WHERE p.is_active = TRUE
  AND pr.is_active = TRUE
ORDER BY pr.amount_cents ASC;

COMMENT ON VIEW store_subscription_pricing IS 'User-friendly view of subscription pricing options';

GRANT SELECT ON store_subscription_pricing TO authenticated;

-- ============================================================================
-- DONE - Update Stripe product/price IDs in Stripe Dashboard
-- ============================================================================

-- TODO: After creating products in Stripe Dashboard, update the IDs above:
-- 1. Create products in Stripe Dashboard
-- 2. Create prices for each product (monthly + yearly)
-- 3. Copy the prod_* and price_* IDs
-- 4. Update this migration with real IDs
-- 5. Re-run migration or update directly in database
