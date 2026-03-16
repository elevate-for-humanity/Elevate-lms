-- =============================================================================
-- Certification Pathway Registry
--
-- Decouples training programs from certification bodies so one curriculum
-- can support multiple credential pathways (different orgs, different states).
--
-- Architecture:
--   programs → program_certification_pathways → certification_bodies
--
-- When a student completes training, the system shows them available pathways
-- from program_certification_pathways. The student selects one. That selection
-- drives the certification_requests workflow (migration 20260326000001).
--
-- certification_requests gains a pathway_id FK so every request is traceable
-- to the specific body and credential the student chose.
--
-- Seeded with PRS pathways:
--   CPRC  — Certified Peer Recovery Coach (ICAADA)
--   CPSP  — Certified Peer Support Professional (NAADAC)
--   CCHW  — Certified Community Health Worker (Indiana ISDH)
-- =============================================================================

BEGIN;

-- ── 1. certification_bodies ───────────────────────────────────────────────────
-- The organizations that issue credentials. Separate from credential_providers
-- (which is the technical routing layer). This is the public-facing registry
-- students and admins see.

CREATE TABLE IF NOT EXISTS public.certification_bodies (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  abbreviation          TEXT,
  website               TEXT,
  application_url       TEXT,           -- where students apply for exam eligibility
  contact_email         TEXT,
  state                 TEXT,           -- NULL = national
  notes                 TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (name)
);

ALTER TABLE public.certification_bodies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cb_read_authenticated" ON public.certification_bodies
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "cb_public_read" ON public.certification_bodies
  FOR SELECT USING (is_active = true);

CREATE POLICY "cb_admin_all" ON public.certification_bodies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

GRANT SELECT ON public.certification_bodies TO anon, authenticated;
GRANT ALL    ON public.certification_bodies TO service_role;

-- ── 2. program_certification_pathways ─────────────────────────────────────────
-- Links a training program to one or more certification options.
-- Each row = one credential a student can pursue after completing the program.
--
-- eligibility_review_required:
--   true  → certifying body reviews application before allowing exam registration
--           (ICAADA CPRC, most state boards)
--   false → student can register for exam directly after training completion
--           (some national certs with open registration)
--
-- fee_payer:
--   elevate   → Elevate pays exam fee on student's behalf (default for funded programs)
--   student   → student pays directly
--   grant     → covered by WIOA/WRG/JRI grant — no Stripe charge needed

CREATE TABLE IF NOT EXISTS public.program_certification_pathways (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id                  UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  certification_body_id       UUID NOT NULL REFERENCES public.certification_bodies(id),
  credential_registry_id      UUID REFERENCES public.credential_registry(id),
  credential_name             TEXT NOT NULL,          -- display name, e.g. "Certified Peer Recovery Coach"
  credential_abbreviation     TEXT,                   -- e.g. "CPRC"
  -- Eligibility
  eligibility_review_required BOOLEAN NOT NULL DEFAULT true,
  application_url             TEXT,                   -- override body-level URL if pathway-specific
  -- Exam
  exam_fee_cents              INTEGER NOT NULL DEFAULT 0,
  fee_payer                   TEXT NOT NULL DEFAULT 'elevate'
    CHECK (fee_payer IN ('elevate', 'student', 'grant')),
  -- State scope — NULL means available in all states
  state_scope                 TEXT,
  -- Curriculum coverage note — what this training covers toward this credential
  coverage_note               TEXT,
  -- Display
  is_primary                  BOOLEAN NOT NULL DEFAULT false,  -- shown first on student dashboard
  is_active                   BOOLEAN NOT NULL DEFAULT true,
  sort_order                  INTEGER NOT NULL DEFAULT 0,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (program_id, certification_body_id, credential_abbreviation)
);

CREATE INDEX IF NOT EXISTS idx_pcp_program  ON public.program_certification_pathways(program_id);
CREATE INDEX IF NOT EXISTS idx_pcp_body     ON public.program_certification_pathways(certification_body_id);
CREATE INDEX IF NOT EXISTS idx_pcp_active   ON public.program_certification_pathways(is_active);

ALTER TABLE public.program_certification_pathways ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pcp_read_authenticated" ON public.program_certification_pathways
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "pcp_public_read" ON public.program_certification_pathways
  FOR SELECT USING (is_active = true);

CREATE POLICY "pcp_admin_all" ON public.program_certification_pathways
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

GRANT SELECT ON public.program_certification_pathways TO anon, authenticated;
GRANT ALL    ON public.program_certification_pathways TO service_role;

-- ── 3. Add pathway_id to certification_requests ───────────────────────────────
-- Ties every certification request to the specific pathway the student chose.
-- Nullable for backward compatibility with existing rows.

ALTER TABLE public.certification_requests
  ADD COLUMN IF NOT EXISTS pathway_id UUID
    REFERENCES public.program_certification_pathways(id) ON DELETE SET NULL;

-- ── 4. updated_at triggers ────────────────────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_cb_updated_at') THEN
    CREATE TRIGGER trg_cb_updated_at
      BEFORE UPDATE ON public.certification_bodies
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_pcp_updated_at') THEN
    CREATE TRIGGER trg_pcp_updated_at
      BEFORE UPDATE ON public.program_certification_pathways
      FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;

-- ── 5. Seed certification bodies ──────────────────────────────────────────────

INSERT INTO public.certification_bodies (
  id, name, abbreviation, website, application_url, contact_email, state, notes
) VALUES

-- ICAADA — Indiana, issues CPRC
('cb000000-0000-0000-0000-000000000001',
 'Indiana Counselors Association on Alcohol and Drug Abuse',
 'ICAADA',
 'https://www.icaada.org',
 'https://www.icaada.org/certification',
 'info@icaada.org',
 'IN',
 'Issues CPRC (Certified Peer Recovery Coach) in Indiana. Requires application review before exam registration. Exam fee ~$75.'),

