-- =============================================================================
-- CREDENTIAL REGISTRY
--
-- Three-lane authority model:
--   Lane 1 — elevate_issued:   Elevate owns curriculum, assessment, certificate
--   Lane 2 — elevate_proctored: National/regulatory body issues; Elevate proctors
--   Lane 3 — partner_delivered: Vendor/manufacturer system; Elevate only prepares
--
-- Programs reference credentials. Courses reference credentials as prep material.
-- The platform enforces: if proctor_authority = 'elevate', no external course
-- may substitute for this credential in a program.
-- =============================================================================

CREATE TABLE IF NOT EXISTS credentials (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name                  TEXT NOT NULL,
  abbreviation          TEXT,                          -- e.g. "EPA 608", "NCRC"
  description           TEXT,

  -- Three-lane classification (enforced by CHECK)
  issuer_type           TEXT NOT NULL
    CHECK (issuer_type IN ('elevate_issued', 'elevate_proctored', 'partner_delivered')),

  -- Who issues the certificate
  issuing_authority     TEXT NOT NULL,                 -- e.g. "Elevate for Humanity", "ACT", "EPA"
  issuing_authority_url TEXT,

  -- Who administers the exam/assessment
  proctor_authority     TEXT NOT NULL DEFAULT 'elevate'
    CHECK (proctor_authority IN ('elevate', 'partner', 'external_vendor', 'none')),

  -- How the credential is delivered
  delivery              TEXT NOT NULL DEFAULT 'internal'
    CHECK (delivery IN ('internal', 'external', 'hybrid')),

  -- Exam/assessment requirements
  requires_exam         BOOLEAN NOT NULL DEFAULT false,
  exam_type             TEXT
    CHECK (exam_type IN ('proctored', 'vendor', 'assessment', 'portfolio', 'none', NULL)),
  exam_location         TEXT
    CHECK (exam_location IN ('on_site', 'online', 'testing_center', 'partner_site', NULL)),
  passing_score         INTEGER,                       -- percentage, e.g. 70

  -- Verification
  verification_source   TEXT NOT NULL DEFAULT 'elevate'
    CHECK (verification_source IN ('elevate', 'issuer_api', 'external_link', 'open_badges', 'credly')),
  verification_url      TEXT,                          -- external verify URL if not Elevate
  verification_token_prefix TEXT DEFAULT 'EFH',        -- prefix for generated tokens

  -- Credential lifecycle
  renewal_period_months INTEGER,                       -- NULL = no expiry
  ceu_hours             NUMERIC(6,2),                  -- continuing education hours if applicable

  -- Workforce / funding alignment
  national_registry_id  TEXT,                          -- e.g. ACT WorkKeys code, EPA cert number
  cip_code              TEXT,                          -- Classification of Instructional Programs
  soc_code              TEXT,                          -- Standard Occupational Classification
  wioa_eligible         BOOLEAN DEFAULT false,
  dol_registered        BOOLEAN DEFAULT false,

  -- Credential stacks (grouping for employer clarity)
  credential_stack      TEXT,                          -- e.g. 'workforce_readiness', 'hvac_trades', 'customer_service'
  stack_level           TEXT
    CHECK (stack_level IN ('foundational', 'intermediate', 'advanced', NULL)),

  -- Digital credential integration (future)
  open_badges_enabled   BOOLEAN DEFAULT false,
  credly_badge_template_id TEXT,

  -- Status
  is_active             BOOLEAN NOT NULL DEFAULT true,
  is_published          BOOLEAN NOT NULL DEFAULT false, -- visible on public credential page

  -- Metadata for generator rules
  metadata              JSONB DEFAULT '{}',

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by            UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_credentials_issuer_type    ON credentials(issuer_type);
CREATE INDEX IF NOT EXISTS idx_credentials_proctor        ON credentials(proctor_authority);
CREATE INDEX IF NOT EXISTS idx_credentials_stack          ON credentials(credential_stack);
CREATE INDEX IF NOT EXISTS idx_credentials_active         ON credentials(is_active) WHERE is_active = true;

-- =============================================================================
-- LEARNER CREDENTIALS (issued records)
-- =============================================================================

CREATE TABLE IF NOT EXISTS learner_credentials (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credential_id       UUID NOT NULL REFERENCES credentials(id) ON DELETE RESTRICT,
  program_id          UUID,                            -- which program produced this

  -- Issuance
  issued_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at          TIMESTAMPTZ,                     -- NULL = no expiry
  issued_by           UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Verification
  verification_code   TEXT NOT NULL UNIQUE DEFAULT
    CONCAT('EFH-', UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8))),

  -- Status
  status              TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'expired', 'revoked', 'suspended')),
  revoked_at          TIMESTAMPTZ,
  revoked_reason      TEXT,

  -- Exam outcome that triggered issuance
  exam_score          INTEGER,
  exam_attempt_id     UUID,

  -- Digital credential
  badge_url           TEXT,
  certificate_url     TEXT,

  notes               TEXT,
  metadata            JSONB DEFAULT '{}',

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (learner_id, credential_id, issued_at)
);

