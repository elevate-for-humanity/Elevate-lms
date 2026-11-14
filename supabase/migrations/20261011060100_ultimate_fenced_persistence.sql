-- All worker-owned course mutations use one fenced transaction.
-- The row lock serializes claims/lease changes with writes.
CREATE OR REPLACE FUNCTION public.ultimate_fenced_write(
 p_job uuid, p_worker text, p_generation bigint,
 p_action text, p_target uuid, p_data jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $fn$
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
     SET findings=coalesce(findings,'[]'::jsonb) || jsonb_build_array(p_data->'finding'),
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
$fn$;
REVOKE ALL ON FUNCTION public.ultimate_fenced_write(uuid,text,bigint,text,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ultimate_fenced_write(uuid,text,bigint,text,uuid,jsonb) TO service_role;
