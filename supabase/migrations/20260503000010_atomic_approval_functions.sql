-- Atomic approval and revoke functions for the CNA enrollment pipeline.
--
-- These functions are the source of truth for all CNA approvals.
-- They replace the earlier approve_application_atomic() stub.
--
-- Live schema notes (reconciled against actual DB, not migration files):
--   training_enrollments: unique on (user_id, course_id); tenant_id NOT NULL;
--     status enum does NOT include 'revoked' — use 'withdrawn' for revocations.
--   cmi_students: unique on application_id; columns are user_id, application_id,
--     cohort, status, enrolled_at, completed_at — no program_id column.
--   partner_enrollments: no unique constraint on (partner_id, student_id, program_id);
--     uses enrollment_date DATE NOT NULL, no enrolled_at column.
--   applications: enforce_application_flow trigger enforces state machine:
--     submitted -> in_review -> approved -> ready_to_enroll -> enrolled (terminal)
--
-- training_courses.program_id for CNA must point to programs WHERE slug='cna'.
-- Run after applying this migration:
--   UPDATE training_courses
--   SET program_id = (SELECT id FROM programs WHERE slug = 'cna')
--   WHERE slug = 'cna-training-evening';

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
  v_readiness      JSONB;
  v_program_id     UUID;
  v_cmi_partner_id UUID := '66685a9d-1b27-4c28-a7d7-2ee6287923bc';
  v_req_id         TEXT := COALESCE(p_request_id, gen_random_uuid()::TEXT);
BEGIN
  -- 1. Lock the application row
  SELECT * INTO v_app
  FROM public.applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status','error','message','Application not found','request_id',v_req_id);
  END IF;

  -- 2. Idempotency: already at or past approved
  IF v_app.status IN ('approved','ready_to_enroll','enrolled') THEN
    RETURN jsonb_build_object('status','already_processed','application_id',p_application_id,'request_id',v_req_id);
  END IF;

  -- 3. Readiness gate (financial + compliance)
  v_readiness := public.check_application_access_readiness(p_application_id);
  IF NOT (v_readiness->>'ready')::boolean THEN
    RETURN jsonb_build_object(
      'status',     'blocked',
      'blockers',   v_readiness->'blockers',
      'request_id', v_req_id
    );
  END IF;

  -- 4. Resolve program_id
  SELECT id INTO v_program_id
  FROM public.programs
  WHERE slug = v_app.program_slug
  LIMIT 1;

  IF v_program_id IS NULL THEN
    RETURN jsonb_build_object('status','error','message','Program not found: ' || v_app.program_slug,'request_id',v_req_id);
  END IF;

  -- 5. Resolve course (id + tenant_id) from training_courses
  SELECT id, tenant_id INTO v_course
  FROM public.training_courses
  WHERE program_id = v_program_id
  ORDER BY created_at
  LIMIT 1;

  IF v_course.id IS NULL THEN
    RETURN jsonb_build_object('status','error','message','No training_course for program: ' || v_app.program_slug,'request_id',v_req_id);
  END IF;

  -- 6. Walk the state machine: submitted -> in_review -> approved -> ready_to_enroll -> enrolled
  IF v_app.status = 'submitted' THEN
    UPDATE public.applications SET status = 'in_review', updated_at = NOW() WHERE id = p_application_id;
  END IF;
  IF v_app.status IN ('submitted','in_review') THEN
    UPDATE public.applications SET status = 'approved', updated_at = NOW() WHERE id = p_application_id;
  END IF;
  UPDATE public.applications SET status = 'ready_to_enroll', updated_at = NOW() WHERE id = p_application_id;
  UPDATE public.applications SET status = 'enrolled', updated_at = NOW() WHERE id = p_application_id;

  -- 7. Upsert training_enrollments (unique on user_id, course_id)
  INSERT INTO public.training_enrollments (
    user_id, course_id, tenant_id, program_id, program_slug,
    status, application_id, approved_at, approved_by
  )
  VALUES (
    v_app.user_id,
    v_course.id,
    v_course.tenant_id,
    v_program_id,
    v_app.program_slug,
    'active',
    p_application_id,
    NOW(),
    p_actor_user_id
  )
  ON CONFLICT (user_id, course_id) DO UPDATE
    SET status      = 'active',
        approved_at = NOW(),
        approved_by = p_actor_user_id,
        updated_at  = NOW();

  -- 8. Upsert partner_enrollments for CMI (no unique constraint — guard with NOT EXISTS)
  IF EXISTS (SELECT 1 FROM public.partners WHERE id = v_cmi_partner_id) THEN
    INSERT INTO public.partner_enrollments (partner_id, student_id, program_id, status, enrollment_date)
    SELECT v_cmi_partner_id, v_app.user_id, v_program_id, 'active', CURRENT_DATE
    WHERE NOT EXISTS (
      SELECT 1 FROM public.partner_enrollments
      WHERE partner_id = v_cmi_partner_id
        AND student_id = v_app.user_id
        AND program_id = v_program_id
    );
    UPDATE public.partner_enrollments
    SET status = 'active'
    WHERE partner_id = v_cmi_partner_id
      AND student_id = v_app.user_id
      AND program_id = v_program_id;
  END IF;

  -- 9. Upsert cmi_students (unique on application_id; no program_id column in live schema)
  INSERT INTO public.cmi_students (user_id, application_id, status, enrolled_at)
  VALUES (v_app.user_id, p_application_id, 'enrolled', NOW())
  ON CONFLICT (application_id) DO UPDATE
    SET status = 'enrolled';

  -- 10. Audit log
  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (
    p_actor_user_id, 'approve_and_enroll', 'application', p_application_id,
    jsonb_build_object('program_id', v_program_id, 'course_id', v_course.id, 'request_id', v_req_id)
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

  -- Withdraw training enrollment ('withdrawn' is in the allowed status enum)
  IF v_course_id IS NOT NULL THEN
    UPDATE public.training_enrollments
    SET status = 'withdrawn', updated_at = NOW()
    WHERE user_id = v_app.user_id AND course_id = v_course_id;
  END IF;

  -- Withdraw CMI student (keyed by application_id in live schema)
  UPDATE public.cmi_students
  SET status = 'withdrawn'
  WHERE application_id = p_application_id;

  -- Revoke partner enrollment
  IF v_program_id IS NOT NULL THEN
    UPDATE public.partner_enrollments
    SET status = 'revoked'
    WHERE student_id = v_app.user_id AND program_id = v_program_id;
  END IF;

  -- application status stays 'enrolled' (terminal state per enforce_application_flow trigger)

  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (
    p_actor_user_id, 'revoke_access', 'application', p_application_id,
    jsonb_build_object('program_id', v_program_id, 'course_id', v_course_id, 'request_id', v_req_id)
  );

  RETURN jsonb_build_object(
    'status',         'revoked',
    'application_id', p_application_id,
    'request_id',     v_req_id
  );
END;
$$;
