-- Enrollment system lockdown.
--
-- Enforces the following invariants at the DB level:
--   1. program_enrollments.program_id is NOT NULL
--   2. program_enrollments.program_id FK → apprenticeship_programs(id) ON DELETE RESTRICT
--   3. UNIQUE(user_id, program_id) on program_enrollments
--   4. Direct inserts on program_enrollments are blocked — only enroll_application RPC allowed
--   5. external_program_enrollments: missing columns added + UNIQUE(user_id, program_slug)
--   6. enroll_application RPC: state gate → ready_to_enroll, full canonical chain enforced,
--      payment coupling gate for self-pay path

-- ── external_program_enrollments schema ──────────────────────────────────────
ALTER TABLE public.external_program_enrollments
  ADD COLUMN IF NOT EXISTS email          TEXT,
  ADD COLUMN IF NOT EXISTS full_name      TEXT,
  ADD COLUMN IF NOT EXISTS delivery_model TEXT,
  ADD COLUMN IF NOT EXISTS status         TEXT NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS enrolled_at    TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.external_program_enrollments
  DROP CONSTRAINT IF EXISTS ext_program_enrollments_user_slug_unique;

ALTER TABLE public.external_program_enrollments
  ADD CONSTRAINT ext_program_enrollments_user_slug_unique
  UNIQUE (user_id, program_slug);

-- ── program_enrollments constraints ──────────────────────────────────────────
ALTER TABLE public.program_enrollments
  ALTER COLUMN program_id SET NOT NULL;

ALTER TABLE public.program_enrollments
  DROP CONSTRAINT IF EXISTS fk_program_enrollments_ap;

ALTER TABLE public.program_enrollments
  ADD CONSTRAINT fk_program_enrollments_ap
  FOREIGN KEY (program_id)
  REFERENCES public.apprenticeship_programs(id)
  ON DELETE RESTRICT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_program_enrollments_user_program
  ON public.program_enrollments(user_id, program_id);

-- ── Block direct inserts on program_enrollments ───────────────────────────────
CREATE OR REPLACE FUNCTION public.block_direct_enrollment_insert()
RETURNS trigger AS $$
BEGIN
  IF current_user NOT IN ('postgres', 'supabase_admin', 'service_role') THEN
    RAISE EXCEPTION 'DIRECT_INSERT_BLOCKED: use enroll_application RPC'
      USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_block_direct_insert ON public.program_enrollments;

CREATE TRIGGER trg_block_direct_insert
BEFORE INSERT ON public.program_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.block_direct_enrollment_insert();

-- ── enroll_application RPC ────────────────────────────────────────────────────
DROP FUNCTION IF EXISTS public.enroll_application(uuid, uuid);

CREATE FUNCTION public.enroll_application(
  p_application_id UUID,
  p_actor_id       UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_app            RECORD;
  v_program        RECORD;
  v_ap_id          UUID;
  v_course_id      UUID;
  v_enrollment_id  UUID;
BEGIN
  -- 1. Lock application row
  SELECT * INTO v_app
  FROM   public.applications
  WHERE  id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'APPLICATION_NOT_FOUND: %', p_application_id;
  END IF;

  -- 2. State gate — trigger enforces approved → ready_to_enroll → enrolled
  IF v_app.status <> 'ready_to_enroll' THEN
    RAISE EXCEPTION 'INVALID_STATE: expected ready_to_enroll, got %', v_app.status;
  END IF;

  -- 3. User account gate
  IF v_app.user_id IS NULL THEN
    RAISE EXCEPTION 'NO_USER_ACCOUNT: application % has no user_id', p_application_id;
  END IF;

  -- 4. Funding gate
  IF NOT (
    v_app.funding_verified = TRUE
    OR v_app.payment_received_at IS NOT NULL
    OR (v_app.eligibility_status = 'approved' AND v_app.has_workone_approval = TRUE)
  ) THEN
    RAISE EXCEPTION 'FUNDING_NOT_VERIFIED: application % has no verified funding', p_application_id;
  END IF;

  -- 5. Payment coupling gate (self-pay only)
  -- WIOA/WorkOne paths bypass this check via funding_verified or has_workone_approval.
  IF v_app.payment_received_at IS NOT NULL
     AND v_app.funding_verified IS NOT TRUE
     AND v_app.has_workone_approval IS NOT TRUE
  THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.stripe_sessions_staging
      WHERE  application_id = p_application_id
      AND    payment_status = 'paid'
      AND    kind           IN ('full', 'bnpl')
    ) THEN
      RAISE EXCEPTION 'PAYMENT_NOT_VERIFIED: no paid Stripe session for application %', p_application_id
        USING ERRCODE = 'P0001';
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

  -- 7. internal_lms: full canonical chain — all three must pass
  IF v_program.delivery_model = 'internal_lms' THEN

    -- 7a. Canonical program binding (provides non-null program_id FK)
    SELECT id INTO v_ap_id
    FROM   public.apprenticeship_programs
    WHERE  slug = v_app.program_slug
    LIMIT  1;

    IF v_ap_id IS NULL THEN
      RAISE EXCEPTION 'PROGRAM_BINDING_MISSING: program % has delivery_model=internal_lms but no apprenticeship_programs row', v_app.program_slug
        USING ERRCODE = 'P0001';
    END IF;

    -- 7b. Active course binding
    SELECT id INTO v_course_id
    FROM   public.training_courses
    WHERE  program_id = v_program.id
    AND    is_active  = TRUE
    LIMIT  1;

    IF v_course_id IS NULL THEN
      RAISE EXCEPTION 'LMS_NOT_READY: program % has no active training_courses row', v_app.program_slug
        USING ERRCODE = 'P0001';
    END IF;

    -- 7c. Deliverable content bound to this program_id (stray lessons from other programs excluded)
    IF NOT EXISTS (
      SELECT 1 FROM public.curriculum_lessons
      WHERE  program_id = v_program.id
      AND    status     = 'published'
    ) THEN
      RAISE EXCEPTION 'LMS_NOT_READY: program % has no published curriculum_lessons', v_app.program_slug
        USING ERRCODE = 'P0001';
    END IF;

  END IF;

  -- 8. Route by delivery model
  IF v_program.delivery_model = 'internal_lms' THEN
    -- v_ap_id guaranteed non-null (gate 7a passed)
    INSERT INTO public.program_enrollments (
      user_id, program_id, program_slug, email, full_name,
      amount_paid_cents, funding_source, status, enrollment_state, enrolled_at
    )
    VALUES (
      v_app.user_id,
      v_ap_id,
      v_app.program_slug,
      v_app.email,
      COALESCE(v_app.first_name, '') || ' ' || COALESCE(v_app.last_name, ''),
      0,
      COALESCE(v_app.funding_type, 'pending'),
      'active',
      'active',
      NOW()
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
    'admin_enroll',
    p_actor_id,
    jsonb_build_object(
      'from',           'ready_to_enroll',
      'to',             'enrolled',
      'enrollment_id',  v_enrollment_id,
      'delivery_model', v_program.delivery_model,
      'user_id',        v_app.user_id
    )
  );

  RETURN jsonb_build_object(
    'enrollment_id',  v_enrollment_id,
    'delivery_model', v_program.delivery_model,
    'user_id',        v_app.user_id
  );
END;
$$;
