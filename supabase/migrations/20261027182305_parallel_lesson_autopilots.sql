-- Three durable roles per lesson. The existing course_build uniqueness remains
-- intact: scoped role job types allow independent lessons and programs.
SET LOCAL lock_timeout = '5s';

CREATE OR REPLACE FUNCTION public.ultimate_fenced_artifact_version(p_job uuid,p_worker text,p_generation bigint,p_input jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE j public.ultimate_build_jobs%ROWTYPE; a public.ultimate_artifacts%ROWTYPE;
 previous public.ultimate_artifact_versions%ROWTYPE; v public.ultimate_artifact_versions%ROWTYPE; lesson uuid; dependency text;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'ULTIMATE_FENCE_SERVICE_ROLE_REQUIRED'; END IF;
 SELECT * INTO j FROM public.ultimate_build_jobs WHERE id=p_job FOR UPDATE;
 IF NOT FOUND OR j.status<>'running' OR j.lease_owner IS DISTINCT FROM p_worker OR j.execution_generation IS DISTINCT FROM p_generation OR
   j.lease_expires_at IS NULL OR j.lease_expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'ULTIMATE_JOB_LEASE_LOST'; END IF;
 lesson:=(p_input->>'lessonBuildId')::uuid;
 IF (p_input->>'buildId')::uuid IS DISTINCT FROM j.build_id OR lesson IS NULL OR
   NOT EXISTS(SELECT 1 FROM public.ultimate_lesson_builds WHERE id=lesson AND build_id=j.build_id) OR
   p_input->>'logicalKey' IS DISTINCT FROM 'lesson:'||lesson::text||':stage:'||(p_input->>'stage')
 THEN RAISE EXCEPTION 'ULTIMATE_FENCE_LESSON_MISMATCH'; END IF;
 PERFORM public.ultimate_assert_autopilot_scope(j.id,lesson);
 INSERT INTO public.ultimate_artifacts(build_id,lesson_build_id,stage,artifact_type,logical_key)
 VALUES(j.build_id,lesson,p_input->>'stage',p_input->>'artifactType',p_input->>'logicalKey')
 ON CONFLICT(build_id,logical_key) DO NOTHING;
 SELECT * INTO a FROM public.ultimate_artifacts WHERE build_id=j.build_id AND logical_key=p_input->>'logicalKey' FOR UPDATE;
 IF a.lesson_build_id IS DISTINCT FROM lesson THEN RAISE EXCEPTION 'ULTIMATE_AUTOPILOT_CROSS_LESSON_WRITE'; END IF;
 SELECT * INTO previous FROM public.ultimate_artifact_versions WHERE artifact_id=a.id ORDER BY version DESC LIMIT 1;
 IF previous.locked THEN RAISE EXCEPTION 'ULTIMATE_ARTIFACT_LOCKED'; END IF;
 INSERT INTO public.ultimate_artifact_versions(artifact_id,version,parent_version_id,content,storage_ref,provenance,change_reason,generated_by)
 VALUES(a.id,coalesce(previous.version,0)+1,previous.id,p_input->'content',p_input->>'storageRef',coalesce(p_input->'provenance','{}'::jsonb),
 p_input->>'changeReason',p_input->>'generatedBy') RETURNING * INTO v;
 FOR dependency IN SELECT jsonb_array_elements_text(coalesce(p_input->'dependencies','[]'::jsonb)) LOOP
  INSERT INTO public.ultimate_artifact_dependencies(artifact_version_id,depends_on_version_id,dependency_kind) VALUES(v.id,dependency::uuid,'input');
 END LOOP;
 UPDATE public.ultimate_artifacts SET current_version=v.version WHERE id=a.id;
 RETURN to_jsonb(v);
END $$;
REVOKE ALL ON FUNCTION public.ultimate_fenced_artifact_version(uuid,text,bigint,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ultimate_fenced_artifact_version(uuid,text,bigint,jsonb) TO service_role;

CREATE TABLE public.ultimate_autopilot_pools (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 build_id uuid NOT NULL UNIQUE REFERENCES public.ultimate_course_builds(id) ON DELETE RESTRICT,
 coordinator_job_id uuid NOT NULL REFERENCES public.ultimate_build_jobs(id) ON DELETE RESTRICT,
 profile jsonb NOT NULL,
 profile_hash text NOT NULL CHECK (profile_hash ~ '^[a-f0-9]{64}$'),
 state text NOT NULL DEFAULT 'active' CHECK (state IN ('active','finalizing','completed')),
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ultimate_autopilot_pools ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ultimate_autopilot_pools FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.ultimate_autopilot_pools TO service_role;
CREATE UNIQUE INDEX ultimate_autopilot_role_identity_idx
 ON public.ultimate_build_jobs (build_id,job_type)
 WHERE job_type LIKE 'lesson_autopilot:%';
CREATE INDEX ultimate_autopilot_lesson_idx ON public.ultimate_build_jobs
 (build_id,(payload #>> '{autopilot,competencyId}'))
 WHERE job_type LIKE 'lesson_autopilot:%';

CREATE OR REPLACE FUNCTION public.seed_ultimate_lesson_autopilots(
 p_job uuid,p_worker text,p_generation bigint,p_profile jsonb,p_profile_hash text
) RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE
 j public.ultimate_build_jobs%ROWTYPE;
 b public.ultimate_course_builds%ROWTYPE;
 pool public.ultimate_autopilot_pools%ROWTYPE;
 c jsonb; canonical public.course_lessons%ROWTYPE;
 comp text; role_name text; previous_job uuid; new_job uuid;
 ordinal integer := 0; task_count integer := 0;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'ULTIMATE_FENCE_SERVICE_ROLE_REQUIRED'; END IF;
 SELECT * INTO j FROM public.ultimate_build_jobs WHERE id=p_job FOR UPDATE;
 IF NOT FOUND OR j.job_type<>'course_build' OR j.status<>'running' OR j.lease_owner IS DISTINCT FROM p_worker OR
   j.execution_generation IS DISTINCT FROM p_generation OR j.lease_expires_at IS NULL OR j.lease_expires_at<=clock_timestamp()
 THEN RAISE EXCEPTION 'ULTIMATE_JOB_LEASE_LOST'; END IF;
 SELECT * INTO b FROM public.ultimate_course_builds WHERE id=j.build_id FOR UPDATE;
 IF b.profile->>'ownerPaused'='true' OR b.status IN ('published','archived','cancelled') THEN RAISE EXCEPTION 'ULTIMATE_AUTOPILOT_BUILD_NOT_ACTIVE'; END IF;
 IF EXISTS(SELECT 1 FROM public.ultimate_build_jobs WHERE build_id=j.build_id AND id<>j.id AND status IN ('queued','running'))
 THEN RAISE EXCEPTION 'ULTIMATE_AUTOPILOT_EXISTING_WORK_REQUIRED_HANDOFF'; END IF;
 IF p_profile->>'parallelAutopilot' IS DISTINCT FROM 'three-role-v1' OR
   p_profile->>'publishCompletedLessons' IS DISTINCT FROM 'true' OR p_profile_hash !~ '^[a-f0-9]{64}$' OR
   jsonb_typeof(p_profile->'competencies') IS DISTINCT FROM 'array' OR jsonb_array_length(p_profile->'competencies')=0 OR
   (SELECT jsonb_agg(value->>'id' ORDER BY ord) FROM jsonb_array_elements(p_profile->'competencies') WITH ORDINALITY e(value,ord)) IS DISTINCT FROM
   (SELECT jsonb_agg(value->>'id' ORDER BY ord) FROM jsonb_array_elements(b.profile->'competencies') WITH ORDINALITY e(value,ord))
 THEN RAISE EXCEPTION 'ULTIMATE_AUTOPILOT_PROFILE_REQUIRED'; END IF;
 IF EXISTS(SELECT 1 FROM public.ultimate_autopilot_pools WHERE build_id=j.build_id) THEN RAISE EXCEPTION 'ULTIMATE_AUTOPILOT_ALREADY_PLANNED'; END IF;
 INSERT INTO public.ultimate_autopilot_pools(build_id,coordinator_job_id,profile,profile_hash)
 VALUES(j.build_id,j.id,p_profile,p_profile_hash) RETURNING * INTO pool;
 FOR c IN SELECT value FROM jsonb_array_elements(p_profile->'competencies') LOOP
   comp:=c->>'id'; ordinal:=ordinal+1;
   SELECT * INTO canonical FROM public.course_lessons WHERE course_id=b.course_id AND id=(p_profile->'canonicalLessonIds'->>comp)::uuid;
   IF NOT FOUND THEN RAISE EXCEPTION 'ULTIMATE_CANONICAL_DRAFT_REQUIRED:%',comp; END IF;
   IF canonical.is_published OR canonical.status='published' THEN
     IF canonical.status<>'published' OR NOT canonical.is_published OR canonical.video_status<>'complete' OR
       nullif(canonical.video_url,'') IS NULL OR NOT(coalesce(p_profile->'preservedPublishedLessonIds','[]'::jsonb)?canonical.id::text)
     THEN RAISE EXCEPTION 'ULTIMATE_PRESERVED_PUBLICATION_CHANGED'; END IF;
     CONTINUE;
   END IF;
   previous_job:=NULL;
   FOREACH role_name IN ARRAY ARRAY['instruction','media','quality'] LOOP
     new_job:=gen_random_uuid();
     INSERT INTO public.ultimate_build_jobs(id,build_id,job_type,priority,available_at,payload,monitor)
     VALUES(new_job,j.build_id,'lesson_autopilot:'||comp||':'||role_name,
       CASE role_name WHEN 'quality' THEN 10 WHEN 'media' THEN 20 ELSE 30 END,
       CASE WHEN previous_job IS NULL THEN now() ELSE 'infinity'::timestamptz END,
       jsonb_build_object('requestedBy',j.payload->>'requestedBy','competencyId',comp,'nextCompetencyIndex',ordinal-1,
         'autopilot',jsonb_build_object('version','three-role-v1','poolId',pool.id,'competencyId',comp,'lessonTitle',c->>'title','role',role_name,'prerequisiteJobId',previous_job)),
       jsonb_build_object('enabled',true,'state',CASE WHEN previous_job IS NULL THEN 'awaiting_assignment' ELSE 'prerequisite_wait' END,'coordinator','PARIS'));
     previous_job:=new_job;task_count:=task_count+1;
   END LOOP;
 END LOOP;
 UPDATE public.ultimate_course_builds SET profile=p_profile,status='running',updated_at=now() WHERE id=j.build_id;
 UPDATE public.ultimate_build_jobs SET status='queued',available_at=CASE WHEN task_count=0 THEN now() ELSE 'infinity'::timestamptz END,
   lease_owner=NULL,lease_expires_at=NULL,attempts=0,last_error=NULL,
   payload=(payload-'progress')||jsonb_build_object('parallelAutopilotStart',true,'nextCompetencyIndex',jsonb_array_length(p_profile->'competencies')),
   monitor=monitor||jsonb_build_object('state','parallel_pool_active','poolId',pool.id,'taskCount',task_count),updated_at=now()
 WHERE id=j.id;
 IF task_count=0 THEN UPDATE public.ultimate_autopilot_pools SET state='finalizing',updated_at=now() WHERE id=pool.id; END IF;
 RETURN jsonb_build_object('poolId',pool.id,'taskCount',task_count);
END $$;

CREATE OR REPLACE FUNCTION public.complete_ultimate_lesson_autopilot(p_job uuid,p_worker text,p_generation bigint)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE
 j public.ultimate_build_jobs%ROWTYPE; pool public.ultimate_autopilot_pools%ROWTYPE;
 lesson public.ultimate_lesson_builds%ROWTYPE; role_name text; comp text; next_role text;
 required_steps text[] := ARRAY['standards_lock','learning_objectives','prerequisites','teaching_sequence','instructor_script','storyboard',
 'visual_assignment','scene_construction','natural_narration','synchronization','active_teaching','mistakes_and_corrections','assessment_alignment',
 'lesson_film_render','finished_media_qa','instructional_qa','narration_qa','learner_runthrough','selective_repair','credential_release'];
 boundary integer; step_name text;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'ULTIMATE_FENCE_SERVICE_ROLE_REQUIRED'; END IF;
 SELECT * INTO j FROM public.ultimate_build_jobs WHERE id=p_job FOR UPDATE;
 IF NOT FOUND OR j.status<>'running' OR j.lease_owner IS DISTINCT FROM p_worker OR j.execution_generation IS DISTINCT FROM p_generation OR
   j.lease_expires_at IS NULL OR j.lease_expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'ULTIMATE_JOB_LEASE_LOST'; END IF;
 comp:=j.payload#>>'{autopilot,competencyId}';role_name:=j.payload#>>'{autopilot,role}';
 SELECT * INTO pool FROM public.ultimate_autopilot_pools WHERE id=(j.payload#>>'{autopilot,poolId}')::uuid AND build_id=j.build_id FOR UPDATE;
 IF NOT FOUND OR pool.state<>'active' OR j.job_type IS DISTINCT FROM 'lesson_autopilot:'||comp||':'||role_name OR
   role_name NOT IN ('instruction','media','quality') THEN RAISE EXCEPTION 'ULTIMATE_AUTOPILOT_IDENTITY_MISMATCH'; END IF;
 SELECT * INTO lesson FROM public.ultimate_lesson_builds WHERE build_id=j.build_id AND competency_id=comp;
 IF NOT FOUND THEN RAISE EXCEPTION 'ULTIMATE_AUTOPILOT_LESSON_REQUIRED'; END IF;
 boundary:=CASE role_name WHEN 'instruction' THEN 6 WHEN 'media' THEN 14 ELSE 20 END;
 FOREACH step_name IN ARRAY required_steps[1:boundary] LOOP
   IF pool.profile->>'id'='course:a6b0b712-1cf0-475a-ba79-ee2023dea8ec' AND step_name IN ('instructional_qa','learner_runthrough') THEN CONTINUE; END IF;
   IF NOT EXISTS(SELECT 1 FROM public.ultimate_lesson_steps WHERE lesson_build_id=lesson.id AND step=step_name AND state='passed'
      AND artifacts#>>'{contractEvidence,passed}'='true' AND artifacts#>>'{contractEvidence,version}'='ultimate-lesson-2026-10-05.1')
   THEN RAISE EXCEPTION 'ULTIMATE_AUTOPILOT_STAGE_NOT_COMPLETE:%',step_name; END IF;
 END LOOP;
 IF role_name='quality' THEN
   IF lesson.status<>'built' OR lesson.artifacts#>>'{finished_media_qa,mediaQA,pass}' IS DISTINCT FROM 'true' OR
     NOT EXISTS(SELECT 1 FROM public.course_lessons l JOIN public.ultimate_course_builds b ON b.course_id=l.course_id
       WHERE b.id=j.build_id AND l.id=(pool.profile->'canonicalLessonIds'->>comp)::uuid AND l.status='published' AND l.is_published
       AND l.video_status='complete' AND nullif(l.video_url,'') IS NOT NULL)
   THEN RAISE EXCEPTION 'ULTIMATE_AUTOPILOT_PUBLICATION_REQUIRED'; END IF;
 END IF;
 UPDATE public.ultimate_build_jobs SET status='completed',lease_owner=NULL,lease_expires_at=NULL,
   monitor=monitor||jsonb_build_object('state','completed','verifiedAt',now()),updated_at=now() WHERE id=j.id;
 next_role:=CASE role_name WHEN 'instruction' THEN 'media' WHEN 'media' THEN 'quality' END;
 IF next_role IS NOT NULL THEN
   UPDATE public.ultimate_build_jobs SET available_at=now(),monitor=monitor||jsonb_build_object('state','awaiting_assignment'),updated_at=now()
   WHERE build_id=j.build_id AND job_type='lesson_autopilot:'||comp||':'||next_role AND status='queued'
     AND payload#>>'{autopilot,prerequisiteJobId}'=j.id::text;
   IF NOT FOUND THEN RAISE EXCEPTION 'ULTIMATE_AUTOPILOT_SUCCESSOR_REQUIRED'; END IF;
 END IF;
 IF NOT EXISTS(SELECT 1 FROM public.ultimate_build_jobs WHERE build_id=j.build_id AND payload#>>'{autopilot,poolId}'=pool.id::text
     AND payload#>>'{autopilot,role}'='quality' AND status<>'completed') THEN
   UPDATE public.ultimate_autopilot_pools SET state='finalizing',updated_at=now() WHERE id=pool.id;
   UPDATE public.ultimate_build_jobs SET available_at=now(),attempts=0,last_error=NULL,updated_at=now()
     WHERE id=pool.coordinator_job_id AND status='queued';
 END IF;
 RETURN jsonb_build_object('jobId',j.id,'role',role_name,'nextRole',next_role);
END $$;

REVOKE ALL ON FUNCTION public.seed_ultimate_lesson_autopilots(uuid,text,bigint,jsonb,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.complete_ultimate_lesson_autopilot(uuid,text,bigint) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.seed_ultimate_lesson_autopilots(uuid,text,bigint,jsonb,text) TO service_role;
GRANT EXECUTE ON FUNCTION public.complete_ultimate_lesson_autopilot(uuid,text,bigint) TO service_role;

CREATE OR REPLACE FUNCTION public.request_ultimate_autopilot_pool(p_build uuid,p_actor uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE j public.ultimate_build_jobs%ROWTYPE; existing public.ultimate_autopilot_pools%ROWTYPE;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' OR p_actor IS NULL THEN RAISE EXCEPTION 'ULTIMATE_FENCE_SERVICE_ROLE_REQUIRED'; END IF;
 SELECT * INTO existing FROM public.ultimate_autopilot_pools WHERE build_id=p_build;
 IF FOUND THEN RETURN jsonb_build_object('poolId',existing.id,'state',existing.state,'alreadyConfigured',true); END IF;
 SELECT * INTO j FROM public.ultimate_build_jobs WHERE build_id=p_build AND job_type='course_build' AND status IN ('queued','running') FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'ULTIMATE_AUTOPILOT_SAVED_CONTINUATION_REQUIRED'; END IF;
 IF j.payload->>'ownerPreview'='true' OR j.payload->>'acceptance'='true' OR j.payload?'competencyId' OR j.payload?'lessonBuildId'
 THEN RAISE EXCEPTION 'ULTIMATE_AUTOPILOT_FULL_COURSE_REQUIRED'; END IF;
 IF j.status='running' THEN
  -- The existing continuous-lesson checkpoint sees this pending request,
  -- publishes its current accepted lesson, then yields without losing media.
  UPDATE public.ultimate_build_jobs SET pending_dependency_resume=coalesce(pending_dependency_resume,payload)||
    jsonb_build_object('parallelAutopilotStart',true,'requestedBy',p_actor),updated_at=now() WHERE id=j.id;
 ELSE
  UPDATE public.ultimate_build_jobs SET payload=payload||jsonb_build_object('parallelAutopilotStart',true,'requestedBy',p_actor),
   available_at=now(),updated_at=now() WHERE id=j.id;
 END IF;
 RETURN jsonb_build_object('jobId',j.id,'state',CASE WHEN j.status='running' THEN 'handoff_requested' ELSE 'awaiting_coordinator' END);
END $$;
CREATE OR REPLACE FUNCTION public.finish_ultimate_autopilot_pool(p_build uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'ULTIMATE_FENCE_SERVICE_ROLE_REQUIRED'; END IF;
 UPDATE public.ultimate_autopilot_pools p SET state='completed',updated_at=now()
 WHERE p.build_id=p_build AND p.state='finalizing'
  AND EXISTS(SELECT 1 FROM public.ultimate_course_builds b JOIN public.courses c ON c.id=b.course_id WHERE b.id=p_build AND b.status='published' AND c.status='published')
  AND EXISTS(SELECT 1 FROM public.ultimate_build_jobs j WHERE j.id=p.coordinator_job_id AND j.status='completed');
 RETURN FOUND;
END $$;
CREATE OR REPLACE FUNCTION public.ultimate_autopilot_ready()
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT to_regprocedure('public.seed_ultimate_lesson_autopilots(uuid,text,bigint,jsonb,text)') IS NOT NULL
 AND to_regprocedure('public.complete_ultimate_lesson_autopilot(uuid,text,bigint)') IS NOT NULL
 AND to_regprocedure('public.claim_ultimate_lesson_autopilot(text,integer,text)') IS NOT NULL
 AND to_regprocedure('public.ultimate_fenced_artifact_version(uuid,text,bigint,jsonb)') IS NOT NULL
 AND to_regprocedure('public.delegate_ultimate_autopilot_repair(uuid,text,bigint,jsonb)') IS NOT NULL
 AND to_regclass('public.ultimate_autopilot_pools') IS NOT NULL;
$$;
REVOKE ALL ON FUNCTION public.request_ultimate_autopilot_pool(uuid,uuid),public.finish_ultimate_autopilot_pool(uuid),public.ultimate_autopilot_ready()
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.request_ultimate_autopilot_pool(uuid,uuid),public.finish_ultimate_autopilot_pool(uuid),public.ultimate_autopilot_ready() TO service_role;


CREATE OR REPLACE FUNCTION public.ultimate_autopilot_job_ready(p_job uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY INVOKER SET search_path='' AS $$
 SELECT EXISTS(
  SELECT 1 FROM public.ultimate_build_jobs j JOIN public.ultimate_autopilot_pools p
   ON p.id=(j.payload#>>'{autopilot,poolId}')::uuid AND p.build_id=j.build_id AND p.state='active'
  WHERE j.id=p_job AND j.payload#>>'{autopilot,version}'='three-role-v1'
   AND j.job_type='lesson_autopilot:'||(j.payload#>>'{autopilot,competencyId}')||':'||(j.payload#>>'{autopilot,role}')
   AND ((j.payload#>>'{autopilot,role}'='instruction' AND j.payload#>>'{autopilot,prerequisiteJobId}' IS NULL)
    OR EXISTS(SELECT 1 FROM public.ultimate_build_jobs previous
      WHERE previous.id=(j.payload#>>'{autopilot,prerequisiteJobId}')::uuid AND previous.build_id=j.build_id AND previous.status='completed'
       AND previous.payload#>>'{autopilot,poolId}'=p.id::text
       AND previous.payload#>>'{autopilot,competencyId}'=j.payload#>>'{autopilot,competencyId}'
       AND previous.payload#>>'{autopilot,role}'=CASE j.payload#>>'{autopilot,role}' WHEN 'media' THEN 'instruction' WHEN 'quality' THEN 'media' END))
   AND NOT EXISTS(SELECT 1 FROM public.ultimate_build_jobs active WHERE active.build_id=j.build_id AND active.id<>j.id
    AND active.status='running' AND active.lease_expires_at>clock_timestamp() AND
      (active.job_type='course_build' OR active.payload#>>'{autopilot,competencyId}'=j.payload#>>'{autopilot,competencyId}'))
 );
$$;

CREATE OR REPLACE FUNCTION public.claim_ultimate_course_role_job(p_worker text,p_lease_seconds integer,p_role text)
RETURNS SETOF public.ultimate_build_jobs LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
DECLARE v_id uuid;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'ULTIMATE_FENCE_SERVICE_ROLE_REQUIRED'; END IF;
 IF nullif(btrim(p_worker),'') IS NULL OR p_lease_seconds NOT BETWEEN 30 AND 900 OR
   (p_role IS NOT NULL AND p_role NOT IN ('instruction','media','quality')) THEN RAISE EXCEPTION 'invalid worker lease request'; END IF;
 UPDATE public.ultimate_build_jobs SET status='queued',lease_owner=NULL,lease_expires_at=NULL,updated_at=now()
  WHERE status='running' AND lease_expires_at<now() AND attempts<max_attempts;
 UPDATE public.ultimate_build_jobs SET status='failed',last_error=coalesce(last_error,'lease expired after retry limit'),updated_at=now()
  WHERE status='running' AND lease_expires_at<now() AND attempts>=max_attempts;
 SELECT j.id INTO v_id FROM public.ultimate_build_jobs j
 JOIN public.ultimate_course_builds b ON b.id=j.build_id JOIN public.courses c ON c.id=b.course_id
 WHERE j.status='queued' AND j.available_at<=now() AND j.attempts<j.max_attempts AND c.status<>'archived'::public.course_status
  AND b.profile->>'ownerPaused' IS DISTINCT FROM 'true'
  AND ((p_role IS NULL AND j.payload->'autopilot' IS NULL AND
    NOT EXISTS(SELECT 1 FROM public.ultimate_autopilot_pools p WHERE p.build_id=j.build_id AND p.state='active'))
   OR (p_role IS NOT NULL AND j.payload#>>'{autopilot,role}'=p_role AND public.ultimate_autopilot_job_ready(j.id)))
 ORDER BY j.priority ASC,j.available_at ASC,j.created_at ASC,j.id ASC
 FOR UPDATE OF j SKIP LOCKED LIMIT 1;
 IF v_id IS NULL THEN RETURN; END IF;
 RETURN QUERY WITH claimed AS (
  UPDATE public.ultimate_build_jobs j SET status='running',attempts=j.attempts+1,execution_generation=j.execution_generation+1,
   lease_owner=p_worker,heartbeat_at=now(),lease_expires_at=now()+make_interval(secs=>p_lease_seconds),updated_at=now()
  WHERE j.id=v_id RETURNING j.*
 ), recorded AS (
  INSERT INTO public.ultimate_job_attempt_history(job_id,execution_generation,worker_id,event_type)
  SELECT id,execution_generation,p_worker,'claimed' FROM claimed RETURNING job_id
 ) SELECT claimed.* FROM claimed JOIN recorded ON recorded.job_id=claimed.id;
END $$;
CREATE OR REPLACE FUNCTION public.claim_ultimate_build_job(p_worker text,p_lease_seconds integer DEFAULT 300)
RETURNS SETOF public.ultimate_build_jobs LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT * FROM public.claim_ultimate_course_role_job(p_worker,p_lease_seconds,NULL);
$$;
CREATE OR REPLACE FUNCTION public.claim_ultimate_lesson_autopilot(p_worker text,p_lease_seconds integer,p_role text)
RETURNS SETOF public.ultimate_build_jobs LANGUAGE sql SECURITY INVOKER SET search_path='' AS $$
 SELECT * FROM public.claim_ultimate_course_role_job(p_worker,p_lease_seconds,p_role);
$$;

CREATE OR REPLACE FUNCTION public.ultimate_assert_autopilot_scope(p_job uuid,p_lesson uuid DEFAULT NULL,p_competency text DEFAULT NULL,p_publish boolean DEFAULT false)
RETURNS boolean LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE j public.ultimate_build_jobs%ROWTYPE; comp text;
BEGIN
 SELECT * INTO j FROM public.ultimate_build_jobs WHERE id=p_job;
 IF j.payload->'autopilot' IS NULL THEN RETURN true; END IF;
 comp:=j.payload#>>'{autopilot,competencyId}';
 IF j.job_type IS DISTINCT FROM 'lesson_autopilot:'||comp||':'||(j.payload#>>'{autopilot,role}') OR
   NOT EXISTS(SELECT 1 FROM public.ultimate_autopilot_pools p WHERE p.id=(j.payload#>>'{autopilot,poolId}')::uuid AND p.build_id=j.build_id AND p.state='active')
 THEN RAISE EXCEPTION 'ULTIMATE_AUTOPILOT_IDENTITY_MISMATCH'; END IF;
 IF p_competency IS NOT NULL AND p_competency IS DISTINCT FROM comp THEN RAISE EXCEPTION 'ULTIMATE_AUTOPILOT_CROSS_LESSON_WRITE'; END IF;
 IF p_lesson IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.ultimate_lesson_builds WHERE id=p_lesson AND build_id=j.build_id AND competency_id=comp)
 THEN RAISE EXCEPTION 'ULTIMATE_AUTOPILOT_CROSS_LESSON_WRITE'; END IF;
 IF p_publish AND j.payload#>>'{autopilot,role}' IS DISTINCT FROM 'quality' THEN RAISE EXCEPTION 'ULTIMATE_AUTOPILOT_QUALITY_ROLE_REQUIRED'; END IF;
 RETURN true;
END $$;

CREATE OR REPLACE FUNCTION public.delegate_ultimate_autopilot_repair(p_job uuid,p_worker text,p_generation bigint,p_directive jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
DECLARE j public.ultimate_build_jobs%ROWTYPE; producer public.ultimate_build_jobs%ROWTYPE; role_name text; task_role text; fingerprint text; comp text;
BEGIN
 IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'ULTIMATE_FENCE_SERVICE_ROLE_REQUIRED'; END IF;
 SELECT * INTO j FROM public.ultimate_build_jobs WHERE id=p_job FOR UPDATE;
 IF NOT FOUND OR j.status<>'running' OR j.lease_owner IS DISTINCT FROM p_worker OR j.execution_generation IS DISTINCT FROM p_generation OR
   j.lease_expires_at IS NULL OR j.lease_expires_at<=clock_timestamp() THEN RAISE EXCEPTION 'ULTIMATE_JOB_LEASE_LOST'; END IF;
 PERFORM public.ultimate_assert_autopilot_scope(j.id);
 task_role:=j.payload#>>'{autopilot,role}';comp:=j.payload#>>'{autopilot,competencyId}';
 role_name:=CASE WHEN p_directive->>'target' IN ('standards_lock','learning_objectives','prerequisites','teaching_sequence','instructor_script','storyboard') THEN 'instruction'
  WHEN p_directive->>'target' IN ('visual_assignment','scene_construction','natural_narration','synchronization','active_teaching','mistakes_and_corrections','assessment_alignment','lesson_film_render') THEN 'media' END;
 IF role_name IS NULL OR task_role='instruction' OR task_role='media' AND role_name<>'instruction' THEN RETURN jsonb_build_object('delegated',false); END IF;
 fingerprint:=md5(jsonb_build_object('target',p_directive->'target','failedStep',p_directive->'failedStep','requirements',p_directive->'requirements')::text);
 IF j.monitor#>>'{lastDelegatedRepair,fingerprint}'=fingerprint THEN RETURN jsonb_build_object('delegated',false); END IF;
 SELECT * INTO producer FROM public.ultimate_build_jobs WHERE build_id=j.build_id AND job_type='lesson_autopilot:'||comp||':'||role_name FOR UPDATE;
 IF NOT FOUND OR producer.status<>'completed' THEN RAISE EXCEPTION 'ULTIMATE_AUTOPILOT_REPAIR_PRODUCER_REQUIRED'; END IF;
 UPDATE public.ultimate_build_jobs SET status='queued',available_at='infinity'::timestamptz,lease_owner=NULL,lease_expires_at=NULL,
  monitor=monitor||jsonb_build_object('state','prerequisite_wait','lastDelegatedRepair',jsonb_build_object('fingerprint',fingerprint,'at',now(),'producerJobId',producer.id,'directive',p_directive-'previous')),updated_at=now()
 WHERE id=j.id;
 -- Intermediate successors must also wait if instruction has to be repaired.
 UPDATE public.ultimate_build_jobs SET status='queued',available_at='infinity'::timestamptz,updated_at=now()
 WHERE build_id=j.build_id AND payload#>>'{autopilot,competencyId}'=comp AND id NOT IN (j.id,producer.id)
  AND status='completed' AND role_name='instruction';
 UPDATE public.ultimate_build_jobs SET status='queued',attempts=0,available_at=now(),last_error=NULL,
  monitor=monitor||jsonb_build_object('state','awaiting_assignment','repairRequestedBy',j.id,'previousError',producer.last_error),updated_at=now()
 WHERE id=producer.id;
 RETURN jsonb_build_object('delegated',true,'producerJobId',producer.id,'role',role_name);
END $$;

REVOKE ALL ON FUNCTION public.ultimate_autopilot_job_ready(uuid),public.claim_ultimate_course_role_job(text,integer,text),
 public.claim_ultimate_build_job(text,integer),public.claim_ultimate_lesson_autopilot(text,integer,text),
 public.ultimate_assert_autopilot_scope(uuid,uuid,text,boolean),public.delegate_ultimate_autopilot_repair(uuid,text,bigint,jsonb)
 FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ultimate_autopilot_job_ready(uuid),public.claim_ultimate_course_role_job(text,integer,text),
 public.claim_ultimate_build_job(text,integer),public.claim_ultimate_lesson_autopilot(text,integer,text),
 public.ultimate_assert_autopilot_scope(uuid,uuid,text,boolean),public.delegate_ultimate_autopilot_repair(uuid,text,bigint,jsonb)
 TO service_role;

CREATE OR REPLACE FUNCTION public.commit_ultimate_publication_core(p_package jsonb, p_rows jsonb, p_actor uuid, p_rolled_back_from uuid DEFAULT NULL::uuid, p_fence jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
DECLARE
  v_course_id uuid := (p_package->>'courseId')::uuid;
  v_build_id uuid := (p_package->>'buildId')::uuid;
  v_build public.ultimate_course_builds%ROWTYPE;
  v_job public.ultimate_build_jobs%ROWTYPE;
  v_lesson public.course_lessons%ROWTYPE;
  v_row public.course_lessons%ROWTYPE;
  v_media public.video_jobs%ROWTYPE;
  v_existing_media public.video_jobs%ROWTYPE;
  v_release public.ultimate_release_versions%ROWTYPE;
  v_historical public.ultimate_release_versions%ROWTYPE;
  v_prepared jsonb; v_source jsonb; v_artifacts jsonb;
  v_experience jsonb; v_content jsonb;
  v_module uuid; v_media_id uuid; v_version integer;
  v_now timestamptz := now(); v_count integer; v_expected integer;
  v_partial boolean := coalesce(p_package->>'releaseScope','course')='lesson';
  v_write_count integer; v_preserved boolean; v_partial_ids jsonb := '[]'::jsonb;
BEGIN
  PERFORM set_config('lock_timeout','5s',true);
  IF p_actor IS NULL OR v_course_id IS NULL OR v_build_id IS NULL OR
     p_package->>'contractVersion' IS DISTINCT FROM 'ultimate-lesson-2026-10-05.1' OR
     jsonb_typeof(p_package->'lessons') IS DISTINCT FROM 'array' OR
     jsonb_typeof(p_rows) IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'ULTIMATE_RELEASE_CONTRACT_REQUIRED';
  END IF;
  IF coalesce(p_package->>'releaseScope','course') NOT IN ('course','lesson') OR
     (v_partial AND p_rolled_back_from IS NOT NULL) THEN
    RAISE EXCEPTION 'ULTIMATE_RELEASE_SCOPE_INVALID';
  END IF;
  v_expected := jsonb_array_length(p_package->'lessons');
  SELECT count(*) INTO v_write_count FROM jsonb_array_elements(p_package->'lessons')
    WHERE value->>'preservedPublished' IS DISTINCT FROM 'true';
  IF v_expected = 0 OR (v_partial AND (v_expected<>1 OR v_write_count<>1)) OR
     jsonb_array_length(p_rows) <> v_write_count OR
     (SELECT count(DISTINCT value->>'sourceLessonBuildId') FROM jsonb_array_elements(p_package->'lessons')
       WHERE value->>'preservedPublished' IS DISTINCT FROM 'true') <> v_write_count OR
     (SELECT count(DISTINCT value->>'competencyId') FROM jsonb_array_elements(p_package->'lessons')) <> v_expected OR
     (SELECT count(DISTINCT value->>'sourceLessonBuildId') FROM jsonb_array_elements(p_rows)) <> v_write_count THEN
    RAISE EXCEPTION 'ULTIMATE_ALL_COMPETENCIES_REQUIRED';
  END IF;
  -- Course first, then its build, canonical lessons and media rows. This order
  -- serializes version allocation and publication of the same course.
  PERFORM 1 FROM public.courses WHERE id=v_course_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ULTIMATE_COURSE_NOT_FOUND'; END IF;
  IF p_rolled_back_from IS NULL THEN
    SELECT * INTO v_build FROM public.ultimate_course_builds WHERE id=v_build_id FOR UPDATE;
    IF NOT FOUND OR v_build.course_id <> v_course_id THEN
      RAISE EXCEPTION 'ULTIMATE_BUILD_NOT_RELEASE_READY';
    END IF;
  END IF;
  IF p_fence IS NOT NULL THEN
    SELECT * INTO v_job FROM public.ultimate_build_jobs
      WHERE id=(p_fence->>'jobId')::uuid AND build_id=v_build_id FOR UPDATE;
    IF NOT FOUND OR v_job.status <> 'running' OR
       v_job.lease_owner IS DISTINCT FROM p_fence->>'workerId' OR
       v_job.execution_generation IS DISTINCT FROM (p_fence->>'generation')::integer OR
       v_job.lease_expires_at IS NULL OR v_job.lease_expires_at<=clock_timestamp() THEN
      RAISE EXCEPTION 'ULTIMATE_JOB_LEASE_LOST';
    END IF;
  END IF;
  IF p_fence IS NOT NULL AND v_job.payload->'autopilot' IS NOT NULL THEN
    IF NOT v_partial THEN RAISE EXCEPTION 'ULTIMATE_AUTOPILOT_COURSE_RELEASE_REQUIRES_COORDINATOR'; END IF;
    PERFORM public.ultimate_assert_autopilot_scope(v_job.id,
      (p_package->'lessons'->0->>'sourceLessonBuildId')::uuid,p_package->'lessons'->0->>'competencyId',true);
  END IF;
  IF NOT v_partial THEN
  SELECT * INTO v_release FROM public.ultimate_release_versions
    WHERE course_id=v_course_id AND build_id=v_build_id AND status='released'
      AND package=p_package AND rolled_back_from IS NOT DISTINCT FROM p_rolled_back_from
    ORDER BY version DESC LIMIT 1;
  IF FOUND THEN RETURN to_jsonb(v_release); END IF;
  END IF;

  IF p_rolled_back_from IS NULL THEN
    IF (NOT v_partial AND v_build.status <> 'built') OR
       (v_partial AND (v_build.status IN ('archived','cancelled') OR
         v_build.profile->>'publishCompletedLessons' IS DISTINCT FROM 'true')) OR
       v_build.profile IS DISTINCT FROM p_package->'profile' THEN
      RAISE EXCEPTION 'ULTIMATE_BUILD_NOT_RELEASE_READY';
    END IF;
    IF NOT v_partial AND coalesce(jsonb_array_length(v_build.profile->'competencies'),0) <> v_expected THEN
      RAISE EXCEPTION 'ULTIMATE_ALL_COMPETENCIES_REQUIRED';
    END IF;
  ELSE
    SELECT * INTO v_historical FROM public.ultimate_release_versions
      WHERE id=p_rolled_back_from AND course_id=v_course_id;
    IF NOT FOUND OR (v_historical.package || jsonb_build_object(
      'buildId',v_historical.build_id,'courseId',v_course_id)) IS DISTINCT FROM p_package THEN
      RAISE EXCEPTION 'ULTIMATE_RELEASE_NOT_FOUND';
    END IF;
  END IF;

  -- Validate all source and canonical identities before making the first write.
  FOR v_source IN SELECT value FROM jsonb_array_elements(p_package->'lessons') LOOP
    v_preserved := v_source->>'preservedPublished'='true';
    IF NOT EXISTS(SELECT 1 FROM jsonb_array_elements(p_package->'profile'->'competencies') c
      WHERE c->>'id'=v_source->>'competencyId') OR
      (p_package->'profile'->'canonicalLessonIds'->> (v_source->>'competencyId') IS NOT NULL AND
       p_package->'profile'->'canonicalLessonIds'->> (v_source->>'competencyId')
         IS DISTINCT FROM v_source->>'canonicalLessonId') THEN
      RAISE EXCEPTION 'ULTIMATE_CANONICAL_LESSON_MAPPING_REQUIRED';
    END IF;
    IF v_preserved THEN
      IF p_package->'profile'->>'publishCompletedLessons' IS DISTINCT FROM 'true' OR
        coalesce(v_source->>'canonicalLessonId','')='' OR
        NOT (coalesce(p_package->'profile'->'preservedPublishedLessonIds','[]'::jsonb) ? (v_source->>'canonicalLessonId')) THEN
        RAISE EXCEPTION 'ULTIMATE_PRESERVED_PUBLICATION_MAPPING_REQUIRED';
      END IF;
    ELSE
    SELECT value INTO v_prepared FROM jsonb_array_elements(p_rows)
      WHERE value->>'sourceLessonBuildId'=v_source->>'sourceLessonBuildId';
    IF NOT FOUND OR v_prepared->>'competencyId' IS DISTINCT FROM v_source->>'competencyId' OR
       v_prepared->>'canonicalLessonId' IS DISTINCT FROM v_source->>'canonicalLessonId' OR
       v_prepared->'media'->>'video_url' IS DISTINCT FROM v_source->>'videoUrl' OR
       v_prepared->'row'->>'video_url' IS DISTINCT FROM v_source->>'videoUrl' OR
       coalesce(v_source->>'videoUrl','')='' THEN
      RAISE EXCEPTION 'ULTIMATE_RELEASE_FILM_MISMATCH';
    END IF;
    IF p_rolled_back_from IS NULL THEN
      SELECT artifacts INTO v_artifacts FROM public.ultimate_lesson_builds
        WHERE id=(v_source->>'sourceLessonBuildId')::uuid AND build_id=v_build_id
          AND competency_id=v_source->>'competencyId' AND status='built' FOR UPDATE;
      IF NOT FOUND OR v_artifacts IS DISTINCT FROM v_source->'contractArtifacts' OR
         v_artifacts #>> '{finished_media_qa,mediaQA,pass}' IS DISTINCT FROM 'true' THEN
        RAISE EXCEPTION 'ULTIMATE_LESSONS_NOT_RELEASE_READY';
      END IF;
    END IF;
    END IF;
    IF (SELECT count(*) FROM public.course_lessons WHERE course_id=v_course_id AND (
        CASE WHEN nullif(v_source->>'canonicalLessonId','') IS NOT NULL
          THEN id=(v_source->>'canonicalLessonId')::uuid ELSE slug=v_source->>'slug' END)) > 1 THEN
      RAISE EXCEPTION 'ULTIMATE_CANONICAL_LESSON_AMBIGUOUS';
    END IF;
    SELECT * INTO v_lesson FROM public.course_lessons
      WHERE course_id=v_course_id AND (
        CASE WHEN nullif(v_source->>'canonicalLessonId','') IS NOT NULL
          THEN id=(v_source->>'canonicalLessonId')::uuid ELSE slug=v_source->>'slug' END
      ) FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'ULTIMATE_CANONICAL_DRAFT_REQUIRED'; END IF;
    v_partial_ids := v_partial_ids || to_jsonb(v_lesson.id);
    IF v_preserved AND (v_lesson.status::text IS DISTINCT FROM 'published' OR
       v_lesson.is_published IS DISTINCT FROM true OR v_lesson.video_status IS DISTINCT FROM 'complete' OR
       v_lesson.video_url IS DISTINCT FROM v_source->>'videoUrl' OR coalesce(v_lesson.video_url,'')='') THEN
      RAISE EXCEPTION 'ULTIMATE_PRESERVED_PUBLICATION_CHANGED';
    END IF;
    IF v_partial AND (v_lesson.is_published=true OR v_lesson.status::text='published') THEN
      IF v_lesson.video_status IS DISTINCT FROM 'complete' OR coalesce(v_lesson.video_url,'')='' THEN
        RAISE EXCEPTION 'ULTIMATE_PRESERVED_PUBLICATION_CHANGED';
      END IF;
      IF p_fence IS NOT NULL AND v_job.lease_expires_at<=clock_timestamp() THEN
        RAISE EXCEPTION 'ULTIMATE_JOB_LEASE_LOST';
      END IF;
      RETURN jsonb_build_object('scope','lesson','lessonIds',v_partial_ids,
        'committedAt',v_now,'preservedExisting',true);
    END IF;
    IF v_lesson.module_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.course_modules WHERE id=v_lesson.module_id AND course_id=v_course_id
    ) THEN RAISE EXCEPTION 'ULTIMATE_CANONICAL_MODULE_COURSE_MISMATCH'; END IF;
  END LOOP;

  IF (SELECT count(DISTINCT value) FROM jsonb_array_elements_text(v_partial_ids)) <> v_expected THEN
    RAISE EXCEPTION 'ULTIMATE_CANONICAL_LESSON_DUPLICATE';
  END IF;

  IF (SELECT count(*) FROM public.course_modules WHERE course_id=v_course_id AND slug='ultimate-core') > 1 THEN
    RAISE EXCEPTION 'ULTIMATE_CANONICAL_MODULE_AMBIGUOUS';
  END IF;
  SELECT id INTO v_module FROM public.course_modules
    WHERE course_id=v_course_id AND slug='ultimate-core' LIMIT 1;
  IF v_module IS NULL THEN
    SELECT module_id INTO v_module FROM public.course_lessons
      WHERE course_id=v_course_id AND module_id IS NOT NULL AND id IN (
        SELECT (value->>'canonicalLessonId')::uuid FROM jsonb_array_elements(p_package->'lessons')
        WHERE nullif(value->>'canonicalLessonId','') IS NOT NULL
      ) ORDER BY order_index,id LIMIT 1;
  END IF;
  IF v_module IS NULL THEN
    INSERT INTO public.course_modules(course_id,title,slug,order_index,is_required,is_published,is_draft,created_by)
    SELECT v_course_id,p_package->>'title','ultimate-core',coalesce(max(order_index),0)+1,true,true,false,p_actor
      FROM public.course_modules WHERE course_id=v_course_id RETURNING id INTO v_module;
  END IF;
  UPDATE public.course_modules SET is_published=true,is_draft=false WHERE id=v_module AND course_id=v_course_id;

  FOR v_prepared IN SELECT value FROM jsonb_array_elements(p_rows)
    ORDER BY (value->'row'->>'order_index')::integer, value->>'sourceLessonBuildId' LOOP
    SELECT * INTO v_lesson FROM public.course_lessons WHERE course_id=v_course_id AND (
      CASE WHEN nullif(v_prepared->>'canonicalLessonId','') IS NOT NULL
        THEN id=(v_prepared->>'canonicalLessonId')::uuid ELSE slug=v_prepared->>'slug' END
    ) FOR UPDATE;
    SELECT * INTO v_row FROM jsonb_populate_record(NULL::public.course_lessons,v_prepared->'row');
    SELECT * INTO v_media FROM jsonb_populate_record(NULL::public.video_jobs,v_prepared->'media');
    IF (SELECT count(*) FROM public.video_jobs WHERE course_id=v_course_id AND lesson_id=v_lesson.id
      AND asset_kind='lesson' AND asset_key IS NULL) > 1 THEN
      RAISE EXCEPTION 'ULTIMATE_PRIMARY_MEDIA_JOB_AMBIGUOUS';
    END IF;
    SELECT * INTO v_existing_media FROM public.video_jobs
      WHERE course_id=v_course_id AND lesson_id=v_lesson.id AND asset_kind='lesson' AND asset_key IS NULL FOR UPDATE;
    IF FOUND AND (v_existing_media.status='rendering' OR v_existing_media.lease_expires_at>v_now) THEN
      RAISE EXCEPTION 'ULTIMATE_PRIMARY_MEDIA_JOB_ACTIVE';
    END IF;
    IF v_existing_media.id IS NOT NULL AND v_existing_media.lease_token IS NOT NULL THEN
      RAISE EXCEPTION 'ULTIMATE_PRIMARY_MEDIA_JOB_CHANGED';
    END IF;
    IF v_existing_media.id IS NULL THEN
      INSERT INTO public.video_jobs(course_id,lesson_id,lesson_title,asset_kind,asset_key,status,provider,
        video_url,script,scene_data,duration_seconds,scene_count,completed_at,review_status,reviewed_by,
        reviewed_at,review_notes,quality_evidence)
      VALUES(v_course_id,v_lesson.id,v_media.lesson_title,'lesson',NULL,'complete',v_media.provider,
        v_media.video_url,v_media.script,v_media.scene_data,v_media.duration_seconds,v_media.scene_count,
        v_now,'approved',p_actor,v_now,v_media.review_notes,v_media.quality_evidence) RETURNING id INTO v_media_id;
    ELSE
      UPDATE public.video_jobs SET lesson_title=v_media.lesson_title,status='complete',provider=v_media.provider,
        video_url=v_media.video_url,script=v_media.script,
        scene_data=CASE WHEN v_prepared->'media' ? 'scene_data' THEN v_media.scene_data ELSE scene_data END,
        duration_seconds=v_media.duration_seconds,scene_count=v_media.scene_count,completed_at=v_now,
        review_status='approved',reviewed_by=p_actor,reviewed_at=v_now,
        review_notes=v_media.review_notes,quality_evidence=v_media.quality_evidence
      WHERE id=v_existing_media.id RETURNING id INTO v_media_id;
    END IF;
    IF jsonb_typeof(v_lesson.content_json) NOT IN ('object','null') OR
       jsonb_typeof(v_lesson.content_json->'experience') NOT IN ('object','null') OR
       jsonb_typeof(v_row.content_json->'experience') IS DISTINCT FROM 'object' THEN
      RAISE EXCEPTION 'ULTIMATE_CANONICAL_EXPERIENCE_INVALID';
    END IF;
    v_experience := coalesce(nullif(v_lesson.content_json->'experience','null'::jsonb),'{}'::jsonb) || (v_row.content_json->'experience');
    v_experience := v_experience || jsonb_build_object(
      'knowledgeChecks',public.merge_ultimate_release_questions(v_lesson.content_json #> '{experience,knowledgeChecks}',v_row.content_json #> '{experience,knowledgeChecks}'),
      'reassessment',public.merge_ultimate_release_questions(v_lesson.content_json #> '{experience,reassessment}',v_row.content_json #> '{experience,reassessment}')
    );
    IF (coalesce(v_lesson.practical_required,false) OR coalesce(v_row.practical_required,false)) AND
       coalesce(jsonb_typeof(v_experience->'practicalTask'),'null')='null' AND
       v_lesson.content_json #> '{experience,practicalTask}' IS NOT NULL THEN
      v_experience := v_experience || jsonb_build_object('practicalTask',v_lesson.content_json #> '{experience,practicalTask}');
    END IF;
    v_content := coalesce(nullif(v_lesson.content_json,'null'::jsonb),'{}'::jsonb) || v_row.content_json ||
      jsonb_build_object('experience',v_experience,'mediaAttachment',
        CASE WHEN jsonb_typeof(v_lesson.content_json->'mediaAttachment')='object'
          THEN v_lesson.content_json->'mediaAttachment' ELSE '{}'::jsonb END ||
        jsonb_build_object('publicationPending',false,'publishedAt',v_now,
          'sourceLessonBuildId',v_prepared->>'sourceLessonBuildId'));
    UPDATE public.course_modules SET is_published=true,is_draft=false
      WHERE id=coalesce(v_lesson.module_id,v_module) AND course_id=v_course_id;
    UPDATE public.course_lessons SET module_id=coalesce(v_lesson.module_id,v_module),title=v_row.title,
      order_index=coalesce(v_lesson.order_index,v_row.order_index),lesson_type=coalesce(v_lesson.lesson_type,v_row.lesson_type),is_required=true,status='published',
      is_published=true,generation_status='completed',ai_generated=true,approved=true,
      learning_objectives=v_row.learning_objectives,video_url=v_row.video_url,script_text=v_row.script_text,
      scene_data=CASE WHEN v_prepared->'row' ? 'scene_data' THEN v_row.scene_data ELSE scene_data END,
      practical_required=coalesce(v_lesson.practical_required,false) OR coalesce(v_row.practical_required,false),content_json=v_content,published_at=v_now,
      published_by=p_actor,updated_at=v_now,video_job_id=v_media_id,video_status='complete',
      media_origin='generated',media_quality_status='approved',media_quality_evidence=v_media.quality_evidence
    WHERE id=v_lesson.id AND course_id=v_course_id;
    IF NOT EXISTS (SELECT 1 FROM public.course_lessons WHERE id=v_lesson.id AND course_id=v_course_id
      AND video_url=v_row.video_url AND status='published'
      AND content_json->>'contractVersion'=p_package->>'contractVersion') THEN
      RAISE EXCEPTION 'ULTIMATE_CANONICAL_PUBLICATION_READBACK_FAILED';
    END IF;
    -- The next loop must not reuse the preceding row when no media row exists.
    v_existing_media := NULL;
  END LOOP;

  IF v_partial THEN
    IF p_fence IS NOT NULL AND v_job.lease_expires_at<=clock_timestamp() THEN
      RAISE EXCEPTION 'ULTIMATE_JOB_LEASE_LOST';
    END IF;
    RETURN jsonb_build_object('scope','lesson','lessonIds',v_partial_ids,'committedAt',v_now);
  END IF;

  SELECT coalesce(max(version),0)+1 INTO v_version FROM public.ultimate_release_versions WHERE course_id=v_course_id;
  UPDATE public.ultimate_release_versions SET status='superseded' WHERE course_id=v_course_id AND status='released';
  INSERT INTO public.ultimate_release_versions(build_id,course_id,version,package,status,released_by,rolled_back_from)
    VALUES(v_build_id,v_course_id,v_version,p_package,'released',p_actor,p_rolled_back_from) RETURNING * INTO v_release;
  UPDATE public.courses SET status='published',is_active=true,review_status='approved',
    generation_status='published',generation_progress=100,published_at=v_now,published_by=p_actor,
    version=v_version,total_lessons=v_expected,updated_at=v_now WHERE id=v_course_id;
  IF p_rolled_back_from IS NULL THEN
    UPDATE public.ultimate_course_builds SET status='published',updated_at=v_now WHERE id=v_build_id AND course_id=v_course_id;
  END IF;
  IF p_fence IS NOT NULL AND v_job.lease_expires_at<=clock_timestamp() THEN
    RAISE EXCEPTION 'ULTIMATE_JOB_LEASE_LOST';
  END IF;
  RETURN to_jsonb(v_release);
END $function$
;

CREATE OR REPLACE FUNCTION public.consume_ultimate_media_wakeup()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
BEGIN
  -- One failed lesson must not block the other lessons in an active pool.
  IF NEW.payload->'autopilot' IS NOT NULL AND NEW.pending_dependency_resume IS NULL THEN
    RETURN NEW;
  END IF;
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
END $function$
;

CREATE OR REPLACE FUNCTION public.ultimate_attach_lesson_media(p_lesson uuid, p_artifacts jsonb, p_job uuid DEFAULT NULL::uuid, p_worker text DEFAULT NULL::text, p_generation bigint DEFAULT NULL::bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 j public.ultimate_build_jobs%ROWTYPE;
 l public.ultimate_lesson_builds%ROWTYPE;
 b public.ultimate_course_builds%ROWTYPE;
 c public.course_lessons%ROWTYPE;
 canonical uuid;
 film jsonb;
 playback text;
 narration jsonb;
 assessment jsonb;
 questions jsonb;
 merged_questions jsonb;
 checks jsonb;
 reassessment jsonb;
BEGIN
 IF coalesce(auth.role(),'') <> 'service_role' THEN
  RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_SERVICE_ROLE_REQUIRED' USING ERRCODE='42501';
 END IF;
 IF p_job IS NOT NULL THEN
  SELECT * INTO j FROM public.ultimate_build_jobs WHERE id=p_job FOR UPDATE;
  IF NOT FOUND OR j.status <> 'running' OR j.lease_owner IS DISTINCT FROM p_worker
   OR j.execution_generation IS DISTINCT FROM p_generation
   OR j.lease_expires_at IS NULL OR j.lease_expires_at <= clock_timestamp() THEN
   RAISE EXCEPTION 'ULTIMATE_JOB_LEASE_LOST' USING ERRCODE='42501';
  END IF;
 END IF;
 SELECT * INTO l FROM public.ultimate_lesson_builds WHERE id=p_lesson;
 IF NOT FOUND THEN RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_LESSON_REQUIRED'; END IF;
 IF p_job IS NOT NULL THEN PERFORM public.ultimate_assert_autopilot_scope(p_job,p_lesson,l.competency_id,true); END IF;
 SELECT * INTO b FROM public.ultimate_course_builds WHERE id=l.build_id FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_BUILD_REQUIRED'; END IF;
 IF p_job IS NOT NULL THEN
  IF j.build_id IS DISTINCT FROM b.id THEN RAISE EXCEPTION 'ULTIMATE_FENCE_BUILD_MISMATCH'; END IF;
  IF b.profile->>'ownerPaused'='true' THEN RAISE EXCEPTION 'OWNER_PAUSED_REFERENCE_BUILD'; END IF;
 ELSE
  -- Administrative recovery only on a paused, idle build. This cannot resume
  -- generation, change a pause, approve a lesson, or publish a course.
  IF b.profile->>'ownerPaused' IS DISTINCT FROM 'true' OR EXISTS (
   SELECT 1 FROM public.ultimate_build_jobs WHERE build_id=b.id AND status='running'
    AND lease_expires_at > clock_timestamp()
  ) THEN RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_RECOVERY_REQUIRES_PAUSED_IDLE_BUILD'; END IF;
 END IF;
 SELECT * INTO l FROM public.ultimate_lesson_builds WHERE id=p_lesson FOR UPDATE;
 IF l.status IS DISTINCT FROM 'built' OR l.artifacts IS DISTINCT FROM p_artifacts THEN
  RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_ACCEPTED_ARTIFACT_CHANGED';
 END IF;
 film := l.artifacts->'lesson_film_render'->'render';
 narration := l.artifacts->'natural_narration'->'narration';
 IF film->>'success' IS DISTINCT FROM 'true'
  OR nullif(film->>'videoUrl','') IS NULL
  OR nullif(film->>'captionsUrl','') IS NULL
  OR nullif(film->>'transcriptUrl','') IS NULL
  OR l.artifacts->'finished_media_qa'->'mediaQA'->>'pass' IS DISTINCT FROM 'true'
  OR l.artifacts->'narration_qa'->'narrationQA'->>'pass' IS DISTINCT FROM 'true'
  OR jsonb_typeof(narration->'segments') IS DISTINCT FROM 'array'
  OR jsonb_array_length(narration->'segments')=0 THEN
  RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_VERIFIED_MEDIA_REQUIRED';
 END IF;
 canonical := nullif(b.profile->'canonicalLessonIds'->>l.competency_id,'')::uuid;
 IF canonical IS NULL THEN RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_CANONICAL_MAPPING_REQUIRED'; END IF;
 SELECT * INTO c FROM public.course_lessons WHERE id=canonical AND course_id=b.course_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_CANONICAL_LESSON_REQUIRED'; END IF;
 -- Never replace a published or owner-approved film through draft attachment.
 IF c.is_published IS TRUE OR c.approved IS TRUE OR c.status='published' THEN
  IF nullif(c.video_url,'') IS NULL THEN RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_PUBLISHED_MEDIA_MISSING'; END IF;
  RETURN jsonb_build_object('lessonId',c.id,'videoUrl',c.video_url,'preservedPublished',true);
 END IF;
 -- Media-only drafts hid the quiz until the full course release. Use the same
 -- accepted checkpoint, preserving existing question IDs and draft status.
 assessment := l.artifacts#>'{assessment_alignment,assessment}';
 IF jsonb_typeof(assessment->'questions') IS DISTINCT FROM 'array'
  OR jsonb_array_length(assessment->'questions')=0
  OR jsonb_typeof(assessment->'reassessment') IS DISTINCT FROM 'array'
  OR jsonb_array_length(assessment->'reassessment')=0
  OR coalesce(assessment->>'passingScore','') !~ '^[0-9]+$' THEN
  RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_ASSESSMENT_REQUIRED';
 END IF;
 IF (assessment->>'passingScore')::integer NOT BETWEEN 1 AND 100 THEN
  RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_ASSESSMENT_REQUIRED';
 END IF;
 IF EXISTS (SELECT 1 FROM jsonb_array_elements((assessment->'questions')||(assessment->'reassessment')) q
  WHERE nullif(btrim(q->>'id'),'') IS NULL OR nullif(btrim(q->>'prompt'),'') IS NULL
   OR jsonb_typeof(q->'choices') IS DISTINCT FROM 'array'
   OR nullif(btrim(q->>'explanation'),'') IS NULL
   OR nullif(btrim(q->>'remediation'),'') IS NULL
   OR coalesce(q->>'answerIndex','') !~ '^[0-9]+$') THEN
  RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_ASSESSMENT_REQUIRED';
 END IF;
 IF EXISTS (SELECT 1 FROM jsonb_array_elements((assessment->'questions')||(assessment->'reassessment')) q
  WHERE jsonb_array_length(q->'choices')<2
   OR (q->>'answerIndex')::integer >= jsonb_array_length(q->'choices')) THEN
  RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_ASSESSMENT_REQUIRED';
 END IF;
 SELECT jsonb_agg(q || jsonb_build_object(
  'id','ultimate:'||l.id::text||':'||(q->>'id'),
  'question',q->>'prompt','options',q->'choices','correctAnswer',(q->>'answerIndex')::integer))
 INTO questions FROM jsonb_array_elements(assessment->'questions') q;
 SELECT jsonb_agg(q || jsonb_build_object('question',q->>'prompt','options',q->'choices','correct',(q->>'answerIndex')::integer))
 INTO checks FROM jsonb_array_elements(assessment->'questions') q;
 SELECT jsonb_agg(q || jsonb_build_object('question',q->>'prompt','options',q->'choices','correct',(q->>'answerIndex')::integer))
 INTO reassessment FROM jsonb_array_elements(assessment->'reassessment') q;
 SELECT coalesce(jsonb_agg(q),'[]'::jsonb) INTO merged_questions
 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(c.quiz_questions)='array' THEN c.quiz_questions ELSE '[]'::jsonb END) q
 WHERE NOT EXISTS (SELECT 1 FROM jsonb_array_elements(questions) n WHERE n->>'id'=q->>'id');
 merged_questions := merged_questions || questions;
 playback := '/api/courses/'||b.course_id::text||'/lessons/'||c.id::text||'/playback';
 UPDATE public.course_lessons SET
  video_url=playback,
  video_status='complete', video_error=NULL,
  quiz_questions=merged_questions, passing_score=(assessment->>'passingScore')::integer,
  duration_seconds=ceil((film->>'duration')::numeric)::integer,
  script_text=coalesce(l.artifacts->'instructor_script'->'script'->>'script',script_text),
  scene_data=film->'sceneData',
  content_json=coalesce(content_json,'{}'::jsonb)||jsonb_build_object(
   'film',jsonb_build_object('videoUrl',film->>'videoUrl','playbackUrl',playback,
    'captionsUrl',film->>'captionsUrl','transcriptUrl',film->>'transcriptUrl'),
   'mediaAttachment',jsonb_build_object('buildId',b.id,'sourceLessonBuildId',l.id,
    'attachedAt',now(),'publicationPending',true),
   'savedNarration',narration,
   'assessment',assessment,
   'experience',coalesce(content_json->'experience','{}'::jsonb)||jsonb_build_object(
    'knowledgeChecks',checks,'reassessment',reassessment,
    'learningActivities',l.artifacts->'active_teaching'->'activities')),
  updated_at=now()
 WHERE id=c.id AND course_id=b.course_id;
 SELECT * INTO c FROM public.course_lessons WHERE id=canonical AND course_id=b.course_id;
 IF c.video_url IS DISTINCT FROM playback
  OR c.content_json->'film'->>'videoUrl' IS DISTINCT FROM film->>'videoUrl'
  OR c.content_json->'mediaAttachment'->>'sourceLessonBuildId' IS DISTINCT FROM l.id::text
  OR c.content_json->'film'->>'captionsUrl' IS DISTINCT FROM film->>'captionsUrl'
  OR c.content_json->'film'->>'transcriptUrl' IS DISTINCT FROM film->>'transcriptUrl'
  OR c.content_json->'savedNarration' IS DISTINCT FROM narration
  OR c.video_status IS DISTINCT FROM 'complete'
  OR c.quiz_questions IS DISTINCT FROM merged_questions
  OR c.passing_score IS DISTINCT FROM (assessment->>'passingScore')::integer
  OR c.content_json->'assessment' IS DISTINCT FROM assessment
  OR c.content_json#>'{experience,knowledgeChecks}' IS DISTINCT FROM checks
  OR c.content_json#>'{experience,reassessment}' IS DISTINCT FROM reassessment THEN
  RAISE EXCEPTION 'ULTIMATE_ATTACHMENT_READBACK_FAILED';
 END IF;
 RETURN jsonb_build_object('lessonId',c.id,'videoUrl',c.video_url,'sourceLessonBuildId',l.id,
  'preservedPublished',false,'publicationPending',true);
END
$function$
;

CREATE OR REPLACE FUNCTION public.ultimate_fenced_write(p_job uuid, p_worker text, p_generation bigint, p_action text, p_target uuid, p_data jsonb DEFAULT '{}'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
 v_job public.ultimate_build_jobs%ROWTYPE;
 v_build uuid;
 v_id uuid;
 v_findings jsonb;
BEGIN
 IF auth.role() <> 'service_role' THEN
   RAISE EXCEPTION 'ULTIMATE_FENCE_SERVICE_ROLE_REQUIRED' USING ERRCODE='42501';
 END IF;
 SELECT * INTO v_job FROM public.ultimate_build_jobs
 WHERE id=p_job FOR UPDATE;
 IF NOT FOUND OR v_job.status <> 'running' OR
    v_job.lease_owner IS DISTINCT FROM p_worker OR
    v_job.execution_generation IS DISTINCT FROM p_generation OR
    v_job.lease_expires_at IS NULL OR v_job.lease_expires_at <= clock_timestamp() THEN
   RAISE EXCEPTION 'ULTIMATE_JOB_LEASE_LOST' USING ERRCODE='42501';
 END IF;
 v_build := v_job.build_id;
 IF v_job.payload->'autopilot' IS NOT NULL THEN
   IF p_action='create_lesson' THEN
     PERFORM public.ultimate_assert_autopilot_scope(p_job,NULL,p_data->>'competencyId');
   ELSIF p_action IN ('record_step','save_artifact','finish_lesson') THEN
     PERFORM public.ultimate_assert_autopilot_scope(p_job,p_target);
   ELSIF p_action='update_profile' THEN
     RAISE EXCEPTION 'ULTIMATE_AUTOPILOT_IMMUTABLE_PROFILE';
   ELSIF p_action='update_build' THEN
     -- The coordinator owns aggregate status. A partial role cannot mark the
     -- course built or replace findings written by another lesson.
     RETURN jsonb_build_object('ok',true,'aggregateOwnedByCoordinator',true);
   END IF;
 END IF;
 IF p_action = 'create_lesson' THEN
   IF p_target IS DISTINCT FROM v_build THEN
     RAISE EXCEPTION 'ULTIMATE_FENCE_BUILD_MISMATCH';
   END IF;
   INSERT INTO public.ultimate_lesson_builds
      (build_id,lesson_key,competency_id,status)
   VALUES (v_build,p_data->>'lessonKey',p_data->>'competencyId','running')
   ON CONFLICT (build_id,lesson_key)
   DO UPDATE SET status='running'
   RETURNING id INTO v_id;
   RETURN jsonb_build_object('id',v_id);
 ELSIF p_action IN ('record_step','save_artifact','finish_lesson') THEN
   IF NOT EXISTS (SELECT 1 FROM public.ultimate_lesson_builds
     WHERE id=p_target AND build_id=v_build) THEN
     RAISE EXCEPTION 'ULTIMATE_FENCE_LESSON_MISMATCH';
   END IF;
   IF p_action = 'record_step' THEN
     INSERT INTO public.ultimate_lesson_steps
       (lesson_build_id,step,state,artifacts,findings,started_at,completed_at)
     VALUES (p_target,p_data->>'step',p_data->>'state',
       coalesce(p_data->'artifacts','{}'::jsonb),
       coalesce(p_data->'findings','[]'::jsonb),
       CASE WHEN p_data->>'state'='running' THEN now() END,
       CASE WHEN p_data->>'state' IN ('passed','failed') THEN now() END)
     ON CONFLICT (lesson_build_id,step)
     DO UPDATE SET state=EXCLUDED.state,artifacts=EXCLUDED.artifacts,
       findings=EXCLUDED.findings,started_at=coalesce(EXCLUDED.started_at,public.ultimate_lesson_steps.started_at),
       completed_at=EXCLUDED.completed_at;
   ELSIF p_action = 'save_artifact' THEN
     UPDATE public.ultimate_lesson_builds
       SET artifacts=coalesce(p_data->'artifacts','{}'::jsonb),updated_at=now()
     WHERE id=p_target;
   ELSE
     UPDATE public.ultimate_lesson_builds
       SET status=p_data->>'status',artifacts=coalesce(p_data->'artifacts','{}'::jsonb),
       findings=coalesce(p_data->'findings','[]'::jsonb),updated_at=now()
     WHERE id=p_target;
   END IF;
 ELSIF p_action IN ('update_build','record_finding','update_profile') THEN
   IF p_target IS DISTINCT FROM v_build THEN
     RAISE EXCEPTION 'ULTIMATE_FENCE_BUILD_MISMATCH';
   END IF;
   IF p_action = 'update_profile' THEN
     UPDATE public.ultimate_course_builds SET profile=p_data->'profile',updated_at=now() WHERE id=v_build;
   ELSIF p_action = 'record_finding' THEN
     UPDATE public.ultimate_course_builds
     SET findings=CASE WHEN coalesce(findings,'[]'::jsonb) @> jsonb_build_array(p_data->'finding') THEN findings ELSE coalesce(findings,'[]'::jsonb) || jsonb_build_array(p_data->'finding') END,
         updated_at=now()
     WHERE id=v_build;
   ELSE
     UPDATE public.ultimate_course_builds
     SET status=p_data->>'status',
       current_step=CASE WHEN p_data ? 'currentStep' THEN p_data->>'currentStep' ELSE current_step END,
       findings=CASE WHEN p_data ? 'findings' THEN p_data->'findings' ELSE findings END,
       updated_at=now()
     WHERE id=v_build;
   END IF;
 ELSE
   RAISE EXCEPTION 'ULTIMATE_FENCE_INVALID_ACTION:%',p_action;
 END IF;
 RETURN jsonb_build_object('ok',true);
END
$function$
;

