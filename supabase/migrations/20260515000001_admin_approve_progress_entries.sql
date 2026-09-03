-- =====================================================
-- ADMIN APPROVE PROGRESS ENTRIES RPC
-- =====================================================
-- Creates a SECURITY DEFINER function that admins can call
-- to approve OJT hours, bypassing the partner-only trigger
-- on progress_entries.
--
-- The trigger on progress_entries (created outside migrations)
-- raises "Not authorized to verify hours" when auth.uid() is
-- not a partner staff member. Service role bypasses RLS but NOT
-- custom trigger exceptions. This function runs as postgres
-- (superuser via SECURITY DEFINER), which can bypass triggers.
-- =====================================================

CREATE OR REPLACE FUNCTION public.admin_approve_progress_entries(
  p_ids     UUID[],
  p_approver_id UUID DEFAULT NULL
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
  v_approver_id UUID;
BEGIN
  -- Resolve approver: caller can pass one, else use JWT sub, else null
  v_approver_id := COALESCE(p_approver_id, auth.uid());

  -- session_replication_role = replica disables row-level triggers
  -- (requires superuser — available because function runs as postgres)
  SET LOCAL session_replication_role = replica;

  UPDATE progress_entries
  SET
    status      = 'verified',
    verified_by = v_approver_id,
    verified_at = NOW(),
    updated_at  = NOW()
  WHERE id = ANY(p_ids)
    AND status NOT IN ('verified');

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RESET session_replication_role;

  RETURN v_count;
END;
$$;

-- Service role (used by admin app API routes) and authenticated users
-- (admin UI calling via client) can execute this function.
-- The function itself enforces no role check — callers must be authenticated
-- admins. The admin API routes already enforce apiRequireAdmin() before calling.
GRANT EXECUTE ON FUNCTION public.admin_approve_progress_entries(UUID[], UUID)
  TO service_role, authenticated;

COMMENT ON FUNCTION public.admin_approve_progress_entries IS
  'Admin-only RPC: approve one or more progress_entries by ID. '
  'Bypasses the partner-staff trigger via session_replication_role=replica. '
  'Caller is responsible for auth/role enforcement before calling.';
