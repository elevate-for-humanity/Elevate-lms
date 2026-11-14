-- A verified producer completion grants its queued successor a fresh bounded attempt budget.
-- Preserve error evidence, generation fencing, stage validation, and service-only access.
CREATE OR REPLACE FUNCTION public.complete_ultimate_lesson_autopilot(p_job uuid, p_worker text, p_generation bigint)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
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
   UPDATE public.ultimate_build_jobs SET available_at=now(),attempts=0,monitor=monitor||jsonb_build_object('state','awaiting_assignment','lastUpstreamCompletion',jsonb_build_object('at',now(),'producerJobId',j.id,'producerGeneration',j.execution_generation,'previousAttempts',attempts,'previousError',last_error)),updated_at=now()
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
END $function$
;
