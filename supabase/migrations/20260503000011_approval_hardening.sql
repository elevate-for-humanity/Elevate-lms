-- Approval pipeline hardening.
--
-- Addresses:
-- 1. Migrates the direct DB hotfix: training_courses.program_id for CNA
-- 2. Adds unique constraint on partner_enrollments (partner_id, student_id, program_id)
-- 3. Rewrites approve_application_and_grant_access_atomic with:
--    - Explicit funding/payment gate (fail-closed) before any access grant
--    - ON CONFLICT on partner_enrollments using the new unique constraint
--    - All writes inside one plpgsql transaction block (implicit in plpgsql)
--    - FOR UPDATE row lock on applications at entry
-- 4. Rewrites revoke_application_access_atomic to match

-- ── 1. Migrate the direct hotfix ─────────────────────────────────────────────
-- The CNA training course was previously pointing to programs.slug='cna-cert'
-- (unpublished). This was corrected directly in the DB. This migration makes
-- that change reproducible.

UPDATE public.training_courses
SET program_id = (
  SELECT id FROM public.programs WHERE slug = 'cna' LIMIT 1
)
WHERE slug = 'cna-training-evening'
  AND program_id != (
    SELECT id FROM public.programs WHERE slug = 'cna' LIMIT 1
  );

-- ── 2. Unique constraint on partner_enrollments ───────────────────────────────
-- Without this, concurrent approvals can double-write partner_enrollments.
-- ON CONFLICT in the approval function depends on this constraint existing.

ALTER TABLE public.partner_enrollments
  ADD CONSTRAINT uq_partner_enrollments_partner_student_program
  UNIQUE (partner_id, student_id, program_id);

-- ── 3. Rewrite approve_application_and_grant_access_atomic ───────────────────
-- Changes from previous version:
-- - Funding gate: explicit check that application_financials.verification_status
--   = 'verified' BEFORE any state transition or enrollment write. Fail-closed.
-- - Compliance gate: all required requirement_codes must have status IN
--   ('verified','waived'). Fail-closed.
-- - partner_enrollments now uses ON CONFLICT on the new unique constraint.
-- - All writes remain inside the single plpgsql function call (one transaction).
-- - FOR UPDATE row lock on applications is the first DB write.

