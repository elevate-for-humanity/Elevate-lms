-- =============================================================================
-- Certification Pipeline
--
-- Supports the full exam authorization workflow:
--   1. Student completes course → system triggers exam fee charge
--   2. Elevate staff receives email with student name + program
--   3. Staff forwards exam authorization to student
--   4. Student sits for external exam (ICAADA, CareerSafe, etc.)
--   5. Student uploads passing credential
--   6. Admin verifies upload → issues Elevate certificate
--
-- Tables:
--   exam_fee_payments          — Stripe charge record per learner+credential
--   student_credential_uploads — uploaded proof documents (CPR cert, exam pass, etc.)
--   certification_requests     — one record per learner+program, tracks full lifecycle
--   certification_audit_log    — immutable event log for every state transition
-- =============================================================================

BEGIN;

-- ── 1. exam_fee_payments ──────────────────────────────────────────────────────
-- Records the Stripe charge Elevate makes on behalf of the student.
-- Created automatically when course completion is detected.

CREATE TABLE IF NOT EXISTS public.exam_fee_payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id            UUID NOT NULL REFERENCES public.programs(id),
  credential_id         UUID NOT NULL REFERENCES public.credential_registry(id),
  stripe_payment_intent TEXT,                          -- Stripe PaymentIntent ID
  stripe_charge_id      TEXT,                          -- Stripe Charge ID (set after capture)
  amount_cents          INTEGER NOT NULL,
  currency              TEXT NOT NULL DEFAULT 'usd',
  status                TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'paid', 'failed', 'refunded')),
  paid_at               TIMESTAMPTZ,
  failure_reason        TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, program_id, credential_id)          -- one charge per learner per credential
);

CREATE INDEX IF NOT EXISTS idx_efp_user    ON public.exam_fee_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_efp_program ON public.exam_fee_payments(program_id);
CREATE INDEX IF NOT EXISTS idx_efp_status  ON public.exam_fee_payments(status);

ALTER TABLE public.exam_fee_payments ENABLE ROW LEVEL SECURITY;

-- Students can see their own payment records
CREATE POLICY "efp_student_read" ON public.exam_fee_payments
  FOR SELECT USING (auth.uid() = user_id);

-- Admins/staff have full access
CREATE POLICY "efp_admin_all" ON public.exam_fee_payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

GRANT SELECT ON public.exam_fee_payments TO authenticated;
GRANT ALL    ON public.exam_fee_payments TO service_role;

-- ── 2. student_credential_uploads ────────────────────────────────────────────
-- Stores documents uploaded by students as proof of credentials.
-- Two upload types:
--   prerequisite  — must be verified BEFORE exam auth (e.g., CPR cert)
--   exam_result   — uploaded AFTER passing the external exam (e.g., ICAADA cert)

CREATE TABLE IF NOT EXISTS public.student_credential_uploads (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id          UUID NOT NULL REFERENCES public.programs(id),
  credential_id       UUID REFERENCES public.credential_registry(id),
  upload_type         TEXT NOT NULL
    CHECK (upload_type IN ('prerequisite', 'exam_result')),
  -- Supabase Storage: bucket = 'credential-uploads', path = {uid}/{program_id}/{filename}
  storage_bucket      TEXT NOT NULL DEFAULT 'credential-uploads',
  storage_path        TEXT NOT NULL,
  original_filename   TEXT,
  verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'approved', 'rejected')),
  verified_by         UUID REFERENCES auth.users(id),
  verified_at         TIMESTAMPTZ,
  rejection_reason    TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scu_user    ON public.student_credential_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_scu_program ON public.student_credential_uploads(program_id);
CREATE INDEX IF NOT EXISTS idx_scu_status  ON public.student_credential_uploads(verification_status);

ALTER TABLE public.student_credential_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "scu_student_own" ON public.student_credential_uploads
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "scu_admin_all" ON public.student_credential_uploads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

GRANT SELECT, INSERT, UPDATE ON public.student_credential_uploads TO authenticated;
GRANT ALL                     ON public.student_credential_uploads TO service_role;

