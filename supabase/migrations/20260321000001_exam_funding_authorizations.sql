-- =============================================================================
-- exam_funding_authorizations
--
-- Per-learner, per-credential funding decision record.
-- Answers two questions independently:
--   funding_source: who is supposed to cover this charge
--   funding_status: has that coverage been authorized or completed
--
-- Resolution hierarchy in resolvePaymentResponsibility():
--   1. Explicit record here (learner + credential + attempt)
--   2. program_credentials.exam_fee_payer default for the program
--   3. Fallback: self_pay / unresolved
--
-- Hard guard: checkout is only bypassed when
--   funding_source != 'self_pay' AND funding_status = 'approved'
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.exam_funding_authorizations (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who this covers
  learner_id                  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  credential_id               UUID NOT NULL REFERENCES public.credentials(id) ON DELETE CASCADE,
  credential_attempt_id       UUID REFERENCES public.credential_attempts(id) ON DELETE SET NULL,
  program_id                  UUID REFERENCES public.programs(id) ON DELETE SET NULL,

  -- Funding decision (both fields required — source and status are independent)
  funding_source              TEXT NOT NULL DEFAULT 'self_pay'
    CHECK (funding_source IN ('self_pay', 'elevate', 'grant', 'employer', 'partner', 'scholarship')),

  funding_status              TEXT NOT NULL DEFAULT 'unresolved'
    CHECK (funding_status IN ('unresolved', 'pending', 'approved', 'denied', 'paid', 'waived')),

  -- Amount (nullable — may not be known at creation time)
  funded_amount_cents         INTEGER,

  -- Audit trail
  funding_notes               TEXT,
  funding_approved_by         UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  funding_approved_at         TIMESTAMPTZ,

  -- Stripe linkage (populated after checkout or internal payment)
  stripe_checkout_session_id  TEXT,
  stripe_payment_intent_id    TEXT,

  tenant_id                   UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- One active authorization per learner+credential+attempt
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

-- Learners can read their own funding decisions (so UI can show "Elevate is covering your fee")
CREATE POLICY "efa_learner_read" ON public.exam_funding_authorizations
  FOR SELECT USING (learner_id = auth.uid());

-- Admins and staff have full access
CREATE POLICY "efa_admin_all" ON public.exam_funding_authorizations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Case managers can read for their assigned learners
CREATE POLICY "efa_case_manager_read" ON public.exam_funding_authorizations
  FOR SELECT USING (
    public.is_case_manager()
    AND learner_id = ANY(public.get_my_assigned_learner_ids())
  );

-- =============================================================================
-- program_credentials: add exam_fee_payer default column
--
-- This is the program-level fallback when no explicit exam_funding_authorization
-- exists for a learner. resolvePaymentResponsibility() reads this before
-- falling back to 'self_pay'.
-- =============================================================================

ALTER TABLE public.program_credentials
  ADD COLUMN IF NOT EXISTS exam_fee_payer TEXT NOT NULL DEFAULT 'self_pay'
    CHECK (exam_fee_payer IN ('self_pay', 'elevate', 'grant', 'employer', 'partner', 'scholarship'));

ALTER TABLE public.program_credentials
  ADD COLUMN IF NOT EXISTS exam_fee_cents INTEGER;

COMMENT ON COLUMN public.program_credentials.exam_fee_payer IS
  'Default funding source for the exam fee for this credential in this program. '
  'Overridden by an explicit exam_funding_authorizations record at the learner level.';

COMMENT ON COLUMN public.program_credentials.exam_fee_cents IS
  'Expected exam fee in cents. Used to pre-populate checkout and funding authorization amounts.';
