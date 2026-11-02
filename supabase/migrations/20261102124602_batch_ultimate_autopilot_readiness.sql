-- Evaluate the exact claim predicate in one database request, not one network
-- round trip for each queued job. Actual claims still recheck ownership.
CREATE OR REPLACE FUNCTION public.ultimate_autopilot_ready_jobs(p_jobs uuid[])
RETURNS SETOF uuid LANGUAGE plpgsql SECURITY INVOKER SET search_path='' AS $$
BEGIN
 IF coalesce(cardinality(p_jobs),0)>1000 THEN RAISE EXCEPTION 'ULTIMATE_READINESS_BATCH_TOO_LARGE'; END IF;
 RETURN QUERY SELECT j.id FROM public.ultimate_build_jobs j
 WHERE j.id=ANY(p_jobs) AND public.ultimate_autopilot_job_ready(j.id)
 ORDER BY array_position(p_jobs,j.id);
END $$;
REVOKE ALL ON FUNCTION public.ultimate_autopilot_ready_jobs(uuid[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.ultimate_autopilot_ready_jobs(uuid[]) TO service_role;
NOTIFY pgrst, 'reload schema';