-- ── 3. certification_requests ─────────────────────────────────────────────────
-- One record per learner per program. Tracks the full pipeline state.
--
-- Status flow:
--   pending_completion  → course not yet finished
--   awaiting_payment    → course done, Stripe charge being processed
--   payment_failed      → Stripe charge failed (retry needed)
--   exam_authorized     → payment confirmed, auth email sent to Elevate staff
--   exam_forwarded      → staff marked as forwarded to student
--   awaiting_upload     → student has been authorized, waiting for result upload
--   upload_pending      → student uploaded result, awaiting admin verification
--   upload_rejected     → admin rejected upload (student must re-upload)
--   certificate_issued  → admin approved upload, Elevate certificate generated

CREATE TABLE IF NOT EXISTS public.certification_requests (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id              UUID NOT NULL REFERENCES public.programs(id),
  credential_id           UUID NOT NULL REFERENCES public.credential_registry(id),
  status                  TEXT NOT NULL DEFAULT 'pending_completion'
    CHECK (status IN (
      'pending_completion',
      'awaiting_payment',
      'payment_failed',
      'exam_authorized',
      'exam_forwarded',
      'awaiting_upload',
      'upload_pending',
      'upload_rejected',
      'certificate_issued'
    )),
  -- Payment
  exam_fee_payment_id     UUID REFERENCES public.exam_fee_payments(id),
  -- Exam authorization
  authorization_code      TEXT UNIQUE,                 -- secure token sent to staff → student
  authorized_at           TIMESTAMPTZ,
  authorization_expires_at TIMESTAMPTZ,               -- 90 days from authorization
  forwarded_at            TIMESTAMPTZ,                 -- when staff marked as forwarded
  forwarded_by            UUID REFERENCES auth.users(id),
  -- Upload
  exam_result_upload_id   UUID REFERENCES public.student_credential_uploads(id),
  -- Certificate
  certificate_id          UUID,                        -- FK to certificates table (set on issue)
  certificate_issued_at   TIMESTAMPTZ,
  issued_by               UUID REFERENCES auth.users(id),
  -- Certifying body (resolved from credential_registry.provider_id)
  -- Stored here so the record is self-contained even if provider changes later
  provider_id             UUID REFERENCES public.credential_providers(id),
  provider_name           TEXT,                        -- snapshot of provider name at time of auth
  -- Metadata
  notes                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, program_id, credential_id)
);

CREATE INDEX IF NOT EXISTS idx_cr_user    ON public.certification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_cr_program ON public.certification_requests(program_id);
CREATE INDEX IF NOT EXISTS idx_cr_status  ON public.certification_requests(status);

ALTER TABLE public.certification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cr_student_read" ON public.certification_requests
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "cr_admin_all" ON public.certification_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

GRANT SELECT ON public.certification_requests TO authenticated;
GRANT ALL    ON public.certification_requests TO service_role;

-- ── 4. certification_audit_log ────────────────────────────────────────────────
-- Immutable event log. Every state transition writes a row here.
-- Never updated or deleted — append-only.

CREATE TABLE IF NOT EXISTS public.certification_audit_log (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_request_id UUID NOT NULL REFERENCES public.certification_requests(id),
  user_id                 UUID NOT NULL,               -- the learner
  actor_id                UUID,                        -- who performed the action (null = system)
  event_type              TEXT NOT NULL,               -- e.g. 'payment_initiated', 'auth_email_sent'
  from_status             TEXT,
  to_status               TEXT,
  metadata                JSONB,                       -- stripe IDs, email IDs, etc.
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cal_request ON public.certification_audit_log(certification_request_id);
CREATE INDEX IF NOT EXISTS idx_cal_user    ON public.certification_audit_log(user_id);

ALTER TABLE public.certification_audit_log ENABLE ROW LEVEL SECURITY;

-- Students can read their own audit trail
CREATE POLICY "cal_student_read" ON public.certification_audit_log
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can read all; only service_role can insert (no client writes)
CREATE POLICY "cal_admin_read" ON public.certification_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

GRANT SELECT ON public.certification_audit_log TO authenticated;
GRANT ALL    ON public.certification_audit_log TO service_role;

-- ── 5. updated_at triggers ────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_efp_updated_at'
  ) THEN
    CREATE TRIGGER trg_efp_updated_at
      BEFORE UPDATE ON public.exam_fee_payments
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_scu_updated_at'
  ) THEN
    CREATE TRIGGER trg_scu_updated_at
      BEFORE UPDATE ON public.student_credential_uploads
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_cr_updated_at'
  ) THEN
    CREATE TRIGGER trg_cr_updated_at
      BEFORE UPDATE ON public.certification_requests
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

COMMIT;