-- NAADAC — national, issues CPRS and NCPRSS
('cb000000-0000-0000-0000-000000000002',
 'NAADAC, the Association for Addiction Professionals',
 'NAADAC',
 'https://www.naadac.org',
 'https://www.naadac.org/ncprss',
 'naadac@naadac.org',
 NULL,
 'Issues National Certified Peer Recovery Support Specialist (NCPRSS). National credential, accepted in multiple states. Exam fee ~$195.'),

-- Indiana ISDH — issues CCHW
('cb000000-0000-0000-0000-000000000003',
 'Indiana State Department of Health',
 'ISDH',
 'https://www.in.gov/isdh',
 'https://www.in.gov/isdh/community-health-workers/',
 NULL,
 'IN',
 'Issues Certified Community Health Worker (CCHW) in Indiana. Training-based — no separate exam. Completion documentation submitted to ISDH.'),

-- IC&RC — international, issues CPRS and CADC
('cb000000-0000-0000-0000-000000000004',
 'International Certification and Reciprocity Consortium',
 'IC&RC',
 'https://internationalcredentialing.org',
 'https://internationalcredentialing.org/peer-recovery',
 'info@internationalcredentialing.org',
 NULL,
 'Issues CPRS (Certified Peer Recovery Specialist) — accepted in 47 states via reciprocity. Strong choice for students who may relocate. Exam fee ~$150.')

ON CONFLICT (name) DO UPDATE SET
  abbreviation    = EXCLUDED.abbreviation,
  website         = EXCLUDED.website,
  application_url = EXCLUDED.application_url,
  contact_email   = EXCLUDED.contact_email,
  state           = EXCLUDED.state,
  notes           = EXCLUDED.notes,
  updated_at      = now();

-- ── 6. Seed PRS program pathways ─────────────────────────────────────────────
-- Links peer-recovery-specialist-jri to all four certification bodies.
-- is_primary = true on ICAADA CPRC (Indiana default for JRI-funded students).

INSERT INTO public.program_certification_pathways (
  program_id,
  certification_body_id,
  credential_registry_id,
  credential_name,
  credential_abbreviation,
  eligibility_review_required,
  application_url,
  exam_fee_cents,
  fee_payer,
  state_scope,
  coverage_note,
  is_primary,
  sort_order
)
SELECT
  p.id,
  cb.id,
  cr.id,
  v.credential_name,
  v.credential_abbreviation,
  v.eligibility_review_required,
  v.application_url,
  v.exam_fee_cents,
  v.fee_payer,
  v.state_scope,
  v.coverage_note,
  v.is_primary,
  v.sort_order
FROM public.programs p
CROSS JOIN (VALUES
  -- ICAADA CPRC — Indiana default, JRI-funded
  ('cb000000-0000-0000-0000-000000000001',
   '00000000-0000-0000-0000-000000000109',
   'Certified Peer Recovery Coach', 'CPRC',
   true,
   'https://www.icaada.org/certification',
   7500, 'elevate', 'IN',
   'Elevate training covers all ICAADA CPRC competency domains. Exam fee covered for JRI-funded students.',
   true, 1),

  -- NAADAC NCPRSS — national, good for students who may leave Indiana
  ('cb000000-0000-0000-0000-000000000002',
   NULL,
   'National Certified Peer Recovery Support Specialist', 'NCPRSS',
   true,
   'https://www.naadac.org/ncprss',
   19500, 'student', NULL,
   'Elevate training aligns with NAADAC core competencies. National credential accepted in multiple states. Student pays exam fee.',
   false, 2),

  -- ISDH CCHW — Indiana, no exam, documentation-based
  ('cb000000-0000-0000-0000-000000000003',
   NULL,
   'Certified Community Health Worker', 'CCHW',
   false,
   'https://www.in.gov/isdh/community-health-workers/',
   0, 'elevate', 'IN',
   'CCHW is documentation-based — no exam. Elevate submits completion records to ISDH on student behalf.',
   false, 3),

  -- IC&RC CPRS — international reciprocity, strongest portability
  ('cb000000-0000-0000-0000-000000000004',
   NULL,
   'Certified Peer Recovery Specialist', 'CPRS',
   true,
   'https://internationalcredentialing.org/peer-recovery',
   15000, 'student', NULL,
   'IC&RC CPRS accepted in 47 states via reciprocity. Recommended for students planning to work outside Indiana.',
   false, 4)
) AS v(
  cert_body_id, cred_registry_id,
  credential_name, credential_abbreviation,
  eligibility_review_required, application_url,
  exam_fee_cents, fee_payer, state_scope,
  coverage_note, is_primary, sort_order
)
JOIN public.certification_bodies cb ON cb.id = v.cert_body_id::uuid
LEFT JOIN public.credential_registry cr ON cr.id = v.cred_registry_id::uuid
WHERE p.slug = 'peer-recovery-specialist-jri'
ON CONFLICT (program_id, certification_body_id, credential_abbreviation) DO UPDATE SET
  credential_name             = EXCLUDED.credential_name,
  eligibility_review_required = EXCLUDED.eligibility_review_required,
  application_url             = EXCLUDED.application_url,
  exam_fee_cents              = EXCLUDED.exam_fee_cents,
  fee_payer                   = EXCLUDED.fee_payer,
  coverage_note               = EXCLUDED.coverage_note,
  is_primary                  = EXCLUDED.is_primary,
  sort_order                  = EXCLUDED.sort_order,
  updated_at                  = now();

COMMIT;
