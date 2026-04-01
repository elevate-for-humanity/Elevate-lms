-- Fix 53 applications auto-approved without funding/payment verification.
--
-- Root cause: insertApplication() called approveApplication() on every submission.
-- approveApplication() returned PAYMENT_NOT_VERIFIED but the caller treated it as
-- non-fatal and returned success:true. Result: status='approved' with no enrollment,
-- no funding_verified, no has_workone_approval.
--
-- Strategy: patch enforce_application_flow to allow approved→in_review as a valid
-- admin correction transition, then reset the 53 records.

-- Step 1: Add approved→in_review to the trigger function
CREATE OR REPLACE FUNCTION enforce_application_flow()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS NULL OR OLD.status = '' THEN RETURN NEW; END IF;
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  -- Forward path
  IF (OLD.status = 'submitted'       AND NEW.status = 'in_review')       THEN RETURN NEW; END IF;
  IF (OLD.status = 'in_review'       AND NEW.status = 'approved')        THEN RETURN NEW; END IF;
  IF (OLD.status = 'approved'        AND NEW.status = 'ready_to_enroll') THEN RETURN NEW; END IF;
  IF (OLD.status = 'ready_to_enroll' AND NEW.status = 'enrolled')        THEN RETURN NEW; END IF;

  -- Rejection from any active state
  IF OLD.status IN ('submitted','in_review','approved','ready_to_enroll')
     AND NEW.status = 'rejected' THEN RETURN NEW; END IF;

  -- Admin correction: re-queue approved record for review
  IF OLD.status = 'approved' AND NEW.status = 'in_review' THEN RETURN NEW; END IF;

  -- Supplemental statuses
  IF OLD.status = 'submitted' AND NEW.status IN ('pending_workone','waitlisted') THEN RETURN NEW; END IF;
  IF OLD.status IN ('pending_workone','waitlisted') AND NEW.status IN ('in_review','rejected') THEN RETURN NEW; END IF;

  RAISE EXCEPTION 'Invalid transition: % -> %. Must be ready_to_enroll or rejected.', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Reset limbo records
UPDATE public.applications
SET
  status             = 'in_review',
  eligibility_status = 'pending',
  updated_at         = NOW()
WHERE
  status                = 'approved'
  AND funding_verified  = false
  AND has_workone_approval = false
  AND user_id NOT IN (
    SELECT DISTINCT user_id
    FROM public.program_enrollments
    WHERE user_id IS NOT NULL
  );

-- Verify
SELECT
  COUNT(*) FILTER (WHERE status = 'in_review' AND funding_verified = false)                                  AS reset_to_in_review,
  COUNT(*) FILTER (WHERE status = 'approved'  AND funding_verified = false AND has_workone_approval = false) AS still_limbo
FROM public.applications;

-- Addendum: fix 8 records where user_id IS NULL.
-- NULL NOT IN (subquery) evaluates to NULL (not TRUE) in SQL,
-- so the original UPDATE above skipped them.
UPDATE public.applications
SET
  status             = 'in_review',
  eligibility_status = 'pending',
  updated_at         = NOW()
WHERE
  status                = 'approved'
  AND funding_verified  = false
  AND has_workone_approval = false
  AND user_id IS NULL;
