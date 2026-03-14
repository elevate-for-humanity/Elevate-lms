-- =============================================================================
-- credential_providers
--
-- Normalizes the certifying body / issuing authority relationship.
-- Replaces the flat issuing_authority text on credential_registry with a
-- proper FK so exam routing, verification adapters, and reporting can all
-- resolve by provider rather than by string matching.
--
-- credential_registry.issuing_authority is kept for display/legacy.
-- credential_registry.provider_id is the FK used by pipeline logic.
--
-- exam_schedule_requests.certifying_body (text) is kept as-is — it will be
-- backfilled from provider.name after this migration runs.
--
-- Provider types:
--   federal_agency   — EPA, DOT, IRS
--   state_agency     — Indiana PLA, Indiana BMV, Indiana SDOH
--   industry_body    — CompTIA, ACT, NCCT, ICAADA
--   elevate          — Credentials Elevate issues directly
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.credential_providers (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  provider_type         TEXT NOT NULL
    CHECK (provider_type IN ('federal_agency','state_agency','industry_body','elevate')),
  -- Exam scheduling: URL or NULL if scheduling is manual / external
  exam_scheduling_url   TEXT,
  -- Verification: REST endpoint base URL, or NULL if manual
  verification_api      TEXT,
  -- Adapter key used by lib/credentials/verification.ts provider registry
  -- Must match the key registered in the VerificationProviderRegistry
  verification_adapter  TEXT,
  logo_url              TEXT,
  contact_email         TEXT,
  notes                 TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_credential_providers_name
  ON public.credential_providers (name);

CREATE INDEX IF NOT EXISTS idx_credential_providers_type
  ON public.credential_providers (provider_type);

DROP TRIGGER IF EXISTS trg_cp_updated_at ON public.credential_providers;
CREATE TRIGGER trg_cp_updated_at
  BEFORE UPDATE ON public.credential_providers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.credential_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cp_read_authenticated" ON public.credential_providers
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "cp_admin_all" ON public.credential_providers
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

GRANT SELECT ON public.credential_providers TO authenticated;
GRANT ALL    ON public.credential_providers TO service_role;

-- =============================================================================
-- Seed credential providers
-- Deterministic UUIDs for stable FK references across environments.
-- =============================================================================

INSERT INTO public.credential_providers
  (id, name, provider_type, exam_scheduling_url, verification_api,
   verification_adapter, contact_email, notes)
VALUES

-- EPA — federal, proctors on-site at Elevate
('cp000000-0000-0000-0000-000000000001',
 'U.S. Environmental Protection Agency', 'federal_agency',
 'https://www.epa.gov/section608',
 NULL,
 'epa_direct',
 NULL,
 'EPA 608 exams are proctored on-site at Elevate. No external scheduling URL.'),

-- CompTIA — industry body, Pearson VUE scheduling
('cp000000-0000-0000-0000-000000000002',
 'CompTIA', 'industry_body',
 'https://home.pearsonvue.com/comptia',
 'https://api.comptia.org/v1',
 'comptia',
 'customerservice@comptia.org',
 'Security+ SY0-701. Pearson VUE test centers or online proctored.'),

-- Indiana PLA — state agency, no public API
('cp000000-0000-0000-0000-000000000003',
 'Indiana Professional Licensing Agency', 'state_agency',
 'https://www.in.gov/pla/barbering-and-cosmetology/',
 NULL,
 'indiana_pla',
 'pla@pla.in.gov',
 'Barber, Cosmetology, Nail Tech state board exams. Manual scheduling via PLA portal.'),

-- ACT — industry body, WorkKeys / NCRC
('cp000000-0000-0000-0000-000000000004',
 'ACT', 'industry_body',
 'https://www.act.org/content/act/en/products-and-services/workkeys-for-job-seekers.html',
 'https://api.act.org/workkeys/v1',
 'act_workkeys',
 'workkeys@act.org',
 'WorkKeys NCRC. Elevate is an authorized ACT testing site.'),

-- NCCT — industry body, Medical Assistant + Phlebotomy
('cp000000-0000-0000-0000-000000000005',
 'National Center for Competency Testing', 'industry_body',
 'https://www.ncctinc.com/certifications',
 'https://www.ncctinc.com/api/verify',
 'ncct',
 'info@ncctinc.com',
 'NCMA and NPT certifications. Computer-based at approved test sites.'),

-- Indiana BMV — state agency, CDL
('cp000000-0000-0000-0000-000000000006',
 'Indiana Bureau of Motor Vehicles', 'state_agency',
 'https://www.in.gov/bmv/licenses-permits-ids/commercial-driver-license/',
 NULL,
 'indiana_bmv',
 NULL,
 'CDL Class A knowledge and skills tests. Scheduled through Indiana BMV.'),

-- Indiana SDOH — state agency, CNA
('cp000000-0000-0000-0000-000000000007',
 'Indiana State Department of Health', 'state_agency',
 'https://www.in.gov/isdh/nursing-assistant-registry/',
 'https://www.in.gov/isdh/api/cna',
 'indiana_sdoh',
 NULL,
 'CNA state exam via Prometric. Registry verification available.'),

-- ICAADA — industry body, Peer Recovery Specialist
('cp000000-0000-0000-0000-000000000008',
 'Indiana Counseling Association on Alcohol and Drug Abuse', 'industry_body',
 'https://www.icaada.org/certification',
 NULL,
 'icaada',
 'info@icaada.org',
 'PRS certification exam. Manual scheduling through ICAADA.'),

-- DOT — federal agency, Specimen Collector
('cp000000-0000-0000-0000-000000000009',
 'U.S. Department of Transportation', 'federal_agency',
 'https://www.transportation.gov/odapc/dot-drug-alcohol-testing',
 NULL,
 'dot_odapc',
 NULL,
 'DOT 49 CFR Part 40 collector certification. Practical assessment at Elevate.'),

-- IRS — federal agency, AFSP
('cp000000-0000-0000-0000-000000000010',
 'Internal Revenue Service', 'federal_agency',
 'https://www.irs.gov/tax-professionals/annual-filing-season-program',
 'https://www.irs.gov/api/efin/v1',
 'irs_afsp',
 NULL,
 'AFSP CE completion tracked via IRS PTIN system. No separate exam.'),

-- Elevate — for internally-issued credentials
('cp000000-0000-0000-0000-000000000011',
 'Elevate for Humanity', 'elevate',
 NULL,
 NULL,
 'elevate_internal',
 'info@elevateforhumanity.org',
 'Credentials issued directly by Elevate for Humanity.')

ON CONFLICT (name) DO UPDATE SET
  provider_type        = EXCLUDED.provider_type,
  exam_scheduling_url  = EXCLUDED.exam_scheduling_url,
  verification_api     = EXCLUDED.verification_api,
  verification_adapter = EXCLUDED.verification_adapter,
  contact_email        = EXCLUDED.contact_email,
  notes                = EXCLUDED.notes,
  updated_at           = now();

-- =============================================================================
-- Add provider_id FK to credential_registry
-- Nullable initially — backfilled below, constrained after.
-- issuing_authority text column is kept for display.
-- =============================================================================

ALTER TABLE public.credential_registry
  ADD COLUMN IF NOT EXISTS provider_id UUID
    REFERENCES public.credential_providers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cr_provider
  ON public.credential_registry (provider_id);

-- =============================================================================
-- Backfill provider_id for the 14 credentials seeded in migration 000007
-- and the 22 existing live rows where issuing_authority matches.
-- Uses issuing_authority text to resolve — safe because we control both sides.
-- =============================================================================

UPDATE public.credential_registry SET provider_id = 'cp000000-0000-0000-0000-000000000001'
  WHERE issuing_authority ILIKE '%Environmental Protection%' OR abbreviation = 'EPA-608';

UPDATE public.credential_registry SET provider_id = 'cp000000-0000-0000-0000-000000000002'
  WHERE issuing_authority ILIKE '%CompTIA%' OR abbreviation = 'SEC+';

UPDATE public.credential_registry SET provider_id = 'cp000000-0000-0000-0000-000000000003'
  WHERE issuing_authority ILIKE '%Professional Licensing%'
     OR abbreviation IN ('IN-BARBER','IN-COSMO','IN-NAIL');

UPDATE public.credential_registry SET provider_id = 'cp000000-0000-0000-0000-000000000004'
  WHERE issuing_authority ILIKE '%ACT%'
     OR abbreviation IN ('NCRC','WK-MATH','WK-DOCS','WK-GRAPH');

UPDATE public.credential_registry SET provider_id = 'cp000000-0000-0000-0000-000000000005'
  WHERE issuing_authority ILIKE '%Competency Testing%'
     OR abbreviation IN ('NCMA','NPT');

UPDATE public.credential_registry SET provider_id = 'cp000000-0000-0000-0000-000000000006'
  WHERE issuing_authority ILIKE '%Motor Vehicles%' OR abbreviation = 'CDL-A';

UPDATE public.credential_registry SET provider_id = 'cp000000-0000-0000-0000-000000000007'
  WHERE issuing_authority ILIKE '%Department of Health%' OR abbreviation = 'IN-CNA';

UPDATE public.credential_registry SET provider_id = 'cp000000-0000-0000-0000-000000000008'
  WHERE issuing_authority ILIKE '%ICAADA%' OR abbreviation = 'IN-PRS';

UPDATE public.credential_registry SET provider_id = 'cp000000-0000-0000-0000-000000000009'
  WHERE issuing_authority ILIKE '%Transportation%' OR abbreviation = 'DOT-COLLECTOR';

UPDATE public.credential_registry SET provider_id = 'cp000000-0000-0000-0000-000000000010'
  WHERE issuing_authority ILIKE '%Internal Revenue%' OR abbreviation = 'AFSP';

-- Elevate-issued credentials (issuer_type = 'elevate_issued')
UPDATE public.credential_registry SET provider_id = 'cp000000-0000-0000-0000-000000000011'
  WHERE issuer_type = 'elevate_issued' AND provider_id IS NULL;

-- =============================================================================
-- Add provider_id to exam_schedule_requests so routing resolves by FK
-- certifying_body text is kept for legacy display.
-- =============================================================================

ALTER TABLE public.exam_schedule_requests
  ADD COLUMN IF NOT EXISTS provider_id UUID
    REFERENCES public.credential_providers(id) ON DELETE SET NULL;

-- Backfill from certifying_body text where possible
UPDATE public.exam_schedule_requests esr
SET provider_id = cp.id
FROM public.credential_providers cp
WHERE esr.provider_id IS NULL
  AND esr.certifying_body ILIKE '%' || cp.name || '%';
