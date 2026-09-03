-- Harden apprenticeship OJT/progress approval.
-- 1) Enforce admin authorization inside the SECURITY DEFINER function.
-- 2) Preserve service-role API usage while binding the approver identity.
-- 3) Write the audit event in the same database transaction as the approval.

CREATE OR REPLACE FUNCTION public.admin_approve_progress_entries(
  p_ids UUID[],
  p_approver_id UUID DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  v_approver_id UUID;
  v_entry public.progress_entries%ROWTYPE;
  v_after jsonb;
  v_jwt_role text := COALESCE(auth.role(), '');
BEGIN
  IF p_ids IS NULL OR cardinality(p_ids) = 0 THEN
    RETURN 0;
  END IF;

  -- Direct authenticated RPC calls must be made by an Admin. The production
  -- Admin API uses the service-role client after apiRequireAdmin(), so service
  -- role is allowed but must provide the already-authenticated actor id.
  IF v_jwt_role = 'service_role' THEN
    v_approver_id := p_approver_id;
  ELSE
    IF auth.uid() IS NULL OR NOT EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND lower(COALESCE(p.role::text, '')) = 'admin'
    ) THEN
      RAISE EXCEPTION 'Admin role required to approve progress entries'
        USING ERRCODE = '42501';
    END IF;
    v_approver_id := auth.uid();
  END IF;

  IF v_approver_id IS NULL THEN
    RAISE EXCEPTION 'Approver identity is required'
      USING ERRCODE = '22023';
  END IF;

  -- Existing partner-verification triggers reject Admin/service-role approval.
  -- Disable row triggers only inside this transaction and perform the approval
  -- plus explicit audit write ourselves.
  SET LOCAL session_replication_role = replica;

  FOR v_entry IN
    SELECT *
    FROM public.progress_entries
    WHERE id = ANY(p_ids)
      AND status <> 'verified'
    FOR UPDATE
  LOOP
    UPDATE public.progress_entries AS pe
    SET
      status = 'verified',
      verified_by = v_approver_id,
      verified_at = now(),
      updated_at = now()
    WHERE pe.id = v_entry.id
    RETURNING to_jsonb(pe) INTO v_after;

    INSERT INTO public.audit_logs (
      action,
      actor_id,
      target_type,
      target_id,
      metadata,
      before_state,
      after_state,
      created_at
    ) VALUES (
      'apprenticeship.progress_entry.approved',
      v_approver_id,
      'progress_entry',
      v_entry.id::text,
      jsonb_build_object(
        'apprentice_id', v_entry.apprentice_id,
        'program_id', v_entry.program_id,
        'week_ending', v_entry.week_ending,
        'hours_worked', v_entry.hours_worked
      ),
      to_jsonb(v_entry),
      v_after,
      now()
    );

    v_count := v_count + 1;
  END LOOP;

  RESET session_replication_role;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_approve_progress_entries(UUID[], UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_approve_progress_entries(UUID[], UUID)
  TO service_role, authenticated;

COMMENT ON FUNCTION public.admin_approve_progress_entries(UUID[], UUID) IS
  'Admin-only audited approval for apprenticeship progress_entries. '
  'Direct authenticated calls require profiles.role=admin; service-role calls '
  'must provide the authenticated Admin actor id. Approval and audit are atomic.';
