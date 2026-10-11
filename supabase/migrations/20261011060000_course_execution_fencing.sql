-- Course Builder execution fencing.
--
-- This migration introduces an independent execution
-- generation counter and an auditable attempt history.
--
-- Existing job records and lesson artifacts are preserved.

BEGIN;

ALTER TABLE public.ultimate_build_jobs
ADD COLUMN IF NOT EXISTS execution_generation bigint
NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.ultimate_job_attempt_history (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    job_id uuid NOT NULL
      REFERENCES public.ultimate_build_jobs(id)
      ON DELETE RESTRICT,

    execution_generation bigint NOT NULL,

    worker_id text,

    event_type text NOT NULL,

    event_time timestamptz NOT NULL DEFAULT now(),

    details jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS
ultimate_job_attempt_history_job_idx
ON public.ultimate_job_attempt_history
(job_id, event_time DESC);

CREATE OR REPLACE FUNCTION public.assert_ultimate_job_fence(
    p_job uuid,
    p_worker text,
    p_generation bigint
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    v_valid boolean;
BEGIN

    SELECT EXISTS (
        SELECT 1
        FROM public.ultimate_build_jobs j
        WHERE j.id = p_job
          AND j.lease_owner = p_worker
          AND j.execution_generation = p_generation
          AND j.status = 'running'
          AND j.lease_expires_at > now()
    )
    INTO v_valid;

    RETURN v_valid;

END;
$$;

REVOKE ALL
ON FUNCTION public.assert_ultimate_job_fence(
    uuid,text,bigint
)
FROM PUBLIC;

COMMIT;
