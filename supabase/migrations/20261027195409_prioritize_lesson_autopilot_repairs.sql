-- Prioritize verified producer repairs while unrelated lessons keep running.
SET LOCAL lock_timeout = '5s';
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
 UPDATE public.ultimate_build_jobs SET status='queued',priority=least(priority,5),attempts=0,available_at=now(),last_error=NULL,
  monitor=monitor||jsonb_build_object('state','awaiting_assignment','repairRequestedBy',j.id,'previousError',producer.last_error),updated_at=now()
 WHERE id=producer.id;
 RETURN jsonb_build_object('delegated',true,'producerJobId',producer.id,'role',role_name);
END $$;
REVOKE ALL ON FUNCTION public.delegate_ultimate_autopilot_repair(uuid,text,bigint,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.delegate_ultimate_autopilot_repair(uuid,text,bigint,jsonb) TO service_role;
