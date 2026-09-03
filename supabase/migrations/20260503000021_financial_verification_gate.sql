-- Financial verification gate for application approval.
--
-- Extends application_financials with verification columns so the
-- approval function can enforce a verified financial path before
-- granting access. Adds access_granted_at to program_enrollments.
-- Creates check_application_access_readiness() and upgrades
-- approve_application_atomic() to call it.
--
-- Applied: 2026-05-03 via exec_sql RPC.

-- ── application_financials: verification columns ──────────────────────────────

ALTER TABLE public.application_financials
  ADD COLUMN IF NOT EXISTS payment_path        TEXT
    CHECK (payment_path IN ('card','bnpl','sponsor','workforce','scholarship','invoice','waiver')),
  ADD COLUMN IF NOT EXISTS verification_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending','verified','rejected','expired')),
  ADD COLUMN IF NOT EXISTS provider_name       TEXT,
  ADD COLUMN IF NOT EXISTS provider_reference  TEXT,
  ADD COLUMN IF NOT EXISTS verification_method TEXT
    CHECK (verification_method IN ('webhook','manual_review','document_upload','api_check','admin_override')),
  ADD COLUMN IF NOT EXISTS amount_expected     NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS amount_approved     NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS verified_at         TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by         UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ── program_enrollments: access_granted_at ────────────────────────────────────

ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS access_granted_at TIMESTAMPTZ;

-- ── check_application_access_readiness() ─────────────────────────────────────
-- Returns { ready: bool, blockers: text[], application_id, program_slug, status }
-- Called by approve_application_atomic before any writes.

CREATE OR REPLACE FUNCTION public.check_application_access_readiness(
  p_application_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_app       RECORD;
  v_financial RECORD;
  v_partner   RECORD;
  v_program   RECORD;
  v_blockers  TEXT[] := '{}';
BEGIN
  SELECT * INTO v_app FROM public.applications WHERE id = p_application_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ready', FALSE, 'blockers', ARRAY['APPLICATION_NOT_FOUND']);
  END IF;

  IF v_app.status NOT IN ('submitted','in_review','financially_cleared','awaiting_financial_verification') THEN
    v_blockers := array_append(v_blockers, 'APPLICATION_STATUS_NOT_ELIGIBLE:' || COALESCE(v_app.status,'null'));
  END IF;

  IF v_app.email IS NULL OR v_app.email = '' THEN
    v_blockers := array_append(v_blockers, 'MISSING_EMAIL');
  END IF;
  IF v_app.program_slug IS NULL OR v_app.program_slug = '' THEN
    v_blockers := array_append(v_blockers, 'MISSING_PROGRAM_SLUG');
  END IF;

  SELECT * INTO v_financial FROM public.application_financials
  WHERE application_id = p_application_id;

  IF NOT FOUND THEN
    v_blockers := array_append(v_blockers, 'FINANCIAL_RECORD_MISSING');
  ELSIF v_financial.verification_status <> 'verified' THEN
    v_blockers := array_append(v_blockers,
      'FINANCIAL_VERIFICATION_REQUIRED:status=' || v_financial.verification_status);
  END IF;

  IF v_app.program_slug IS NOT NULL THEN
    SELECT id INTO v_program FROM public.programs WHERE slug = v_app.program_slug LIMIT 1;
    IF NOT FOUND THEN
      v_blockers := array_append(v_blockers, 'PROGRAM_NOT_FOUND:' || v_app.program_slug);
    END IF;

    IF v_app.program_slug = 'cna' THEN
      SELECT id INTO v_partner FROM public.partners
      WHERE name = 'Choice Medical Institute' LIMIT 1;
      IF NOT FOUND THEN
        v_blockers := array_append(v_blockers, 'PARTNER_NOT_FOUND:Choice Medical Institute');
      END IF;
      IF v_app.user_id IS NULL THEN
        v_blockers := array_append(v_blockers, 'USER_NOT_RESOLVED');
      END IF;
    END IF;
  END IF;

  IF v_app.user_id IS NOT NULL AND v_app.program_slug IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.program_enrollments pe
      JOIN public.programs pr ON pr.id = pe.program_id
      WHERE pe.user_id = v_app.user_id
        AND pr.slug = v_app.program_slug
        AND pe.enrollment_state = 'active'
    ) THEN
      v_blockers := array_append(v_blockers, 'ACTIVE_ENROLLMENT_EXISTS');
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'ready',          array_length(v_blockers, 1) IS NULL,
    'blockers',       v_blockers,
    'application_id', p_application_id,
    'program_slug',   v_app.program_slug,
    'status',         v_app.status
  );
END;
$$;

-- ── Verify ────────────────────────────────────────────────────────────────────
-- SELECT public.check_application_access_readiness('<application_id>');
