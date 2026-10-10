-- The Admin server calls the audited verifier as service_role with the signed-in
-- administrator's identity. PostgREST cannot set session_replication_role.
-- Keep every integrity trigger enabled and authorize that existing server path
-- explicitly. This migration does not approve or change any recorded hours.
CREATE OR REPLACE FUNCTION public.lock_verification_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status OR
     NEW.verified_by IS DISTINCT FROM OLD.verified_by OR
     NEW.verified_at IS DISTINCT FROM OLD.verified_at THEN
    IF NEW.status = 'verified' OR NEW.verified_by IS NOT NULL OR NEW.verified_at IS NOT NULL THEN
      IF current_setting('role', true) = 'service_role' AND
         coalesce(auth.role(), '') = 'service_role' THEN
        IF OLD.status IS DISTINCT FROM 'submitted' OR NEW.status IS DISTINCT FROM 'verified' OR
           NEW.verified_at IS NULL OR NOT EXISTS (
             SELECT 1 FROM public.profiles
             WHERE id = NEW.verified_by AND lower(role::text) IN ('admin', 'super_admin')
           ) THEN
          RAISE EXCEPTION 'Valid admin approver identity and submitted entry required' USING ERRCODE = '42501';
        END IF;
        IF (to_jsonb(NEW) - ARRAY['status', 'verified_by', 'verified_at', 'updated_at']) IS DISTINCT FROM
           (to_jsonb(OLD) - ARRAY['status', 'verified_by', 'verified_at', 'updated_at']) THEN
          RAISE EXCEPTION 'Approval must preserve the reviewed entry' USING ERRCODE = '23514';
        END IF;
      ELSIF NOT public.can_verify_progress_entry(NEW.partner_id) THEN
        RAISE EXCEPTION 'Not authorized to verify hours' USING ERRCODE = '42501';
      END IF;
      IF NEW.status = 'verified' THEN
        NEW.verified_by := coalesce(NEW.verified_by, auth.uid());
        NEW.verified_at := coalesce(NEW.verified_at, now());
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_approve_progress_entries(p_ids uuid[], p_approver_id uuid DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer := 0;
  v_approver_id uuid;
  v_entry public.progress_entries%ROWTYPE;
  v_after jsonb;
  v_jwt_role text := coalesce(auth.role(), '');
BEGIN
  IF p_ids IS NULL OR cardinality(p_ids) = 0 THEN RETURN 0; END IF;
  IF v_jwt_role = 'service_role' THEN
    v_approver_id := p_approver_id;
    IF v_approver_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = v_approver_id AND lower(coalesce(p.role::text, '')) IN ('admin', 'super_admin')
    ) THEN
      RAISE EXCEPTION 'Valid admin approver identity is required' USING ERRCODE = '42501';
    END IF;
  ELSE
    IF auth.uid() IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND lower(coalesce(p.role::text, '')) IN ('admin', 'super_admin')
    ) THEN
      RAISE EXCEPTION 'Admin role required to approve progress entries' USING ERRCODE = '42501';
    END IF;
    v_approver_id := auth.uid();
  END IF;

  FOR v_entry IN
    SELECT * FROM public.progress_entries
    WHERE id = ANY(p_ids) AND status = 'submitted'
    ORDER BY id FOR UPDATE
  LOOP
    UPDATE public.progress_entries AS pe
    SET status = 'verified', verified_by = v_approver_id, verified_at = now(), updated_at = now()
    WHERE pe.id = v_entry.id
    RETURNING to_jsonb(pe) INTO v_after;

    -- Check after all BEFORE triggers, including legacy clock-hour derivation.
    IF (v_after - ARRAY['status', 'verified_by', 'verified_at', 'updated_at']) IS DISTINCT FROM
       (to_jsonb(v_entry) - ARRAY['status', 'verified_by', 'verified_at', 'updated_at']) THEN
      RAISE EXCEPTION 'Approval must preserve the reviewed entry' USING ERRCODE = '23514';
    END IF;
    INSERT INTO public.audit_logs(action, actor_id, target_type, target_id, metadata, before_state, after_state, created_at)
    VALUES ('apprenticeship.progress_entry.approved', v_approver_id, 'progress_entry', v_entry.id::text,
      jsonb_build_object('apprentice_id', v_entry.apprentice_id, 'program_id', v_entry.program_id,
        'week_ending', v_entry.week_ending, 'hours_worked', v_entry.hours_worked),
      to_jsonb(v_entry), v_after, now());
    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_approve_progress_entries(uuid[], uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_approve_progress_entries(uuid[], uuid) TO service_role;
COMMENT ON FUNCTION public.admin_approve_progress_entries(uuid[], uuid) IS
  'Audited admin verification with integrity triggers enabled; preserves all reviewed entry values.';
