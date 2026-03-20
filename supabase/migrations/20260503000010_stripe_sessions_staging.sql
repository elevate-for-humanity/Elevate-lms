-- Stripe sessions staging table.
-- Authoritative Stripe payment data synced directly from the Stripe API.
-- Used for SQL-native reconciliation audits and as the payment gate
-- inside enroll_application RPC.

CREATE TABLE IF NOT EXISTS public.stripe_sessions_staging (
  session_id       text        PRIMARY KEY,
  payment_intent   text,
  email            text,
  amount           integer,
  currency         text        NOT NULL DEFAULT 'usd',
  created_at       timestamptz NOT NULL,
  application_id   text,
  program_slug     text,
  user_id          text,
  student_id       text,
  kind             text,
  payment_status   text        NOT NULL DEFAULT 'paid',
  raw              jsonb,
  inserted_at      timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stripe_sessions_application_id
  ON public.stripe_sessions_staging (application_id)
  WHERE application_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stripe_sessions_program_slug
  ON public.stripe_sessions_staging (program_slug)
  WHERE program_slug IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stripe_sessions_email
  ON public.stripe_sessions_staging (email)
  WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stripe_sessions_payment_intent
  ON public.stripe_sessions_staging (payment_intent)
  WHERE payment_intent IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stripe_sessions_created_at
  ON public.stripe_sessions_staging (created_at DESC);

-- Service role only
ALTER TABLE public.stripe_sessions_staging ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON public.stripe_sessions_staging
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Idempotent upsert function called by the ingestion script
CREATE OR REPLACE FUNCTION public.upsert_stripe_session(
  _session_id     text,
  _payment_intent text,
  _email          text,
  _amount         integer,
  _currency       text,
  _created_at     timestamptz,
  _application_id text,
  _program_slug   text,
  _user_id        text,
  _student_id     text,
  _kind           text,
  _raw            jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.stripe_sessions_staging (
    session_id, payment_intent, email, amount, currency,
    created_at, application_id, program_slug, user_id, student_id,
    kind, raw, updated_at
  )
  VALUES (
    _session_id, _payment_intent, _email, _amount, _currency,
    _created_at, _application_id, _program_slug, _user_id, _student_id,
    _kind, _raw, now()
  )
  ON CONFLICT (session_id) DO UPDATE SET
    payment_intent   = EXCLUDED.payment_intent,
    email            = EXCLUDED.email,
    amount           = EXCLUDED.amount,
    application_id   = EXCLUDED.application_id,
    program_slug     = EXCLUDED.program_slug,
    user_id          = EXCLUDED.user_id,
    student_id       = EXCLUDED.student_id,
    kind             = EXCLUDED.kind,
    raw              = EXCLUDED.raw,
    updated_at       = now();
END;
$$;

-- ── CANONICAL MISMATCH VIEWS ──────────────────────────────────────────────────

-- View A: Paid sessions with no enrollment (highest risk)
CREATE OR REPLACE VIEW public.v_paid_not_enrolled AS
SELECT
  s.session_id,
  s.email,
  s.amount,
  s.program_slug,
  s.application_id,
  s.user_id,
  s.student_id,
  s.kind,
  s.created_at AS paid_at,
  a.id         AS app_id_resolved,
  a.status     AS app_status
FROM public.stripe_sessions_staging s
LEFT JOIN public.applications a
  ON a.id::text = s.application_id
LEFT JOIN public.program_enrollments pe
  ON (
    (pe.stripe_checkout_session_id = s.session_id)
    OR (pe.stripe_payment_intent_id = s.payment_intent AND s.payment_intent IS NOT NULL)
    OR (pe.user_id::text = COALESCE(s.user_id, s.student_id) AND pe.program_slug = s.program_slug
        AND COALESCE(s.user_id, s.student_id) IS NOT NULL AND s.program_slug IS NOT NULL)
    OR (pe.user_id = a.user_id AND pe.program_slug = s.program_slug AND a.user_id IS NOT NULL)
  )
LEFT JOIN public.student_enrollments se
  ON (
    (se.stripe_checkout_session_id = s.session_id)
    OR (se.student_id::text = COALESCE(s.user_id, s.student_id) AND se.program_slug = s.program_slug
        AND COALESCE(s.user_id, s.student_id) IS NOT NULL AND s.program_slug IS NOT NULL)
  )
WHERE pe.id IS NULL
  AND se.id IS NULL;

-- View B: Active enrollments with no payment evidence
CREATE OR REPLACE VIEW public.v_enrolled_not_paid AS
SELECT
  pe.id            AS enrollment_id,
  pe.user_id,
  pe.student_id,
  pe.program_slug,
  pe.enrollment_state,
  pe.funding_source,
  pe.created_at,
  pe.stripe_checkout_session_id,
  pe.stripe_payment_intent_id,
  af.verification_status
FROM public.program_enrollments pe
LEFT JOIN public.applications a
  ON (a.user_id = pe.user_id OR a.user_id = pe.student_id)
  AND a.program_slug = pe.program_slug
LEFT JOIN public.application_financials af
  ON af.application_id = a.id
LEFT JOIN public.stripe_sessions_staging s
  ON (s.session_id = pe.stripe_checkout_session_id)
  OR (s.payment_intent = pe.stripe_payment_intent_id AND pe.stripe_payment_intent_id IS NOT NULL)
WHERE
  pe.enrollment_state IN ('active', 'enrolled', 'approved')
  AND s.session_id IS NULL
  AND (af.verification_status IS NULL OR af.verification_status != 'verified')
  AND pe.funding_source IN ('SELF_PAY', 'self_pay', 'stripe');
