-- License Integrity Audit Query
-- Run this periodically to find inconsistent license states
-- 
-- Subscription tiers MUST have:
--   - stripe_subscription_id
--   - current_period_end
--
-- If these are missing, the license will be DENIED access (fail closed)

-- Find active subscription licenses missing required Stripe fields
SELECT
  id,
  tier,
  status,
  expires_at,
  stripe_subscription_id,
  current_period_end,
  stripe_customer_id,
  updated_at,
  CASE 
    WHEN stripe_subscription_id IS NULL THEN 'MISSING: stripe_subscription_id'
    WHEN current_period_end IS NULL THEN 'MISSING: current_period_end'
    ELSE 'OK'
  END as issue
FROM licenses
WHERE
  status = 'active'
  AND (
    -- Subscription-ish tier names (adjust to match your naming convention)
    tier ILIKE '%monthly%' 
    OR tier ILIKE '%annual%' 
    OR tier ILIKE '%subscription%'
    OR tier IN ('managed_monthly', 'managed_annual', 'pro_monthly', 'pro_annual', 
                'professional_monthly', 'professional_annual', 'enterprise_monthly', 
                'enterprise_annual', 'org_monthly', 'org_annual', 'team_monthly', 'team_annual')
  )
  AND (
    stripe_subscription_id IS NULL 
    OR current_period_end IS NULL
  )
ORDER BY updated_at DESC;

-- Find DB-authoritative licenses that might grant perpetual access unintentionally
SELECT
  id,
  tier,
  status,
  expires_at,
  stripe_subscription_id,
  current_period_end,
  updated_at,
  'WARNING: Has subscription_id but no expires_at - may grant perpetual access' as issue
FROM licenses
WHERE
  status = 'active'
  AND tier NOT ILIKE '%monthly%'
  AND tier NOT ILIKE '%annual%'
  AND tier NOT ILIKE '%subscription%'
  AND stripe_subscription_id IS NOT NULL
  AND expires_at IS NULL
ORDER BY updated_at DESC;

-- Summary counts by tier and billing authority
SELECT
  tier,
  CASE 
    WHEN tier ILIKE '%monthly%' OR tier ILIKE '%annual%' OR tier ILIKE '%subscription%'
    THEN 'stripe'
    ELSE 'database'
  END as billing_authority,
  status,
  COUNT(*) as count,
  SUM(CASE WHEN stripe_subscription_id IS NOT NULL THEN 1 ELSE 0 END) as has_subscription_id,
  SUM(CASE WHEN current_period_end IS NOT NULL THEN 1 ELSE 0 END) as has_current_period_end,
  SUM(CASE WHEN expires_at IS NOT NULL THEN 1 ELSE 0 END) as has_expires_at
FROM licenses
GROUP BY tier, status
ORDER BY tier, status;
