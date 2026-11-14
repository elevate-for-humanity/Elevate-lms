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

    job_id uuid NOT NULL REFERENCES public.ultimate_build_jobs(id) ON DELETE RESTRICT,

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

-- Increment the generation atomically whenever the canonical claim RPC assigns
-- a worker. Preserve priority, archived-course exclusion and retry guards.
CREATE OR REPLACE FUNCTION public.claim_ultimate_build_job(
  p_worker text, p_lease_seconds integer DEFAULT 300
)
RETURNS SETOF public.ultimate_build_jobs
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $claim$
DECLARE v_id uuid;
BEGIN
  IF nullif(btrim(p_worker), '') IS NULL OR p_lease_seconds NOT BETWEEN 30 AND 900 THEN
    RAISE EXCEPTION 'invalid worker lease request';
  END IF;

  UPDATE public.ultimate_build_jobs
  SET status='queued', lease_owner=NULL, lease_expires_at=NULL, updated_at=now()
  WHERE status='running' AND lease_expires_at < now() AND attempts < max_attempts;

  UPDATE public.ultimate_build_jobs
  SET status='failed', last_error=coalesce(last_error,'lease expired after retry limit'),
      updated_at=now()
  WHERE status='running' AND lease_expires_at < now() AND attempts >= max_attempts;

  SELECT j.id INTO v_id
  FROM public.ultimate_build_jobs j
  JOIN public.ultimate_course_builds b ON b.id=j.build_id
  JOIN public.courses c ON c.id=b.course_id
  WHERE j.status='queued' AND j.available_at<=now()
    AND j.attempts<j.max_attempts AND c.status <> 'archived'::public.course_status
  ORDER BY j.priority ASC,j.available_at ASC,j.created_at ASC
  FOR UPDATE OF j SKIP LOCKED LIMIT 1;

  IF v_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
  WITH claimed AS (
    UPDATE public.ultimate_build_jobs j
    SET status='running', attempts=j.attempts+1,
        execution_generation=j.execution_generation+1,
        lease_owner=p_worker, heartbeat_at=now(),
        lease_expires_at=now()+make_interval(secs=>p_lease_seconds),
        updated_at=now()
    WHERE j.id=v_id RETURNING j.*
  ), recorded AS (
    INSERT INTO public.ultimate_job_attempt_history
      (job_id,execution_generation,worker_id,event_type)
    SELECT id,execution_generation,p_worker,'claimed' FROM claimed
    RETURNING job_id
  )
  SELECT claimed.* FROM claimed JOIN recorded ON recorded.job_id=claimed.id;
END
$claim$;

-- Expired leases cannot be renewed, even by their previous owner.
CREATE OR REPLACE FUNCTION public.heartbeat_ultimate_build_job(
  p_job uuid,p_worker text,p_lease_seconds integer DEFAULT 300
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $heartbeat$
BEGIN
  IF p_lease_seconds NOT BETWEEN 30 AND 900 THEN
    RAISE EXCEPTION 'invalid worker lease request';
  END IF;
  UPDATE public.ultimate_build_jobs
  SET heartbeat_at=now(),
      lease_expires_at=now()+make_interval(secs=>p_lease_seconds),
      updated_at=now()
  WHERE id=p_job AND status='running' AND lease_owner=p_worker
    AND lease_expires_at>now();
  RETURN FOUND;
END
$heartbeat$;

REVOKE ALL
ON FUNCTION public.assert_ultimate_job_fence(
    uuid,text,bigint
)
FROM PUBLIC;

COMMIT;
