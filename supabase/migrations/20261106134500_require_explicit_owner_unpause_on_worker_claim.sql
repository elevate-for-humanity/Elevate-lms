-- Prevent a missing ownerPaused field from authorizing paid worker claims.
-- Preserve the existing lease, generation fencing, history and role-selection logic.
-- Deliberately fail closed if another environment has modified this function.
DO $migration$
DECLARE
  v_definition text;
  v_old text := 'AND b.profile->>''ownerPaused'' IS DISTINCT FROM ''true''';
  v_new text := 'AND b.profile->>''ownerPaused'' = ''false''';
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO v_definition
  FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
  WHERE n.nspname='public' AND p.proname='claim_ultimate_course_role_job'
    AND pg_get_function_identity_arguments(p.oid)='p_worker text, p_lease_seconds integer, p_role text';
  IF v_definition IS NULL THEN
    RAISE EXCEPTION 'ULTIMATE_CLAIM_FUNCTION_NOT_FOUND';
  END IF;
  IF (length(v_definition)-length(replace(v_definition,v_old,'')))<>length(v_old)
     OR position(v_new IN v_definition)>0 THEN
    RAISE EXCEPTION 'ULTIMATE_CLAIM_FUNCTION_CHANGED_REVIEW_REQUIRED';
  END IF;
  EXECUTE replace(v_definition,v_old,v_new);
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.proname='claim_ultimate_course_role_job'
      AND position(v_new IN pg_get_functiondef(p.oid))>0
  ) THEN RAISE EXCEPTION 'ULTIMATE_CLAIM_UNPAUSE_GUARD_NOT_APPLIED';
  END IF;
END $migration$;
