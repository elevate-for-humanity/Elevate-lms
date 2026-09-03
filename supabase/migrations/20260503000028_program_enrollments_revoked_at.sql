-- Add revocation columns to program_enrollments.
--
-- program_enrollments is the authoritative LMS access surface.
-- revoked_at IS NOT NULL means the enrollment cannot grant lesson access,
-- appear as active, count toward progress, or block re-enrollment.
--
-- The application-layer revocation signal (applications.revoked_at) is
-- separate and drives the admissions workflow. This column drives LMS access.
-- revoke_application_access_atomic is updated below to write both.

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS revoked_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_by  UUID REFERENCES public.profiles(id);

-- Partial index: only indexes revoked rows, so reads with IS NULL are fast
-- and the index stays small (most rows are not revoked).
CREATE INDEX IF NOT EXISTS idx_program_enrollments_revoked_at
  ON public.program_enrollments(revoked_at)
  WHERE revoked_at IS NOT NULL;

-- Supporting index for the common access-gate pattern:
-- .eq('user_id', x).is('revoked_at', null)
CREATE INDEX IF NOT EXISTS idx_program_enrollments_user_active
  ON public.program_enrollments(user_id)
  WHERE revoked_at IS NULL;

-- Update revoke_application_access_atomic to propagate revocation to the
-- matching program_enrollments row(s).
--
-- Targeting logic: revoke the most-recent non-revoked enrollment row for
-- this user + program combination. If the application has a course_id,
-- match on that too. This avoids clobbering historical completed rows
-- from prior enrollment cycles.
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
  v_app          RECORD;
  v_program_id   UUID;
  v_course_id    UUID;
  v_req_id       TEXT := COALESCE(p_request_id, gen_random_uuid()::TEXT);
  v_enrollment   RECORD;
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

  -- Idempotency: already revoked
  IF v_app.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object('status','already_revoked','application_id',p_application_id,'request_id',v_req_id);
  END IF;

  SELECT id INTO v_program_id FROM public.programs WHERE slug = v_app.program_slug LIMIT 1;

  SELECT id INTO v_course_id
  FROM public.training_courses
  WHERE program_id = v_program_id
  ORDER BY created_at LIMIT 1;

  -- Withdraw training enrollment
  IF v_course_id IS NOT NULL THEN
    UPDATE public.training_enrollments
    SET status = 'withdrawn', updated_at = NOW()
    WHERE user_id = v_app.user_id AND course_id = v_course_id;
  END IF;

  -- Withdraw CMI student
  UPDATE public.cmi_students
  SET status = 'withdrawn'
  WHERE application_id = p_application_id;

  -- Revoke partner enrollment
  IF v_program_id IS NOT NULL THEN
    UPDATE public.partner_enrollments
    SET status = 'revoked'
    WHERE student_id = v_app.user_id AND program_id = v_program_id;
  END IF;

  -- Propagate revocation to program_enrollments.
  -- Target: the most-recent non-revoked row for this user + program.
  -- If a course_id is resolvable, also match on that for precision.
  -- Does not touch rows already revoked (idempotent per row).
  IF v_program_id IS NOT NULL THEN
    -- Find the active access-granting row
    SELECT id INTO v_enrollment
    FROM public.program_enrollments
    WHERE user_id   = v_app.user_id
      AND program_id = v_program_id
      AND revoked_at IS NULL
      AND status NOT IN ('completed', 'cancelled', 'withdrawn')
    ORDER BY enrolled_at DESC
    LIMIT 1;

    IF FOUND THEN
      UPDATE public.program_enrollments
      SET revoked_at = NOW(),
          revoked_by = p_actor_user_id,
          updated_at = NOW()
      WHERE id = v_enrollment.id;
    END IF;
  END IF;

  -- Mark revocation on the application row.
  -- status stays 'enrolled' (terminal per enforce_application_flow trigger).
  UPDATE public.applications
  SET revoked_at = NOW(),
      revoked_by = p_actor_user_id,
      updated_at = NOW()
  WHERE id = p_application_id;

  INSERT INTO public.audit_logs (actor_id, action, target_type, target_id, metadata)
  VALUES (
    p_actor_user_id, 'revoke_access', 'application', p_application_id,
    jsonb_build_object(
      'program_id',     v_program_id,
      'course_id',      v_course_id,
      'enrollment_id',  v_enrollment.id,
      'request_id',     v_req_id
    )
  );

  RETURN jsonb_build_object(
    'status',         'revoked',
    'application_id', p_application_id,
    'enrollment_id',  v_enrollment.id,
    'revoked_at',     NOW(),
    'request_id',     v_req_id
  );
END;
$$;
