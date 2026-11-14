-- A crashed worker must not strand a canonical course build indefinitely.
CREATE OR REPLACE FUNCTION public.claim_devstudio_course_job(p_worker_id text)
RETURNS SETOF public.devstudio_jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_id uuid;
BEGIN
  UPDATE public.devstudio_jobs
  SET status = CASE WHEN attempts < max_attempts THEN 'queued' ELSE 'failed' END,
      stage = 'error',
      error = 'Worker lease expired before completion',
      run_at = now(),
      finished_at = CASE WHEN attempts < max_attempts THEN NULL ELSE now() END,
      locked_at = NULL,
      locked_by = NULL,
      updated_at = now()
  WHERE tool_name = 'build_course'
    AND status = 'running'
    AND locked_at < now() - interval '20 minutes';

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
      error = NULL, updated_at = now()
  WHERE id = v_id
  RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_devstudio_course_job(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_devstudio_course_job(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_devstudio_course_job(text) TO service_role;
