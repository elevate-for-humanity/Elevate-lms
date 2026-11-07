-- Supersedes historical infinity-based availability scheduling. A due timestamp
-- is NOT permission to skip the canonical lesson dependency/lease predicate.
-- This matches the already-applied production normalization function/trigger.
CREATE OR REPLACE FUNCTION public.normalize_ultimate_job_availability()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF NEW.status = 'queued'
     AND (NEW.available_at IS NULL OR NEW.available_at = 'infinity'::timestamptz) THEN
    NEW.available_at := clock_timestamp();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS normalize_ultimate_job_availability ON public.ultimate_build_jobs;
CREATE TRIGGER normalize_ultimate_job_availability
BEFORE INSERT OR UPDATE OF status, available_at ON public.ultimate_build_jobs
FOR EACH ROW EXECUTE FUNCTION public.normalize_ultimate_job_availability();

UPDATE public.ultimate_build_jobs
SET available_at = clock_timestamp(), updated_at = clock_timestamp()
WHERE status = 'queued'
  AND (available_at IS NULL OR available_at = 'infinity'::timestamptz)
  AND lease_owner IS NULL
  AND (lease_expires_at IS NULL OR lease_expires_at < clock_timestamp())
  AND external_execution_id IS NULL;
