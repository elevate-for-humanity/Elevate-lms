-- A job whose retry budget is exhausted must never remain claimable-looking
-- 'queued'. claim_ultimate_course_role_job requires attempts < max_attempts, so
-- a 'queued' row with attempts >= max_attempts can never be claimed. It is also
-- not 'failed', so the recovery scan (status=eq.failed) never sees it. The whole
-- course then stalls at zero runnable stages because every dependency chain ends
-- at an unrecoverable row.
--
-- Enforce the invariant at the data layer so no writer (requeueForRepair, a
-- lease-expiry sweep, or any future code path) can recreate the stranded state:
-- a non-claimed job whose budget is exhausted is normalized to 'failed'.
CREATE OR REPLACE FUNCTION public.normalize_ultimate_job_exhausted_budget()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.status = 'queued'
     AND NEW.lease_owner IS NULL
     AND NEW.lease_expires_at IS NULL
     AND NEW.attempts IS NOT NULL
     AND NEW.max_attempts IS NOT NULL
     AND NEW.max_attempts >= 1
     AND NEW.attempts >= NEW.max_attempts THEN
    NEW.status := 'failed';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_ultimate_job_exhausted_budget ON public.ultimate_build_jobs;
CREATE TRIGGER normalize_ultimate_job_exhausted_budget
BEFORE INSERT OR UPDATE OF status, attempts, max_attempts, lease_owner, lease_expires_at
ON public.ultimate_build_jobs
FOR EACH ROW EXECUTE FUNCTION public.normalize_ultimate_job_exhausted_budget();

-- Repair any rows already stranded before the trigger existed, so the recovery
-- scan can resume them from their saved cursor.
UPDATE public.ultimate_build_jobs
SET status = 'failed', updated_at = clock_timestamp()
WHERE status = 'queued'
  AND attempts >= max_attempts
  AND lease_owner IS NULL
  AND lease_expires_at IS NULL;
