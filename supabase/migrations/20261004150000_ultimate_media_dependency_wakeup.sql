-- Retain media arrivals while the existing job holds its lease. The worker's
-- stale payload cannot overwrite a wakeup when it yields, fails or completes.
ALTER TABLE public.ultimate_build_jobs ADD COLUMN IF NOT EXISTS pending_dependency_resume jsonb;

CREATE OR REPLACE FUNCTION public.consume_ultimate_media_wakeup()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
  IF OLD.pending_dependency_resume IS NOT NULL AND NEW.status <> 'running' THEN
    IF EXISTS(SELECT 1 FROM public.ultimate_course_builds WHERE id=NEW.build_id AND status='published') THEN
      NEW.pending_dependency_resume := NULL;
      NEW.status := 'completed';
      NEW.lease_owner := NULL;
      NEW.lease_expires_at := NULL;
      NEW.last_error := NULL;
      RETURN NEW;
    END IF;
    NEW.status := 'queued';
    NEW.payload := OLD.pending_dependency_resume;
    NEW.pending_dependency_resume := NULL;
    NEW.attempts := 0;
    NEW.available_at := now();
    NEW.lease_owner := NULL;
    NEW.lease_expires_at := NULL;
    NEW.last_error := NULL;
    UPDATE public.ultimate_course_builds SET status='queued',updated_at=now() WHERE id=NEW.build_id;
  ELSIF NEW.status='failed' AND OLD.status <> 'failed' THEN
    UPDATE public.ultimate_course_builds SET status='blocked',current_step='selective_repair',updated_at=now() WHERE id=NEW.build_id AND status <> 'published';
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS consume_ultimate_media_wakeup ON public.ultimate_build_jobs;
CREATE TRIGGER consume_ultimate_media_wakeup BEFORE UPDATE ON public.ultimate_build_jobs
FOR EACH ROW EXECUTE FUNCTION public.consume_ultimate_media_wakeup();

CREATE OR REPLACE FUNCTION public.wake_ultimate_media_dependency(p_build uuid,p_payload jsonb)
RETURNS SETOF public.ultimate_build_jobs
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE current_job public.ultimate_build_jobs; wakeup jsonb; scope_payload jsonb;
BEGIN
  -- Serialize arrivals even when no active row exists yet.
  PERFORM pg_advisory_xact_lock(hashtextextended(p_build::text, 412));
  SELECT * INTO current_job FROM public.ultimate_build_jobs
  WHERE build_id=p_build AND job_type='course_build' AND status IN ('queued','running') FOR UPDATE;
  scope_payload := current_job.payload;
  IF current_job.id IS NULL THEN
    -- A failed/completed targeted acceptance remains targeted when its media
    -- arrives later. Only a newer explicit course job may supersede that scope.
    SELECT payload INTO scope_payload FROM public.ultimate_build_jobs
    WHERE build_id=p_build AND job_type='course_build' AND status IN ('failed','completed')
    ORDER BY created_at DESC,updated_at DESC,id DESC LIMIT 1;
  END IF;
  -- Match the transition trigger's job -> build lock order.
  PERFORM 1 FROM public.ultimate_course_builds WHERE id=p_build FOR UPDATE;
  IF EXISTS(SELECT 1 FROM public.ultimate_course_builds WHERE id=p_build AND status='published') THEN
    RETURN; -- Already published, even if its worker is finishing the lease.
  END IF;
  wakeup := jsonb_strip_nulls(jsonb_build_object('acceptance',scope_payload->'acceptance',
    'competencyId',scope_payload->'competencyId','lessonBuildId',scope_payload->'lessonBuildId')) || jsonb_build_object('dependencyResume','licensed_media_attached',
    'lessonIds',(SELECT coalesce(jsonb_agg(DISTINCT item),'[]'::jsonb) FROM jsonb_array_elements(coalesce(current_job.pending_dependency_resume->'lessonIds','[]'::jsonb)||coalesce(current_job.payload->'lessonIds','[]'::jsonb)||coalesce(p_payload->'lessonIds','[]'::jsonb)) item),
    'assetIds',(SELECT coalesce(jsonb_agg(DISTINCT item),'[]'::jsonb) FROM jsonb_array_elements(coalesce(current_job.pending_dependency_resume->'assetIds','[]'::jsonb)||coalesce(current_job.payload->'assetIds','[]'::jsonb)||coalesce(p_payload->'assetIds','[]'::jsonb)) item));
  IF current_job.id IS NULL THEN
    INSERT INTO public.ultimate_build_jobs(build_id,job_type,status,payload)
    VALUES(p_build,'course_build','queued',wakeup)
    ON CONFLICT (build_id,job_type) WHERE status IN ('queued','running')
    DO UPDATE SET pending_dependency_resume=CASE WHEN ultimate_build_jobs.status='running' THEN (wakeup - 'acceptance' - 'competencyId' - 'lessonBuildId') || jsonb_strip_nulls(jsonb_build_object('acceptance',ultimate_build_jobs.payload->'acceptance','competencyId',ultimate_build_jobs.payload->'competencyId','lessonBuildId',ultimate_build_jobs.payload->'lessonBuildId')) ELSE NULL END,
      payload=CASE WHEN ultimate_build_jobs.status='queued' THEN (wakeup - 'acceptance' - 'competencyId' - 'lessonBuildId') || jsonb_strip_nulls(jsonb_build_object('acceptance',ultimate_build_jobs.payload->'acceptance','competencyId',ultimate_build_jobs.payload->'competencyId','lessonBuildId',ultimate_build_jobs.payload->'lessonBuildId')) ELSE ultimate_build_jobs.payload END,
      attempts=CASE WHEN ultimate_build_jobs.status='queued' THEN 0 ELSE ultimate_build_jobs.attempts END,available_at=now(),updated_at=now()
    RETURNING * INTO current_job;
  ELSIF current_job.status='running' THEN
    UPDATE public.ultimate_build_jobs SET pending_dependency_resume=wakeup,updated_at=now()
    WHERE id=current_job.id RETURNING * INTO current_job;
  ELSE
    UPDATE public.ultimate_build_jobs SET payload=wakeup,attempts=0,available_at=now(),last_error=NULL,updated_at=now()
    WHERE id=current_job.id RETURNING * INTO current_job;
  END IF;
  IF current_job.status='queued' THEN
    UPDATE public.ultimate_course_builds SET status='queued',updated_at=now() WHERE id=p_build;
  END IF;
  RETURN NEXT current_job;
END $$;
REVOKE ALL ON FUNCTION public.wake_ultimate_media_dependency(uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.wake_ultimate_media_dependency(uuid,jsonb) TO service_role;

-- Read-only deployment prerequisite: no fake job or production mutation probe.
CREATE OR REPLACE FUNCTION public.ultimate_media_wakeup_ready()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='' AS $$
  SELECT EXISTS(SELECT 1 FROM pg_catalog.pg_attribute WHERE attrelid='public.ultimate_build_jobs'::regclass AND attname='pending_dependency_resume' AND NOT attisdropped)
    AND pg_catalog.to_regprocedure('public.wake_ultimate_media_dependency(uuid,jsonb)') IS NOT NULL
    AND EXISTS(SELECT 1 FROM pg_catalog.pg_trigger WHERE tgrelid='public.ultimate_build_jobs'::regclass AND tgname='consume_ultimate_media_wakeup' AND tgenabled IN ('O','A'));
$$;
REVOKE ALL ON FUNCTION public.ultimate_media_wakeup_ready() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ultimate_media_wakeup_ready() TO service_role;
