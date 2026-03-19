-- Surface revocation at the application layer.
--
-- applications.status stays 'enrolled' (terminal per enforce_application_flow).
-- revoked_at + revoked_by make revocation visible and queryable without
-- touching the state machine or any existing status-based branch.
--
-- Effective status for display:
--   revoked_at IS NOT NULL  → treat as revoked
--   status = 'enrolled'     → active enrollment

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS revoked_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS revoked_by   UUID REFERENCES public.profiles(id);

CREATE INDEX IF NOT EXISTS idx_applications_revoked_at
  ON public.applications(revoked_at)
  WHERE revoked_at IS NOT NULL;

-- Update revoke_application_access_atomic to write these columns.
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

  -- Idempotency: already revoked
  IF v_app.revoked_at IS NOT NULL THEN
    RETURN jsonb_build_object('status','already_revoked','application_id',p_application_id,'request_id',v_req_id);
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

  -- Withdraw CMI student (keyed by application_id)
  UPDATE public.cmi_students
  SET status = 'withdrawn'
  WHERE application_id = p_application_id;

  -- Revoke partner enrollment
  IF v_program_id IS NOT NULL THEN
    UPDATE public.partner_enrollments
    SET status = 'revoked'
    WHERE student_id = v_app.user_id AND program_id = v_program_id;
  END IF;

  -- Mark revocation on the application row itself.
  -- status stays 'enrolled' (terminal per enforce_application_flow trigger).
  -- revoked_at/revoked_by are the authoritative revocation signal.
  UPDATE public.applications
  SET revoked_at = NOW(),
      revoked_by = p_actor_user_id,
      updated_at = NOW()
  WHERE id = p_application_id;

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
    'revoked_at',     NOW(),
    'request_id',     v_req_id
  );
END;
$$;
