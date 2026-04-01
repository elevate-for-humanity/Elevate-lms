-- Fix 53 applications that were auto-approved without funding/payment verification.
--
-- Root cause: insertApplication() called approveApplication() on every submission.
-- approveApplication() returned PAYMENT_NOT_VERIFIED but the caller treated it as
-- non-fatal and returned success:true anyway. Result: status='approved' with no
-- enrollment, no funding_verified, no has_workone_approval.
--
-- The enforce_application_flow trigger blocks approved→submitted.
-- This migration:
--   1. Temporarily allows approved→in_review for admin correction
--   2. Resets the 53 true-limbo records to in_review
--   3. Restores the original trigger constraint
--
-- The 24 approved records that DO have a program_enrollment are left untouched.

-- Step 1: Disable the trigger temporarily (service role only)
ALTER TABLE public.applications DISABLE TRIGGER ALL;

-- Step 2: Reset limbo records — approved with no enrollment and no funding verification
UPDATE public.applications
SET
  status            = 'in_review',
  eligibility_status = 'pending',
  updated_at        = NOW()
WHERE
  status               = 'approved'
  AND funding_verified  = false
  AND has_workone_approval = false
  AND user_id NOT IN (
    SELECT DISTINCT user_id
    FROM public.program_enrollments
    WHERE user_id IS NOT NULL
  );

-- Step 3: Re-enable trigger
ALTER TABLE public.applications ENABLE TRIGGER ALL;

-- Verify
DO $$
DECLARE
  v_reset   INT;
  v_kept    INT;
BEGIN
  SELECT COUNT(*) INTO v_reset
  FROM public.applications
  WHERE status = 'in_review'
    AND eligibility_status = 'pending'
    AND funding_verified = false;

  SELECT COUNT(*) INTO v_kept
  FROM public.applications
  WHERE status = 'approved'
    AND funding_verified = false
    AND has_workone_approval = false;

  RAISE NOTICE 'Reset to in_review: %, Still approved without funding: %', v_reset, v_kept;
END $$;