CREATE INDEX IF NOT EXISTS idx_lc_learner     ON learner_credentials(learner_id);
CREATE INDEX IF NOT EXISTS idx_lc_credential  ON learner_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_lc_verify      ON learner_credentials(verification_code);
CREATE INDEX IF NOT EXISTS idx_lc_status      ON learner_credentials(status) WHERE status = 'active';

-- =============================================================================
-- CREDENTIAL ATTEMPTS (exam/assessment attempts)
-- =============================================================================

CREATE TABLE IF NOT EXISTS credential_attempts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credential_id   UUID NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
  program_id      UUID,

  attempt_number  INTEGER NOT NULL DEFAULT 1,
  attempted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,

  score           INTEGER,
  passed          BOOLEAN,
  proctor_id      UUID REFERENCES profiles(id) ON DELETE SET NULL,
  proctor_notes   TEXT,

  -- If this attempt resulted in issuance
  credential_issued_id UUID REFERENCES learner_credentials(id) ON DELETE SET NULL,

  metadata        JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_ca_learner    ON credential_attempts(learner_id);
CREATE INDEX IF NOT EXISTS idx_ca_credential ON credential_attempts(credential_id);

-- =============================================================================
-- PROGRAM CREDENTIALS (programs reference credentials, not raw courses)
-- =============================================================================

CREATE TABLE IF NOT EXISTS program_credentials (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id      UUID NOT NULL,
  credential_id   UUID NOT NULL REFERENCES credentials(id) ON DELETE CASCADE,
  is_required     BOOLEAN NOT NULL DEFAULT true,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  notes           TEXT,                                -- e.g. "Complete before EPA exam"
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (program_id, credential_id)
);

CREATE INDEX IF NOT EXISTS idx_pc_program    ON program_credentials(program_id);
CREATE INDEX IF NOT EXISTS idx_pc_credential ON program_credentials(credential_id);

-- =============================================================================
-- LINK training_courses TO credentials (non-breaking — nullable FK)
-- =============================================================================

ALTER TABLE training_courses
  ADD COLUMN IF NOT EXISTS credential_id UUID REFERENCES credentials(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tc_credential ON training_courses(credential_id)
  WHERE credential_id IS NOT NULL;

-- =============================================================================
-- RLS
-- =============================================================================

ALTER TABLE credentials           ENABLE ROW LEVEL SECURITY;
ALTER TABLE learner_credentials   ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_attempts   ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_credentials   ENABLE ROW LEVEL SECURITY;

-- Public can read published credentials (for verification page)
CREATE POLICY "credentials_public_read" ON credentials
  FOR SELECT USING (is_published = true AND is_active = true);

-- Admins manage all credentials
CREATE POLICY "credentials_admin_all" ON credentials
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin','super_admin','org_admin','staff')
  ));

-- Learners read their own issued credentials
CREATE POLICY "lc_learner_read" ON learner_credentials
  FOR SELECT TO authenticated USING (learner_id = auth.uid());

CREATE POLICY "lc_admin_all" ON learner_credentials
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin','super_admin','org_admin','staff')
  ));

-- Learners read their own attempts
CREATE POLICY "ca_learner_read" ON credential_attempts
  FOR SELECT TO authenticated USING (learner_id = auth.uid());

CREATE POLICY "ca_admin_all" ON credential_attempts
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin','super_admin','org_admin','staff')
  ));

-- Authenticated users read program credentials
CREATE POLICY "pc_read" ON program_credentials
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "pc_admin_all" ON program_credentials
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin','super_admin','org_admin','staff')
  ));

GRANT SELECT ON credentials           TO authenticated;
GRANT ALL    ON credentials           TO service_role;
GRANT SELECT ON learner_credentials   TO authenticated;
GRANT ALL    ON learner_credentials   TO service_role;
GRANT SELECT ON credential_attempts   TO authenticated;
GRANT ALL    ON credential_attempts   TO service_role;
GRANT SELECT ON program_credentials   TO authenticated;
GRANT ALL    ON program_credentials   TO service_role;
