-- Normalize application status values and apply check constraints.
--
-- The enforce_application_flow trigger used legacy values:
--   in_review       (renamed to under_review)
--   ready_to_enroll (collapsed into approved)
--   enrolled        (collapsed into approved — enrollment tracked in program_enrollments)
--
-- Steps:
--   1. Replace trigger to accept canonical values (and legacy->canonical transitions)
--   2. Backfill legacy status values
--   3. Apply status + eligibility_status check constraints

-- 1. Replace enforce_application_flow trigger
CREATE OR REPLACE FUNCTION enforce_application_flow()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS NULL OR OLD.status = '' THEN RETURN NEW; END IF;
  IF OLD.status = NEW.status THEN RETURN NEW; END IF;

  -- Canonical forward path
  IF (OLD.status = 'submitted'       AND NEW.status IN ('under_review','funding_review','pending_workone')) THEN RETURN NEW; END IF;
  IF (OLD.status = 'under_review'    AND NEW.status IN ('approved','funding_review','rejected'))            THEN RETURN NEW; END IF;
  IF (OLD.status = 'funding_review'  AND NEW.status IN ('approved','under_review','rejected'))              THEN RETURN NEW; END IF;
  IF (OLD.status = 'pending_workone' AND NEW.status IN ('under_review','approved','rejected'))              THEN RETURN NEW; END IF;
  IF (OLD.status = 'approved'        AND NEW.status IN ('withdrawn','rejected','under_review'))             THEN RETURN NEW; END IF;

  -- Legacy forward path (rows not yet backfilled)
  IF (OLD.status = 'submitted'       AND NEW.status = 'in_review')                                THEN RETURN NEW; END IF;
  IF (OLD.status = 'in_review'       AND NEW.status IN ('approved','under_review','rejected'))     THEN RETURN NEW; END IF;
  IF (OLD.status = 'approved'        AND NEW.status = 'ready_to_enroll')                          THEN RETURN NEW; END IF;
  IF (OLD.status = 'ready_to_enroll' AND NEW.status = 'enrolled')                                 THEN RETURN NEW; END IF;

  -- Legacy -> canonical migration transitions
  IF (OLD.status = 'in_review'       AND NEW.status = 'under_review') THEN RETURN NEW; END IF;
  IF (OLD.status = 'ready_to_enroll' AND NEW.status = 'approved')     THEN RETURN NEW; END IF;
  IF (OLD.status = 'enrolled'        AND NEW.status = 'approved')     THEN RETURN NEW; END IF;

  -- Rejection / withdrawal from any active state
  IF NEW.status IN ('rejected','withdrawn') THEN RETURN NEW; END IF;

  -- Supplemental
  IF OLD.status IN ('pending_workone','waitlisted') AND NEW.status IN ('under_review','in_review','rejected') THEN RETURN NEW; END IF;

  RAISE EXCEPTION 'Invalid transition: % -> %. See enforce_application_flow trigger.', OLD.status, NEW.status;
END;
$$ LANGUAGE plpgsql;

-- 2. Backfill legacy status values
UPDATE public.applications SET status = 'under_review', updated_at = now() WHERE status = 'in_review';
UPDATE public.applications SET status = 'approved', updated_at = now() WHERE status IN ('ready_to_enroll', 'enrolled');

-- 3. Apply status check constraint
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_status_check;
ALTER TABLE public.applications ADD CONSTRAINT applications_status_check
  CHECK (status IN ('submitted','pending_workone','funding_review','under_review','approved','rejected','withdrawn'));

-- 4. Apply eligibility_status check constraint
ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_eligibility_status_check;
ALTER TABLE public.applications ADD CONSTRAINT applications_eligibility_status_check
  CHECK (eligibility_status IN ('pending','pending_workone','funding_review','verified','denied'));
