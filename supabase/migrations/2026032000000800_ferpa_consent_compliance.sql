-- =============================================================================
-- Phase 5.2 + 5.3 + 5.4: FERPA deletion, consent records, compliance normalization
--
-- Adds:
--   1. data_deletion_requests — FERPA/CCPA deletion request tracking
--   2. consent_records — structured consent for data sharing
--   3. tenant_compliance_records — replaces text flags with structured records
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. data_deletion_requests
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.data_deletion_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  requested_by    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  request_type    TEXT NOT NULL DEFAULT 'full_deletion',
    CHECK (request_type IN ('full_deletion', 'anonymization', 'partial_deletion', 'export_only')),
  legal_basis     TEXT NOT NULL DEFAULT 'ferpa',
    CHECK (legal_basis IN ('ferpa', 'ccpa', 'gdpr', 'learner_request', 'court_order')),

  status          TEXT NOT NULL DEFAULT 'pending',
    CHECK (status IN ('pending', 'under_review', 'approved', 'processing', 'completed', 'rejected')),

  -- What was done
  fields_deleted  TEXT[],
  fields_retained TEXT[],
  retention_reason TEXT,

  -- Processing
  reviewed_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  completion_notes TEXT,

  -- Audit trail of what was anonymized
  anonymization_log JSONB DEFAULT '[]',

  tenant_id       UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ddr_learner  ON public.data_deletion_requests(learner_id);
CREATE INDEX IF NOT EXISTS idx_ddr_status   ON public.data_deletion_requests(status);
CREATE INDEX IF NOT EXISTS idx_ddr_tenant   ON public.data_deletion_requests(tenant_id);

DROP TRIGGER IF EXISTS trg_ddr_updated_at ON public.data_deletion_requests;
CREATE TRIGGER trg_ddr_updated_at
  BEFORE UPDATE ON public.data_deletion_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.data_deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "ddr_admin_all" ON public.data_deletion_requests;
CREATE POLICY "ddr_admin_all" ON public.data_deletion_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "ddr_learner_read_own" ON public.data_deletion_requests;
CREATE POLICY "ddr_learner_read_own" ON public.data_deletion_requests
  FOR SELECT USING (learner_id = auth.uid());

GRANT SELECT ON public.data_deletion_requests TO authenticated;
GRANT ALL ON public.data_deletion_requests TO service_role;

-- =============================================================================
-- 2. consent_records — explicit, queryable consent for data sharing
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.consent_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  consent_type    TEXT NOT NULL,
    CHECK (consent_type IN (
      'employer_data_sharing',
      'workforce_agency_sharing',
      'partner_institution_sharing',
      'marketing_communications',
      'research_participation',
      'third_party_verification',
      'wioa_reporting',
      'ferpa_directory_disclosure'
    )),

  -- Who the consent is granted to (nullable = platform-wide)
  granted_to_type TEXT CHECK (granted_to_type IN ('employer', 'workforce_agency', 'partner', 'platform')),
  granted_to_id   UUID,

  granted         BOOLEAN NOT NULL DEFAULT false,
  granted_at      TIMESTAMPTZ,
  revoked_at      TIMESTAMPTZ,

  -- How consent was collected
  collection_method TEXT NOT NULL DEFAULT 'enrollment_form',
    CHECK (collection_method IN ('enrollment_form', 'explicit_prompt', 'email_confirmation', 'paper_form', 'system_import')),

  ip_address      INET,
  user_agent      TEXT,
  form_version    TEXT,

  tenant_id       UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()

  -- One active consent record per learner+type+grantee
  UNIQUE NULLS NOT DISTINCT (learner_id, consent_type, granted_to_type, granted_to_id)
);

CREATE INDEX IF NOT EXISTS idx_cr_learner      ON public.consent_records(learner_id);
CREATE INDEX IF NOT EXISTS idx_cr_type         ON public.consent_records(consent_type);
CREATE INDEX IF NOT EXISTS idx_cr_granted      ON public.consent_records(granted, granted_at);
CREATE INDEX IF NOT EXISTS idx_cr_tenant       ON public.consent_records(tenant_id);

DROP TRIGGER IF EXISTS trg_cr_updated_at ON public.consent_records;
CREATE TRIGGER trg_cr_updated_at
  BEFORE UPDATE ON public.consent_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cr_admin_all" ON public.consent_records;
CREATE POLICY "cr_admin_all" ON public.consent_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
  );

DROP POLICY IF EXISTS "cr_learner_own" ON public.consent_records;
CREATE POLICY "cr_learner_own" ON public.consent_records
  FOR ALL USING (learner_id = auth.uid())
  WITH CHECK (learner_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public.consent_records TO authenticated;
GRANT ALL ON public.consent_records TO service_role;

-- =============================================================================
-- 3. tenant_compliance_records — structured compliance status per tenant
--    Replaces text flags (compliance_ferpa, compliance_wioa, etc.) with
--    queryable, reportable records.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.tenant_compliance_records (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  compliance_area TEXT NOT NULL,
    CHECK (compliance_area IN (
      'ferpa', 'wioa', 'workforce_ready_grant', 'jri', 'dol_apprenticeship',
      'hipaa', 'ccpa', 'ada', 'title_ix', 'etpl'
    )),

  status          TEXT NOT NULL DEFAULT 'not_assessed',
    CHECK (status IN ('compliant', 'non_compliant', 'under_review', 'not_applicable', 'not_assessed')),

  assessed_by     UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  assessed_at     TIMESTAMPTZ,
  next_review_at  TIMESTAMPTZ,
  notes           TEXT,
  documentation_url TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()

  UNIQUE (tenant_id, compliance_area)
);

CREATE INDEX IF NOT EXISTS idx_tcr_tenant  ON public.tenant_compliance_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tcr_status  ON public.tenant_compliance_records(status);
CREATE INDEX IF NOT EXISTS idx_tcr_area    ON public.tenant_compliance_records(compliance_area);

DROP TRIGGER IF EXISTS trg_tcr_updated_at ON public.tenant_compliance_records;
CREATE TRIGGER trg_tcr_updated_at
  BEFORE UPDATE ON public.tenant_compliance_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.tenant_compliance_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tcr_admin_all" ON public.tenant_compliance_records;
CREATE POLICY "tcr_admin_all" ON public.tenant_compliance_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "tcr_provider_read_own" ON public.tenant_compliance_records;
CREATE POLICY "tcr_provider_read_own" ON public.tenant_compliance_records
  FOR SELECT USING (
    tenant_id = public.get_my_tenant_id()
  );

GRANT SELECT ON public.tenant_compliance_records TO authenticated;
GRANT ALL ON public.tenant_compliance_records TO service_role;

COMMIT;