CREATE OR REPLACE FUNCTION public.approve_application_and_grant_access_atomic(
  p_application_id UUID,
  p_actor_user_id  UUID,
  p_request_id     TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_app            RECORD;
  v_course         RECORD;
  v_financial      RECORD;
  v_missing_reqs   TEXT[];
  v_program_id     UUID;
  v_cmi_partner_id UUID := '66685a9d-1b27-4c28-a7d7-2ee6287923bc';
  v_req_id         TEXT := COALESCE(p_request_id, gen_random_uuid()::TEXT);
BEGIN
  -- ── 1. Lock application row (prevents concurrent double-approval) ──────────
  SELECT * INTO v_app
  FROM public.applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','error','message','Application not found','request_id',v_req_id);
  END IF;

  -- ── 2. Idempotency ────────────────────────────────────────────────────────
  IF v_app.status IN ('approved','ready_to_enroll','enrolled') THEN
    RETURN jsonb_build_object('status','already_processed','application_id',p_application_id,'request_id',v_req_id);
  END IF;

  -- ── 3. Funding gate — fail closed ─────────────────────────────────────────
  -- No access is granted unless financial verification is on record and verified.
  -- This is checked directly here (not delegated to check_application_access_readiness)
  -- so the gate cannot be bypassed by changing the readiness function.
  SELECT * INTO v_financial
  FROM public.application_financials
  WHERE application_id = p_application_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'status',     'blocked',
      'blockers',   jsonb_build_array('FINANCIAL_RECORD_MISSING'),
      'request_id', v_req_id
    );
  END IF;

  IF v_financial.verification_status <> 'verified' THEN
    RETURN jsonb_build_object(
      'status',     'blocked',
      'blockers',   jsonb_build_array('FINANCIAL_NOT_VERIFIED:' || v_financial.verification_status),
      'request_id', v_req_id
    );
  END IF;

  -- ── 4. Compliance gate — fail closed ──────────────────────────────────────
  -- All required requirement_codes for this program must be verified or waived.
  SELECT array_agg(r.requirement_code ORDER BY r.requirement_code)
  INTO v_missing_reqs
  FROM public.program_requirement_rules r
  LEFT JOIN public.application_compliance_checks c
    ON c.application_id = p_application_id
   AND c.requirement_code = r.requirement_code
  WHERE r.program_slug = v_app.program_slug
    AND r.is_required = TRUE
    AND (c.id IS NULL OR c.status NOT IN ('verified','waived'));

  IF v_missing_reqs IS NOT NULL THEN
    RETURN jsonb_build_object(
      'status',     'blocked',
      'blockers',   (
        SELECT jsonb_agg('MISSING_REQUIREMENT:' || x)
        FROM unnest(v_missing_reqs) AS x
      ),
      'request_id', v_req_id
    );
  END IF;

  -- ── 5. Resolve program ────────────────────────────────────────────────────
  SELECT id INTO v_program_id
  FROM public.programs
  WHERE slug = v_app.program_slug
  LIMIT 1;

  IF v_program_id IS NULL THEN
    RETURN jsonb_build_object('status','error','message','Program not found: ' || v_app.program_slug,'request_id',v_req_id);
  END IF;

  -- ── 6. Resolve course ─────────────────────────────────────────────────────
  SELECT id, tenant_id INTO v_course
  FROM public.training_courses
  WHERE program_id = v_program_id
  ORDER BY created_at
  LIMIT 1;

  IF v_course.id IS NULL THEN
    RETURN jsonb_build_object('status','error','message','No training_course for program: ' || v_app.program_slug,'request_id',v_req_id);
  END IF;

  -- ── 7. Walk state machine ─────────────────────────────────────────────────
  -- enforce_application_flow trigger requires: submitted->in_review->approved
  -- ->ready_to_enroll->enrolled. All four UPDATEs are inside this transaction.
  IF v_app.status = 'submitted' THEN
    UPDATE public.applications SET status = 'in_review',      updated_at = NOW() WHERE id = p_application_id;
  END IF;
  IF v_app.status IN ('submitted','in_review') THEN
    UPDATE public.applications SET status = 'approved',       updated_at = NOW() WHERE id = p_application_id;
  END IF;
  UPDATE public.applications SET status = 'ready_to_enroll',  updated_at = NOW() WHERE id = p_application_id;
  UPDATE public.applications SET status = 'enrolled',         updated_at = NOW() WHERE id = p_application_id;

  -- ── 8. training_enrollments ───────────────────────────────────────────────
  INSERT INTO public.training_enrollments (
    user_id, course_id, tenant_id, program_id, program_slug,
    status, application_id, approved_at, approved_by
  )
  VALUES (
    v_app.user_id, v_course.id, v_course.tenant_id,
    v_program_id, v_app.program_slug,
    'active', p_application_id, NOW(), p_actor_user_id
  )
  ON CONFLICT (user_id, course_id) DO UPDATE
    SET status      = 'active',
        approved_at = NOW(),
        approved_by = p_actor_user_id,
        updated_at  = NOW();

  -- ── 9. partner_enrollments ────────────────────────────────────────────────
  -- ON CONFLICT now backed by uq_partner_enrollments_partner_student_program.
  IF EXISTS (SELECT 1 FROM public.partners WHERE id = v_cmi_partner_id) THEN
    INSERT INTO public.partner_enrollments
      (partner_id, student_id, program_id, status, enrollment_date)
    VALUES
      (v_cmi_partner_id, v_app.user_id, v_program_id, 'active', CURRENT_DATE)
    ON CONFLICT (partner_id, student_id, program_id) DO UPDATE
      SET status = 'active';
  END IF;

  -- ── 10. cmi_students ──────────────────────────────────────────────────────
  INSERT INTO public.cmi_students (user_id, application_id, status, enrolled_at)
  VALUES (v_app.user_id, p_application_id, 'enrolled', NOW())
  ON CONFLICT (application_id) DO UPDATE
    SET status = 'enrolled';

  -- ── 11. Audit ─────────────────────────────────────────────────────────────
  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (
    p_actor_user_id, 'approve_and_enroll', 'application', p_application_id,
    jsonb_build_object(
      'program_id', v_program_id,
      'course_id',  v_course.id,
      'request_id', v_req_id
    )
  );

  RETURN jsonb_build_object(
    'status',         'enrolled',
    'application_id', p_application_id,
    'program_id',     v_program_id,
    'course_id',      v_course.id,
    'request_id',     v_req_id
  );
END;
$$;


-- ── 4. Rewrite revoke_application_access_atomic ──────────────────────────────

CREATE OR REPLACE FUNCTION public.revoke_application_access_atomic(
  p_application_id UUID,
  p_actor_user_id  UUID,
  p_request_id     TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_app        RECORD;
  v_program_id UUID;
  v_course_id  UUID;
  v_req_id     TEXT := COALESCE(p_request_id, gen_random_uuid()::TEXT);
BEGIN
  SELECT * INTO v_app
  FROM public.applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','error','message','Application not found','request_id',v_req_id);
  END IF;

  IF v_app.status NOT IN ('approved','ready_to_enroll','enrolled') THEN
    RETURN jsonb_build_object('status','not_enrolled','application_id',p_application_id,'request_id',v_req_id);
  END IF;

  SELECT id INTO v_program_id FROM public.programs WHERE slug = v_app.program_slug LIMIT 1;

  SELECT id INTO v_course_id
  FROM public.training_courses
  WHERE program_id = v_program_id
  ORDER BY created_at LIMIT 1;

  -- 'withdrawn' is in the training_enrollments status enum; 'revoked' is not
  IF v_course_id IS NOT NULL THEN
    UPDATE public.training_enrollments
    SET status = 'withdrawn', updated_at = NOW()
    WHERE user_id = v_app.user_id AND course_id = v_course_id;
  END IF;

  UPDATE public.cmi_students
  SET status = 'withdrawn'
  WHERE application_id = p_application_id;

  IF v_program_id IS NOT NULL THEN
    UPDATE public.partner_enrollments
    SET status = 'revoked'
    WHERE student_id = v_app.user_id AND program_id = v_program_id;
  END IF;

  -- application.status stays 'enrolled' — terminal per enforce_application_flow

  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (
    p_actor_user_id, 'revoke_access', 'application', p_application_id,
    jsonb_build_object(
      'program_id', v_program_id,
      'course_id',  v_course_id,
      'request_id', v_req_id
    )
  );

  RETURN jsonb_build_object(
    'status',         'revoked',
    'application_id', p_application_id,
    'request_id',     v_req_id
  );
END;
$$;
