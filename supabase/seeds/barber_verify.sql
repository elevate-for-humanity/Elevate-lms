-- Verification queries to run after migration + seed.
-- All 4 must return at least one row before barber paid enrollments go live.

-- 1. Migration applied: confirm new columns exist on program_enrollments
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'program_enrollments'
  AND column_name IN (
    'stripe_customer_id',
    'stripe_subscription_id',
    'barber_sub_id'
  )
ORDER BY column_name;
-- Expected: 3 rows

-- 2. Migration applied: confirm new columns exist on barber_subscriptions
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'barber_subscriptions'
  AND column_name IN (
    'customer_phone', 'full_tuition_amount', 'amount_paid_at_checkout',
    'remaining_balance', 'payment_method', 'bnpl_provider', 'fully_paid',
    'payment_model', 'canceled_at', 'last_payment_date', 'hours_remaining'
  )
ORDER BY column_name;
-- Expected: 11 rows

-- 3. At least one active partner with BARBER program tag
SELECT id, name, status, programs
FROM public.partners
WHERE status = 'active'
  AND programs @> '["BARBER"]'::jsonb;
-- Expected: 1+ rows

-- 4. At least one approved barber shop
SELECT id, name, is_approved
FROM public.barber_shops
WHERE is_approved = true;
-- Expected: 1+ rows

-- 5. /api/partners?program=barber simulation — what the enroll UI will fetch
SELECT id, name, city, state, programs
FROM public.partners
WHERE status = 'active'
  AND programs @> '["BARBER"]'::jsonb
ORDER BY name;
-- Expected: same rows as query 3

-- 6. After a test enrollment: confirm partner_users row created
-- (run after completing a test enrollment)
SELECT pu.id, pu.user_id, pu.partner_id, pu.role, pu.status,
       p.name AS partner_name
FROM public.partner_users pu
JOIN public.partners p ON p.id = pu.partner_id
WHERE pu.role = 'apprentice'
ORDER BY pu.created_at DESC
LIMIT 10;

-- 7. After a test Stripe checkout: confirm program_enrollments row has Stripe data
SELECT id, email, program_slug, payment_status,
       stripe_checkout_session_id, stripe_customer_id, barber_sub_id,
       enrollment_confirmed_at
FROM public.program_enrollments
WHERE program_slug = 'barber-apprenticeship'
ORDER BY created_at DESC
LIMIT 10;
