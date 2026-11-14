CREATE TABLE IF NOT EXISTS public.ultimate_build_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  build_id uuid NOT NULL REFERENCES public.ultimate_course_builds(id) ON DELETE CASCADE,
  job_type text NOT NULL DEFAULT 'course_build',
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','completed','failed')),
  priority integer NOT NULL DEFAULT 100,
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 5,
  lease_owner text,
  lease_expires_at timestamptz,
  heartbeat_at timestamptz,
  available_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS ultimate_build_jobs_active_build_idx ON public.ultimate_build_jobs(build_id,job_type) WHERE status IN ('queued','running');
CREATE INDEX IF NOT EXISTS ultimate_build_jobs_claim_idx ON public.ultimate_build_jobs(status,available_at,priority,created_at);
ALTER TABLE public.ultimate_build_jobs ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.claim_ultimate_build_job(p_worker text,p_lease_seconds integer DEFAULT 300)
RETURNS SETOF public.ultimate_build_jobs
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_id uuid;
BEGIN
  UPDATE public.ultimate_build_jobs
  SET status='queued',lease_owner=null,lease_expires_at=null,updated_at=now()
  WHERE status='running' AND lease_expires_at < now() AND attempts < max_attempts;
  UPDATE public.ultimate_build_jobs
  SET status='failed',last_error=coalesce(last_error,'lease expired after retry limit'),updated_at=now()
  WHERE status='running' AND lease_expires_at < now() AND attempts >= max_attempts;
  SELECT id INTO v_id FROM public.ultimate_build_jobs
  WHERE status='queued' AND available_at<=now() AND attempts<max_attempts
  ORDER BY priority ASC,created_at ASC FOR UPDATE SKIP LOCKED LIMIT 1;
  IF v_id IS NULL THEN RETURN; END IF;
  RETURN QUERY UPDATE public.ultimate_build_jobs SET status='running',attempts=attempts+1,lease_owner=p_worker,heartbeat_at=now(),lease_expires_at=now()+make_interval(secs=>p_lease_seconds),updated_at=now() WHERE id=v_id RETURNING *;
END $$;

CREATE OR REPLACE FUNCTION public.heartbeat_ultimate_build_job(p_job uuid,p_worker text,p_lease_seconds integer DEFAULT 300)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  UPDATE public.ultimate_build_jobs SET heartbeat_at=now(),lease_expires_at=now()+make_interval(secs=>p_lease_seconds),updated_at=now() WHERE id=p_job AND status='running' AND lease_owner=p_worker;
  RETURN FOUND;
END $$;