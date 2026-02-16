-- ============================================================================
-- NORMALIZE ENROLLMENT PAYMENT DATA
-- ============================================================================
-- Clean up existing enrollments to have correct payment status
-- Run this once to normalize data before going live
-- ============================================================================

-- ============================================================================
-- STEP 1: Normalize Funded Programs (No Partner Course)
-- ============================================================================

-- These are WIOA/sponsored programs - should be marked as paid with $0
UPDATE public.enrollments
SET
  payment_mode = 'sponsored',
  payment_status = 'paid',
  amount_paid_cents = 0,
  paid_at = COALESCE(paid_at, NOW()),
  updated_at = NOW()
WHERE partner_course_id IS NULL
  AND (payment_status IS NULL OR payment_status = 'pending');

COMMENT ON COLUMN enrollments.payment_mode IS 'sponsored = funded program, self_pay = student pays';
COMMENT ON COLUMN enrollments.payment_status IS 'pending = awaiting payment, paid = payment complete';

-- ============================================================================
-- STEP 2: Normalize Partner Courses (Self-Pay)
-- ============================================================================

-- Partner courses should be self_pay mode
-- Only update if not already paid
UPDATE public.enrollments
SET
  payment_mode = 'self_pay',
  payment_status = COALESCE(payment_status, 'pending'),
  updated_at = NOW()
WHERE partner_course_id IS NOT NULL
  AND payment_mode IS NULL;

-- ============================================================================
-- STEP 3: Set Amount for Partner Courses
-- ============================================================================

-- Update amount_paid_cents from partner_courses.retail_price_cents
UPDATE public.enrollments e
SET
  amount_paid_cents = pc.retail_price_cents,
  updated_at = NOW()
FROM partner_courses pc
WHERE e.partner_course_id = pc.id
  AND e.amount_paid_cents IS NULL
  AND pc.retail_price_cents IS NOT NULL;

-- ============================================================================
-- STEP 4: Verification Queries
-- ============================================================================

-- Check enrollment payment status distribution
DO $$
DECLARE
  v_total INTEGER;
  v_sponsored INTEGER;
  v_self_pay INTEGER;
  v_paid INTEGER;
  v_pending INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total FROM enrollments;
  SELECT COUNT(*) INTO v_sponsored FROM enrollments WHERE payment_mode = 'sponsored';
  SELECT COUNT(*) INTO v_self_pay FROM enrollments WHERE payment_mode = 'self_pay';
  SELECT COUNT(*) INTO v_paid FROM enrollments WHERE payment_status = 'paid';
  SELECT COUNT(*) INTO v_pending FROM enrollments WHERE payment_status = 'pending';
  
  RAISE NOTICE '=== Enrollment Payment Status ===';
  RAISE NOTICE 'Total enrollments: %', v_total;
  RAISE NOTICE 'Sponsored (funded): %', v_sponsored;
  RAISE NOTICE 'Self-pay (partner): %', v_self_pay;
  RAISE NOTICE 'Paid: %', v_paid;
  RAISE NOTICE 'Pending: %', v_pending;
END $$;

-- ============================================================================
-- STEP 5: Create Helper View
-- ============================================================================

CREATE OR REPLACE VIEW enrollment_payment_summary AS
SELECT 
  e.id,
  e.user_id,
  e.program_id,
  e.partner_course_id,
  e.status as enrollment_status,
  e.payment_mode,
  e.payment_status,
  e.amount_paid_cents,
  e.billing_lock,
  e.paid_at,
  CASE 
    WHEN e.partner_course_id IS NULL THEN 'Funded Program'
    ELSE 'Partner Course'
  END as enrollment_type,
  CASE 
    WHEN e.payment_mode = 'sponsored' THEN 'No payment required'
    WHEN e.payment_status = 'paid' THEN 'Payment complete'
    WHEN e.payment_status = 'pending' THEN 'Awaiting payment'
    ELSE 'Unknown'
  END as payment_description,
  p.name as program_name,
  pc.course_name as partner_course_name
FROM enrollments e
LEFT JOIN programs p ON p.id = e.program_id
LEFT JOIN partner_courses pc ON pc.id = e.partner_course_id;

COMMENT ON VIEW enrollment_payment_summary IS 'Human-readable enrollment payment status';

GRANT SELECT ON enrollment_payment_summary TO authenticated;

-- ============================================================================
-- DONE
-- ============================================================================

-- Verify results
SELECT 
  payment_mode,
  payment_status,
  COUNT(*) as count,
  SUM(amount_paid_cents) / 100.0 as total_revenue
FROM enrollments
GROUP BY payment_mode, payment_status
ORDER BY payment_mode, payment_status;
