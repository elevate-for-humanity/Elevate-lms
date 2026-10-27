-- The failure hook and all synthetic data exist only in this rolled-back test.
BEGIN;
CREATE TEMP TABLE qa_enqueue_scope(ignored boolean) ON COMMIT DROP;
CREATE FUNCTION pg_temp.reject_qa_build_queue() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.profile->>'qaAtomicEnqueueReject'='true' AND NEW.status='queued' THEN
    RAISE EXCEPTION 'QA_BUILD_AGGREGATE_REJECTED';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER qa_atomic_enqueue_failure BEFORE UPDATE OF status ON public.ultimate_course_builds
  FOR EACH ROW EXECUTE FUNCTION pg_temp.reject_qa_build_queue();
DO $$
DECLARE v_course uuid; v_build uuid; v_job public.ultimate_build_jobs%ROWTYPE; v_again uuid;
BEGIN
  IF EXISTS(SELECT 1 FROM public.courses WHERE slug='qa-atomic-enqueue-transaction-test') THEN
    RAISE EXCEPTION 'QA enqueue slug already exists';
  END IF;
  INSERT INTO public.courses(slug,title,status,is_active,compliance_profile_key)
    VALUES('qa-atomic-enqueue-transaction-test','Rollback-only enqueue regression','draft',false,'internal_basic') RETURNING id INTO v_course;
  INSERT INTO public.ultimate_course_builds(course_id,profile,status)
    VALUES(v_course,'{"qaAtomicEnqueueReject":true,"competencies":[]}'::jsonb,'initializing') RETURNING id INTO v_build;
  BEGIN
    PERFORM public.enqueue_ultimate_build_job(v_build,'{"nextCompetencyIndex":7}'::jsonb,'{"enabled":true}'::jsonb);
    RAISE EXCEPTION 'Expected aggregate update to fail';
  EXCEPTION WHEN raise_exception THEN
    IF SQLERRM<>'QA_BUILD_AGGREGATE_REJECTED' THEN RAISE; END IF;
  END;
  IF EXISTS(SELECT 1 FROM public.ultimate_build_jobs WHERE build_id=v_build) OR
     (SELECT status FROM public.ultimate_course_builds WHERE id=v_build) IS DISTINCT FROM 'initializing' THEN
    RAISE EXCEPTION 'ENQUEUE_ATOMICITY_REGRESSION: orphaned queue row or partial aggregate update';
  END IF;
  UPDATE public.ultimate_course_builds SET profile=profile-'qaAtomicEnqueueReject' WHERE id=v_build;
  SELECT * INTO v_job FROM public.enqueue_ultimate_build_job(v_build,
    '{"nextCompetencyIndex":7,"pendingCheckpointRepairs":{"lesson":{"fromStep":"natural_narration"}}}'::jsonb,
    '{"enabled":true,"recoveries":2}'::jsonb);
  IF v_job.status IS DISTINCT FROM 'queued' OR v_job.payload->>'nextCompetencyIndex' IS DISTINCT FROM '7' OR
     (SELECT status FROM public.ultimate_course_builds WHERE id=v_build) IS DISTINCT FROM 'queued' THEN
    RAISE EXCEPTION 'ENQUEUE_STATUS_REGRESSION: job and aggregate were not written together';
  END IF;
  SELECT id INTO v_again FROM public.enqueue_ultimate_build_job(v_build,'{"nextCompetencyIndex":0}'::jsonb,'{"enabled":false}'::jsonb);
  IF v_again IS DISTINCT FROM v_job.id OR
     (SELECT count(*) FROM public.ultimate_build_jobs WHERE build_id=v_build)<>1 OR
     (SELECT payload FROM public.ultimate_build_jobs WHERE id=v_again) IS DISTINCT FROM v_job.payload OR
     (SELECT monitor FROM public.ultimate_build_jobs WHERE id=v_again) IS DISTINCT FROM v_job.monitor THEN
    RAISE EXCEPTION 'ENQUEUE_IDEMPOTENCY_REGRESSION: duplicate work or lost checkpoint/monitor state';
  END IF;
  IF has_function_privilege('anon','public.enqueue_ultimate_build_job(uuid,jsonb,jsonb)','EXECUTE') OR
     has_function_privilege('authenticated','public.enqueue_ultimate_build_job(uuid,jsonb,jsonb)','EXECUTE') THEN
    RAISE EXCEPTION 'ENQUEUE_AUTHORIZATION_REGRESSION: browser role can enqueue privileged jobs';
  END IF;
END $$;
ROLLBACK;
SELECT NOT EXISTS(SELECT 1 FROM public.courses WHERE slug='qa-atomic-enqueue-transaction-test') AS test_fixtures_removed;
