-- Keep the existing privileged, audited verifier and add atomic ledger sync.
-- The browser supplies entry IDs only; the guarded server supplies the session actor.
-- No hour approvals or student-specific IDs are embedded in this migration.
CREATE OR REPLACE FUNCTION public.admin_verify_apprenticeship_hours(p_ids uuid[], p_approver_id uuid, p_expected jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entry public.progress_entries%ROWTYPE;
  v_ledger public.hour_entries%ROWTYPE;
  v_ledger_ids uuid[];
  v_user_id uuid;
  v_program public.programs%ROWTYPE;
  v_email text;
  v_shop_id uuid;
  v_count integer := 0;
  v_after jsonb;
BEGIN
  IF coalesce(auth.role(), '') <> 'service_role' OR NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_approver_id AND lower(role::text) IN ('admin', 'super_admin')
  ) THEN
    RAISE EXCEPTION 'Authenticated admin approver required' USING ERRCODE = '42501';
  END IF;
  IF p_ids IS NULL OR cardinality(p_ids) NOT BETWEEN 1 AND 200 THEN
    RAISE EXCEPTION 'Select between 1 and 200 entries' USING ERRCODE = '22023';
  END IF;
  IF jsonb_typeof(p_expected) IS DISTINCT FROM 'array' OR jsonb_array_length(p_expected) <> cardinality(p_ids) THEN
    RAISE EXCEPTION 'Reviewed values required' USING ERRCODE = '22023';
  END IF;
  -- Serialize eligibility checks with shifts being edited/submitted during approval.
  LOCK TABLE public.progress_entries IN SHARE ROW EXCLUSIVE MODE;
  IF (SELECT count(*) FROM public.progress_entries WHERE id = ANY(p_ids)) <>
     (SELECT count(DISTINCT id) FROM unnest(p_ids) id) THEN
    RAISE EXCEPTION 'An entry no longer exists; refresh the queue' USING ERRCODE = 'P0001';
  END IF;

  FOR v_entry IN SELECT * FROM public.progress_entries WHERE id = ANY(p_ids) ORDER BY id FOR UPDATE LOOP
    IF v_entry.status = 'verified' THEN CONTINUE; END IF; -- Retry is idempotent.
    IF (SELECT count(*) FROM jsonb_array_elements(p_expected) x WHERE x->>'id' = v_entry.id::text) <> 1 OR
       NOT EXISTS (SELECT 1 FROM jsonb_array_elements(p_expected) x WHERE x->>'id' = v_entry.id::text AND
         x = jsonb_build_object('id', v_entry.id, 'apprentice_id', v_entry.apprentice_id, 'program_id', v_entry.program_id,
           'work_date', v_entry.work_date, 'week_ending', v_entry.week_ending, 'hours_worked', v_entry.hours_worked,
           'notes', v_entry.notes, 'tasks_completed', v_entry.tasks_completed,
           'clock_in_at', v_entry.clock_in_at, 'clock_out_at', v_entry.clock_out_at)) THEN
      RAISE EXCEPTION 'Reviewed entry has changed; refresh the queue' USING ERRCODE = 'P0001';
    END IF;
    IF v_entry.status IS DISTINCT FROM 'submitted' OR v_entry.hours_worked <= 0 OR
       (v_entry.clock_in_at IS NOT NULL AND v_entry.clock_out_at IS NULL) THEN
      RAISE EXCEPTION 'An entry is no longer ready for approval; refresh the queue' USING ERRCODE = 'P0001';
    END IF;
    SELECT coalesce((SELECT a.user_id FROM public.apprentices a WHERE a.id = v_entry.apprentice_id), v_entry.apprentice_id)
      INTO v_user_id;
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_user_id) THEN
      RAISE EXCEPTION 'Student identity must be resolved before approval' USING ERRCODE = 'P0001';
    END IF;
    SELECT * INTO v_program FROM public.programs
      WHERE id::text = lower(btrim(v_entry.program_id)) OR lower(slug) = lower(btrim(v_entry.program_id)) LIMIT 1;
    IF NOT FOUND OR v_program.slug IS NULL THEN
      RAISE EXCEPTION 'Program identity must be resolved before approval' USING ERRCODE = 'P0001';
    END IF;
    IF EXISTS (
      SELECT 1 FROM public.progress_entries other
      LEFT JOIN public.apprentices a ON a.id = other.apprentice_id
      WHERE other.id <> v_entry.id AND other.status IN ('submitted', 'verified') AND other.hours_worked > 0
        AND coalesce(a.user_id, other.apprentice_id) = v_user_id AND other.work_date = v_entry.work_date
        AND lower(btrim(other.program_id)) IN (v_program.id::text, lower(v_program.slug))
    ) THEN
      RAISE EXCEPTION 'Multiple entries for this student, program and date require review' USING ERRCODE = 'P0001';
    END IF;
    SELECT array_agg(id) INTO v_ledger_ids FROM public.hour_entries
      WHERE progress_entry_id = v_entry.id OR id = v_entry.hour_entry_id OR
        (legacy_source = 'progress_entries' AND legacy_id = v_entry.id);
    IF EXISTS (SELECT 1 FROM public.hour_entries h WHERE h.user_id = v_user_id AND
      lower(h.program_slug) = lower(v_program.slug) AND h.work_date = v_entry.work_date AND
      h.status IN ('pending','approved','locked') AND h.source_type IN ('ojl','timeclock','manual','host_shop') AND
      NOT (h.id = ANY(coalesce(v_ledger_ids, ARRAY[]::uuid[])))) THEN
      RAISE EXCEPTION 'Another ledger entry for this work date requires reconciliation' USING ERRCODE = 'P0001';
    END IF;
    IF coalesce(cardinality(v_ledger_ids), 0) > 1 THEN
      RAISE EXCEPTION 'Multiple linked ledger entries require review' USING ERRCODE = 'P0001';
    END IF;
    IF coalesce(cardinality(v_ledger_ids), 0) = 1 THEN
      SELECT * INTO v_ledger FROM public.hour_entries WHERE id = v_ledger_ids[1] FOR UPDATE;
      IF v_ledger.user_id IS DISTINCT FROM v_user_id OR v_ledger.work_date IS DISTINCT FROM v_entry.work_date OR
         v_ledger.hours_claimed IS DISTINCT FROM v_entry.hours_worked OR
         lower(v_ledger.program_slug) IS DISTINCT FROM lower(v_program.slug) OR
         (v_ledger.progress_entry_id IS NOT NULL AND v_ledger.progress_entry_id <> v_entry.id) OR
         (v_ledger.legacy_source = 'progress_entries' AND v_ledger.legacy_id IS DISTINCT FROM v_entry.id) OR
         v_ledger.status NOT IN ('pending', 'approved', 'locked') OR
         (v_ledger.status IN ('approved', 'locked') AND v_ledger.accepted_hours IS DISTINCT FROM v_entry.hours_worked) THEN
        RAISE EXCEPTION 'Linked ledger hours require reconciliation before approval' USING ERRCODE = 'P0001';
      END IF;
      IF v_ledger.status = 'pending' THEN
        UPDATE public.hour_entries SET status = 'approved', approval_status = 'approved',
          accepted_hours = hours_claimed, approved_by = p_approver_id::text,
          approved_by_user_id = p_approver_id, approved_by_role = 'admin', approved_at = now()
          WHERE id = v_ledger.id RETURNING to_jsonb(hour_entries) INTO v_after;
        INSERT INTO public.audit_logs(action, actor_id, target_type, target_id, before_state, after_state, metadata)
          VALUES ('apprenticeship.hours_ledger.approved', p_approver_id, 'hour_entry', v_ledger.id::text,
            to_jsonb(v_ledger), v_after, jsonb_build_object('progress_entry_id', v_entry.id));
      END IF;
    ELSE
      SELECT email INTO v_email FROM public.profiles WHERE id = v_entry.submitted_by;
      IF v_email IS NULL THEN
        RAISE EXCEPTION 'Submitter identity must be resolved before approval' USING ERRCODE = 'P0001';
      END IF;
      SELECT shop_id INTO v_shop_id FROM public.apprentice_sites WHERE id = v_entry.site_id;
      INSERT INTO public.hour_entries(user_id, program_slug, progress_entry_id, legacy_source, legacy_id,
        source_type, work_date, hours_claimed, accepted_hours, notes, entered_by_email,
        status, approval_status, approved_by, approved_by_user_id, approved_by_role, approved_at, host_shop_id)
      VALUES (v_user_id, v_program.slug, v_entry.id, 'progress_entries', v_entry.id,
        CASE WHEN v_entry.clock_in_at IS NULL THEN 'ojl' ELSE 'timeclock' END,
        v_entry.work_date, v_entry.hours_worked, v_entry.hours_worked, v_entry.notes, v_email,
        'approved', 'approved', p_approver_id::text, p_approver_id, 'admin', now(), v_shop_id)
      RETURNING * INTO v_ledger;
      INSERT INTO public.audit_logs(action, actor_id, target_type, target_id, after_state, metadata)
        VALUES ('apprenticeship.hours_ledger.created', p_approver_id, 'hour_entry', v_ledger.id::text,
          to_jsonb(v_ledger), jsonb_build_object('progress_entry_id', v_entry.id));
    END IF;
    -- Existing verifier preserves recorded hours and creates before/after audit evidence.
    -- Ledger integrity and locked-entry triggers above remain enabled.
    v_count := v_count + public.admin_approve_progress_entries(ARRAY[v_entry.id], p_approver_id);
  END LOOP;
  RETURN v_count;
END;
$$;
REVOKE ALL ON FUNCTION public.admin_verify_apprenticeship_hours(uuid[], uuid, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_verify_apprenticeship_hours(uuid[], uuid, jsonb) TO service_role;
