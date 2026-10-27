-- Durable, resumable Course Builder execution owned by Dev Studio.
ALTER TABLE public.devstudio_jobs DROP CONSTRAINT IF EXISTS devstudio_jobs_status_check;
ALTER TABLE public.devstudio_jobs
  ADD COLUMN IF NOT EXISTS stage text,
  ADD COLUMN IF NOT EXISTS progress integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS result jsonb,
  ADD COLUMN IF NOT EXISTS error text,
  ADD COLUMN IF NOT EXISTS attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_attempts integer NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS run_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS locked_by text,
  ADD COLUMN IF NOT EXISTS idempotency_key text;

ALTER TABLE public.devstudio_jobs
  ADD CONSTRAINT devstudio_jobs_status_check
  CHECK (status IN ('queued','running','completed','failed','cancelled'));
ALTER TABLE public.devstudio_jobs
  ADD CONSTRAINT devstudio_jobs_progress_check CHECK (progress BETWEEN 0 AND 100);

CREATE UNIQUE INDEX IF NOT EXISTS devstudio_jobs_idempotency_active_idx
  ON public.devstudio_jobs (idempotency_key)
  WHERE idempotency_key IS NOT NULL AND status IN ('queued', 'running');
CREATE INDEX IF NOT EXISTS devstudio_jobs_claim_idx
  ON public.devstudio_jobs (run_at, started_at)
  WHERE status = 'queued';

CREATE OR REPLACE FUNCTION public.claim_devstudio_course_job(p_worker_id text)
RETURNS SETOF public.devstudio_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  SELECT id INTO v_id
  FROM public.devstudio_jobs
  WHERE tool_name = 'build_course'
    AND status = 'queued'
    AND run_at <= now()
  ORDER BY run_at, started_at
  FOR UPDATE SKIP LOCKED
  LIMIT 1;

  IF v_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
  UPDATE public.devstudio_jobs
  SET status = 'running', stage = 'init', progress = GREATEST(progress, 1),
      attempts = attempts + 1, locked_at = now(), locked_by = p_worker_id,
      updated_at = now()
  WHERE id = v_id
  RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_devstudio_course_job(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_devstudio_course_job(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_devstudio_course_job(text) TO service_role;
