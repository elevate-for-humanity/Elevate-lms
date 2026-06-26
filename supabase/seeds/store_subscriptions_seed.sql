-- Store Subscriptions Seed Data
-- Run after 20260625000007_store_missing_tables.sql
-- Seeds store_products and store_prices for the /store/subscriptions page

-- Clear existing data
TRUNCATE public.store_products CASCADE;
TRUNCATE public.store_prices CASCADE;

-- Insert platform subscription products
INSERT INTO public.store_products (id, name, description, status, type, features, ideal_for, price, billing_type)
VALUES
  (
    'a1b2c3d4-0001-0000-0000-000000000001',
    'Solo Practitioner',
    'Entry-level platform access for individual business owners. Everything you need to start tracking training and compliance.',
    'active',
    'subscription',
    '["1 admin user", "Basic AI Assistant", "Course delivery (up to 10 students)", "Basic compliance tracking", "Email support"]'::jsonb,
    '["Solo instructors", "Small shop owners", "New apprenticeships"]'::jsonb,
    29,
    'subscription'
  ),
  (
    'a1b2c3d4-0002-0000-0000-000000000002',
    'Business Platform',
    'Full platform access for growing training organizations with advanced features and integrations.',
    'active',
    'subscription',
    '["5 admin users", "AI Tutor & Assistant", "Course delivery (up to 100 students)", "Advanced compliance (WIOA)", "Priority support", "Employer portal access"]'::jsonb,
    '["Growing training providers", "Apprenticeship sponsors", "Career centers"]'::jsonb,
    99,
    'subscription'
  ),
  (
    'a1b2c3d4-0003-0000-0000-000000000003',
    'Professional License',
    'Complete platform with unlimited usage, white-label branding, and dedicated support.',
    'active',
    'subscription',
    '["Unlimited admin users", "AI Tutor & Assistant", "Unlimited students", "Full compliance suite", "Dedicated support", "White-label branding", "API access"]'::jsonb,
    '["Enterprise organizations", "Workforce boards", "State agencies"]'::jsonb,
    299,
    'subscription'
  );

-- Insert pricing for each product
-- Solo Practitioner: $29/month, $290/year
INSERT INTO public.store_prices (product_id, stripe_price_id, interval, amount_cents, trial_period_days, active)
VALUES
  ('a1b2c3d4-0001-0000-0000-000000000001', 'price_solo_monthly', 'month', 2900, 14, true),
  ('a1b2c3d4-0001-0000-0000-000000000001', 'price_solo_annual', 'year', 29000, 14, true);

-- Business Platform: $99/month, $990/year  
INSERT INTO public.store_prices (product_id, stripe_price_id, interval, amount_cents, trial_period_days, active)
VALUES
  ('a1b2c3d4-0002-0000-0000-000000000002', 'price_business_monthly', 'month', 9900, 14, true),
  ('a1b2c3d4-0002-0000-0000-000000000002', 'price_business_annual', 'year', 99000, 14, true);

-- Professional License: $299/month, $2990/year
INSERT INTO public.store_prices (product_id, stripe_price_id, interval, amount_cents, trial_period_days, active)
VALUES
  ('a1b2c3d4-0003-0000-0000-000000000003', 'price_professional_monthly', 'month', 29900, 14, true),
  ('a1b2c3d4-0003-0000-0000-000000000003', 'price_professional_annual', 'year', 299000, 14, true);

-- Verify
SELECT 'Products:' as info, COUNT(*) as count FROM public.store_products;
SELECT 'Prices:' as info, COUNT(*) as count FROM public.store_prices;
SELECT 'Subscription View:' as info, COUNT(*) as count FROM public.store_subscription_pricing;
