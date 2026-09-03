-- enroll_application RPC hardening.
--
-- Adds Stripe staging table check as a second payment gate.
-- The existing gate checks applications.funding_verified and
-- applications.payment_received_at — this adds a third path:
-- verified Stripe session in stripe_sessions_staging.
--
-- Also adds 'stripe_repair' source bypass so the reconciliation
-- script can enroll without requiring status='ready_to_enroll',
-- while still requiring Stripe payment evidence.

CREATE OR REPLACE FUNCTION public.enroll_application(
  p_application_id uuid,
  p_actor_id       uuid,
  p_source         text DEFAULT NULL   -- 'stripe_repair' bypasses state gate
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_app            RECORD;
  v_program        RECORD;
  v_ap_program     RECORD;
  v_enrollment_id  UUID;
  v_has_lms        BOOLEAN;
  v_stripe_paid    BOOLEAN;
BEGIN
  -- 1. Lock application row
  SELECT * INTO v_app
  FROM   public.applications
  WHERE  id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'APPLICATION_NOT_FOUND: %', p_application_id;
  END IF;

  -- 2. State gate (bypassed for stripe_repair source)
  IF p_source IS DISTINCT FROM 'stripe_repair' THEN
    IF v_app.status <> 'ready_to_enroll' THEN
      RAISE EXCEPTION 'INVALID_STATE: expected ready_to_enroll, got %', v_app.status;
    END IF;
  END IF;

  -- 3. User account gate
  IF v_app.user_id IS NULL THEN
    RAISE EXCEPTION 'NO_USER_ACCOUNT: application % has no user_id', p_application_id;
  END IF;

  -- 4. Stripe payment check (new — authoritative)
  SELECT EXISTS (
    SELECT 1 FROM public.stripe_sessions_staging s
    WHERE s.application_id = p_application_id::text
      AND s.payment_status = 'paid'
  ) INTO v_stripe_paid;

  -- 5. Funding gate — Stripe OR verified funding OR WorkOne approval
  --    stripe_repair source requires Stripe evidence (cannot bypass payment)
  IF p_source = 'stripe_repair' THEN
    IF NOT v_stripe_paid THEN
      RAISE EXCEPTION 'STRIPE_REPAIR_NO_PAYMENT: no paid Stripe session for application %', p_application_id;
    END IF;
  ELSE
    IF NOT (
      v_stripe_paid
      OR v_app.funding_verified = TRUE
      OR v_app.payment_received_at IS NOT NULL
      OR (v_app.eligibility_status = 'approved' AND v_app.has_workone_approval = TRUE)
    ) THEN
      RAISE EXCEPTION 'FUNDING_NOT_VERIFIED: application % has no verified funding or Stripe payment', p_application_id;
    END IF;
  END IF;

  -- 6. Program gate
  SELECT * INTO v_program
  FROM   public.programs
  WHERE  slug = v_app.program_slug
  LIMIT  1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'INVALID_PROGRAM: slug % not found', v_app.program_slug;
  END IF;

  IF v_program.delivery_model IS NULL THEN
    RAISE EXCEPTION 'PROGRAM_NOT_CONFIGURED: % has no delivery_model', v_app.program_slug;
  END IF;

  -- 7. LMS readiness gate (internal_lms only)
  IF v_program.delivery_model = 'internal_lms' THEN
    SELECT (
      EXISTS (
        SELECT 1 FROM public.training_courses
        WHERE  program_id = v_program.id AND is_active = TRUE
      )
      OR
      EXISTS (
        SELECT 1 FROM public.curriculum_lessons
        WHERE  program_id = v_program.id AND status = 'published'
      )
    ) INTO v_has_lms;

    IF NOT v_has_lms THEN
      RAISE EXCEPTION
        'LMS_NOT_READY: program % (delivery_model=internal_lms) has no active training_courses or published curriculum_lessons',
        v_app.program_slug;
    END IF;
  END IF;

  -- 8. Route by delivery model
  IF v_program.delivery_model = 'internal_lms' THEN
    SELECT id INTO v_ap_program
    FROM   public.apprenticeship_programs
    WHERE  slug = v_app.program_slug
    LIMIT  1;

    INSERT INTO public.program_enrollments (
      user_id, program_id, program_slug, email, full_name,
      amount_paid_cents, funding_source, status, enrollment_state,
      enrolled_at, source
    )
    VALUES (
      v_app.user_id,
      v_ap_program.id,
      v_app.program_slug,
      v_app.email,
      COALESCE(v_app.first_name, '') || ' ' || COALESCE(v_app.last_name, ''),
      0,
      COALESCE(v_app.funding_type, 'pending'),
      'active',
      'active',
      NOW(),
      COALESCE(p_source, 'admin_enroll')
    )
    ON CONFLICT (user_id, program_slug) DO UPDATE
      SET enrollment_state = 'active',
          status           = 'active',
          updated_at       = NOW()
    RETURNING id INTO v_enrollment_id;

  ELSE
    INSERT INTO public.external_program_enrollments (
      user_id, program_slug, email, full_name,
      delivery_model, status, enrolled_at
    )
    VALUES (
      v_app.user_id,
      v_app.program_slug,
      v_app.email,
      COALESCE(v_app.first_name, '') || ' ' || COALESCE(v_app.last_name, ''),
      v_program.delivery_model,
      'active',
      NOW()
    )
    ON CONFLICT (user_id, program_slug) DO UPDATE
      SET status     = 'active',
          updated_at = NOW()
    RETURNING id INTO v_enrollment_id;
  END IF;

  -- 9. Advance application status
  UPDATE public.applications
  SET    status     = 'enrolled',
         updated_at = NOW()
  WHERE  id = p_application_id;

  -- 10. Audit log
  INSERT INTO public.audit_logs (
    entity_type, entity_id, action, actor_id, metadata
  ) VALUES (
    'application',
    p_application_id,
    CASE WHEN p_source = 'stripe_repair' THEN 'stripe_repair_enroll' ELSE 'admin_enroll' END,
    p_actor_id,
    jsonb_build_object(
      'from',           v_app.status,
      'to',             'enrolled',
      'enrollment_id',  v_enrollment_id,
      'delivery_model', v_program.delivery_model,
      'user_id',        v_app.user_id,
      'source',         COALESCE(p_source, 'admin_enroll'),
      'stripe_paid',    v_stripe_paid
    )
  );

  RETURN jsonb_build_object(
    'enrollment_id',  v_enrollment_id,
    'delivery_model', v_program.delivery_model,
    'user_id',        v_app.user_id,
    'stripe_paid',    v_stripe_paid
  );
END;
$$;
