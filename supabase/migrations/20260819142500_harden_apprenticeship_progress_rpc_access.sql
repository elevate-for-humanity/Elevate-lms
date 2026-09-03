DO $$
BEGIN
  IF to_regprocedure('public.calculate_apprentice_progress_internal(uuid)') IS NULL
     AND to_regprocedure('public.calculate_apprentice_progress(uuid)') IS NOT NULL THEN
    ALTER FUNCTION public.calculate_apprentice_progress(uuid)
      RENAME TO calculate_apprentice_progress_internal;
  END IF;
END $$;

REVOKE ALL ON FUNCTION public.calculate_apprentice_progress_internal(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.calculate_apprentice_progress_internal(uuid) FROM anon;
REVOKE ALL ON FUNCTION public.calculate_apprentice_progress_internal(uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_apprentice_progress_internal(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.calculate_apprentice_progress(apprentice_id uuid)
RETURNS TABLE(
  ojt_percent numeric,
  rti_percent numeric,
  overall_percent numeric,
  estimated_completion date
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT ra.user_id
    INTO v_user_id
  FROM public.rapids_apprentices ra
  WHERE ra.id = apprentice_id;

  IF v_user_id IS NULL THEN
    RETURN;
  END IF;

  PERFORM private.assert_self_or_educator(v_user_id);

  RETURN QUERY
  SELECT *
  FROM public.calculate_apprentice_progress_internal(apprentice_id);
END;
$$;

REVOKE ALL ON FUNCTION public.calculate_apprentice_progress(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.calculate_apprentice_progress(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.calculate_apprentice_progress(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_apprentice_progress(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.check_can_match_apprentice(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_can_match_apprentice(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.check_can_match_apprentice(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_can_match_apprentice(uuid, uuid) TO service_role;
