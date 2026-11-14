-- Stale application auto-archive function.
--
-- Applications that have received 2+ follow-up emails (next_step = 'call_required')
-- and have had no status change in 90+ days are moved to 'archived'.
-- Applications in terminal states (approved, rejected, enrolled, archived) are
-- never touched.
--
-- Called by POST /api/cron/stale-applications (admin app).
-- Apply in Supabase Dashboard → SQL Editor.

BEGIN;

CREATE OR REPLACE FUNCTION public.archive_stale_applications(
  p_stale_days integer DEFAULT 90
)
RETURNS TABLE (
  archived_count  integer,
  application_ids uuid[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cutoff        timestamptz;
  v_ids           uuid[];
  v_count         integer;
BEGIN
  v_cutoff := NOW() - (p_stale_days || ' days')::interval;

  -- Collect IDs: non-terminal applications older than the cutoff with
  -- at least 2 follow-ups sent and no recent status change.
  SELECT ARRAY_AGG(a.id)
  INTO v_ids
  FROM public.applications a
  WHERE a.status NOT IN ('approved', 'rejected', 'enrolled', 'archived', 'ready_to_enroll')
    AND a.updated_at < v_cutoff
    AND (
      -- Has been flagged for manual call after 2 failed follow-ups
      a.next_step = 'call_required'
      OR
      -- Or simply very old with no activity (belt-and-suspenders)
      a.created_at < v_cutoff
    )
    AND EXISTS (
      SELECT 1 FROM public.application_followups af
      WHERE af.application_id = a.id
      HAVING COUNT(*) >= 2
    );

  IF v_ids IS NULL OR array_length(v_ids, 1) = 0 THEN
    RETURN QUERY SELECT 0, '{}'::uuid[];
    RETURN;
  END IF;

  UPDATE public.applications
  SET
    status     = 'archived',
    is_active  = false,
    updated_at = NOW(),
    notes      = COALESCE(notes, '') ||
                 E'\n[auto-archived ' || TO_CHAR(NOW(), 'YYYY-MM-DD') ||
                 ': no response after ' || p_stale_days || ' days and 2+ follow-ups]'
  WHERE id = ANY(v_ids);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN QUERY SELECT v_count, v_ids;
END;
$$;

COMMENT ON FUNCTION public.archive_stale_applications IS
  'Archives applications with no response after p_stale_days days and 2+ follow-up emails. '
  'Called daily by the stale-applications cron. Never touches terminal statuses.';

COMMIT;
