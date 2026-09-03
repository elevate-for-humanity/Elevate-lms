CREATE OR REPLACE FUNCTION public.get_weekly_hours(p_apprentice_id uuid, p_week_ending date)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'pg_catalog', 'public', 'private', 'auth'
AS $$
DECLARE
  v_total numeric;
  v_user_id uuid;
BEGIN
  SELECT a.user_id
    INTO v_user_id
  FROM public.apprentices a
  WHERE a.id = p_apprentice_id;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Apprentice identity not found' USING errcode='P0002';
  END IF;

  PERFORM private.assert_self_or_educator(v_user_id);

  SELECT coalesce(sum(pe.hours_worked), 0)
    INTO v_total
  FROM public.progress_entries pe
  WHERE pe.apprentice_id = p_apprentice_id
    AND pe.week_ending = p_week_ending
    AND pe.clock_out_at IS NOT NULL;

  RETURN v_total;
END;
$$;

REVOKE ALL ON FUNCTION public.get_weekly_hours(uuid, date) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_weekly_hours(uuid, date) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_weekly_hours(uuid, date) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_weekly_hours(uuid, date) TO service_role;
