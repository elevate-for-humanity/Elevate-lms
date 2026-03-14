-- =============================================================================
-- Phase 1.3: Provider program approval workflow
--
-- External provider programs must not go live automatically.
-- Adds:
--   1. provider_program_approvals table
--   2. Trigger: blocks programs from going public without approval
--   3. RLS policies
-- =============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.provider_program_approvals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  program_id      UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,

  status          TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected')),

  submitted_by    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  reviewed_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  review_notes    TEXT,

  -- Tracks what version of the program was approved
  program_snapshot JSONB DEFAULT '{}',

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (tenant_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_ppa_tenant   ON public.provider_program_approvals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ppa_program  ON public.provider_program_approvals(program_id);
CREATE INDEX IF NOT EXISTS idx_ppa_status   ON public.provider_program_approvals(status);
CREATE INDEX IF NOT EXISTS idx_ppa_submitted ON public.provider_program_approvals(submitted_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_ppa_updated_at ON public.provider_program_approvals;
CREATE TRIGGER trg_ppa_updated_at
  BEFORE UPDATE ON public.provider_program_approvals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- Guard: provider-owned programs cannot become is_published=true without approval
-- =============================================================================
CREATE OR REPLACE FUNCTION public.enforce_program_approval_before_publish()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_tenant_type TEXT;
  v_approval_status TEXT;
BEGIN
  -- Only enforce for non-elevate tenants
  SELECT type INTO v_tenant_type
  FROM public.tenants WHERE id = NEW.tenant_id;

  IF v_tenant_type IS NULL OR v_tenant_type = 'elevate' THEN
    RETURN NEW;
  END IF;

  -- If trying to publish, check approval exists and is approved
  IF NEW.is_published = true AND (OLD.is_published IS DISTINCT FROM true) THEN
    SELECT status INTO v_approval_status
    FROM public.provider_program_approvals
    WHERE program_id = NEW.id AND tenant_id = NEW.tenant_id;

    IF v_approval_status IS DISTINCT FROM 'approved' THEN
      RAISE EXCEPTION 'Program must be approved before publishing. Current approval status: %',
        COALESCE(v_approval_status, 'not submitted');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_program_approval ON public.programs;
CREATE TRIGGER trg_enforce_program_approval
  BEFORE UPDATE ON public.programs
  FOR EACH ROW EXECUTE FUNCTION public.enforce_program_approval_before_publish();

-- =============================================================================
-- RLS
-- =============================================================================
ALTER TABLE public.provider_program_approvals ENABLE ROW LEVEL SECURITY;

-- Admins manage all approvals
DROP POLICY IF EXISTS "ppa_admin_all" ON public.provider_program_approvals;
CREATE POLICY "ppa_admin_all" ON public.provider_program_approvals
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- provider_admin can view and submit approvals for their own tenant
DROP POLICY IF EXISTS "ppa_provider_admin_own" ON public.provider_program_approvals;
CREATE POLICY "ppa_provider_admin_own" ON public.provider_program_approvals
  FOR SELECT USING (
    tenant_id = public.get_my_tenant_id()
    AND public.is_provider_admin()
  );

DROP POLICY IF EXISTS "ppa_provider_admin_insert" ON public.provider_program_approvals;
CREATE POLICY "ppa_provider_admin_insert" ON public.provider_program_approvals
  FOR INSERT WITH CHECK (
    tenant_id = public.get_my_tenant_id()
    AND public.is_provider_admin()
  );

GRANT SELECT, INSERT ON public.provider_program_approvals TO authenticated;
GRANT ALL ON public.provider_program_approvals TO service_role;

COMMIT;
