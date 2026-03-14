-- =============================================================================
-- credential_registry guard + exam_funding_authorizations
--
-- The live DB has credential_registry as a real BASE TABLE (not a view).
-- The live credentials table is an unrelated API keys table.
-- program_credentials.credential_id already FKs to credential_registry(id).
--
-- This migration:
--   1. Asserts credential_registry is a BASE TABLE. Fails loudly if not.
--   2. Ensures read grants are present.
--   3. Creates exam_funding_authorizations with FK to credential_registry.
-- =============================================================================

DO $$
BEGIN
  IF (
    SELECT table_type
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'credential_registry'
  ) = 'VIEW' THEN
    RAISE EXCEPTION
      'credential_registry is a VIEW but must be a BASE TABLE. '
      'Drop the view and restore the real table before running this migration.';
  END IF;
END $$;

GRANT SELECT ON public.credential_registry TO authenticated;
GRANT SELECT ON public.credential_registry TO service_role;

-- =============================================================================
-- exam_funding_authorizations
-- FK to credential_registry, NOT to credentials (API keys table).
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.exam_funding_authorizations (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  learner_id                  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  credential_id               UUID NOT NULL REFERENCES public.credential_registry(id) ON DELETE CASCADE,
  credential_attempt_id       UUID REFERENCES public.credential_attempts(id) ON DELETE SET NULL,
  program_id                  UUID REFERENCES public.programs(id) ON DELETE SET NULL,

  funding_source              TEXT NOT NULL DEFAULT 'self_pay'
    CHECK (funding_source IN ('self_pay', 'elevate', 'grant', 'employer', 'partner', 'scholarship')),

  funding_status              TEXT NOT NULL DEFAULT 'unresolved'
    CHECK (funding_status IN ('unresolved', 'pending', 'approved', 'denied', 'paid', 'waived')),

  funded_amount_cents         INTEGER,
  funding_notes               TEXT,
  funding_approved_by         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  funding_approved_at         TIMESTAMPTZ,

  stripe_checkout_session_id  TEXT,
  stripe_payment_intent_id    TEXT,

  tenant_id                   UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (learner_id, credential_id, credential_attempt_id)
);

CREATE INDEX IF NOT EXISTS idx_efa_learner
  ON public.exam_funding_authorizations(learner_id);
CREATE INDEX IF NOT EXISTS idx_efa_credential
  ON public.exam_funding_authorizations(credential_id);
CREATE INDEX IF NOT EXISTS idx_efa_attempt
  ON public.exam_funding_authorizations(credential_attempt_id)
  WHERE credential_attempt_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_efa_status
  ON public.exam_funding_authorizations(funding_status);
CREATE INDEX IF NOT EXISTS idx_efa_source
  ON public.exam_funding_authorizations(funding_source);

DROP TRIGGER IF EXISTS trg_efa_updated_at ON public.exam_funding_authorizations;
CREATE TRIGGER trg_efa_updated_at
  BEFORE UPDATE ON public.exam_funding_authorizations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.exam_funding_authorizations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "efa_learner_read" ON public.exam_funding_authorizations
  FOR SELECT USING (learner_id = auth.uid());

CREATE POLICY "efa_admin_all" ON public.exam_funding_authorizations
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

GRANT SELECT ON public.exam_funding_authorizations TO authenticated;
GRANT ALL    ON public.exam_funding_authorizations TO service_role;
