-- EPA 608 certification pipeline.
-- Covers: exam eligibility gating, employer cohort enrollment,
-- exam scheduling requests, and certifying body routing.
-- Depends on: credential_registry, cohorts, profiles, exam_sessions (all pre-existing)

-- ── 1. Extend learner_credentials ─────────────────────────────────────────
-- Fields required by workforce contracts and employer audits.

ALTER TABLE learner_credentials
  ADD COLUMN IF NOT EXISTS certifying_body    TEXT CHECK (certifying_body IN ('esco','mainstream','elevate','other')),
  ADD COLUMN IF NOT EXISTS certificate_number TEXT,
  ADD COLUMN IF NOT EXISTS proctor_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS exam_date          DATE,
  ADD COLUMN IF NOT EXISTS exam_type          TEXT CHECK (exam_type IN ('core','type_i','type_ii','type_iii','universal')),
  ADD COLUMN IF NOT EXISTS cohort_id          UUID REFERENCES cohorts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_learner_creds_cohort
  ON learner_credentials(cohort_id);

CREATE INDEX IF NOT EXISTS idx_learner_creds_cert_number
  ON learner_credentials(certificate_number)
  WHERE certificate_number IS NOT NULL;

-- ── 2. EPA exam domains ────────────────────────────────────────────────────
-- Core, Type I, II, III — each with a required sim pass count before eligibility.

CREATE TABLE IF NOT EXISTS epa_exam_domains (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_key               TEXT NOT NULL UNIQUE,
  label                    TEXT NOT NULL,
  description              TEXT,
  required_sim_pass_count  INTEGER NOT NULL DEFAULT 1,
  required_module_count    INTEGER NOT NULL DEFAULT 0,
  sort_order               INTEGER NOT NULL DEFAULT 0,
  is_active                BOOLEAN NOT NULL DEFAULT true,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE epa_exam_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read domains"
  ON epa_exam_domains FOR SELECT USING (is_active = true);

CREATE POLICY "Admins manage domains"
  ON epa_exam_domains FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin','super_admin','org_admin','staff')
  ));

INSERT INTO epa_exam_domains (domain_key, label, description, required_sim_pass_count, sort_order)
VALUES
  ('core',    'EPA 608 Core',                  'Refrigerant handling, environmental impact, regulatory requirements', 2, 1),
  ('type_i',  'Type I — Small Appliances',     'Systems with 5 lbs or less of refrigerant (refrigerators, window units)', 1, 2),
  ('type_ii', 'Type II — High-Pressure Systems','Residential and commercial split systems, heat pumps', 2, 3),
  ('type_iii','Type III — Low-Pressure Systems','Centrifugal chillers using low-pressure refrigerants', 1, 4)
ON CONFLICT (domain_key) DO NOTHING;

-- Link sims to exam domains
ALTER TABLE training_simulations
  ADD COLUMN IF NOT EXISTS exam_domain TEXT REFERENCES epa_exam_domains(domain_key) ON DELETE SET NULL;

UPDATE training_simulations SET exam_domain = CASE sim_key
  WHEN 'sim-01' THEN 'type_ii'
  WHEN 'sim-02' THEN 'type_ii'
  WHEN 'sim-03' THEN 'core'
  WHEN 'sim-04' THEN 'type_ii'
  WHEN 'sim-05' THEN 'type_ii'
  WHEN 'sim-06' THEN 'type_ii'
  WHEN 'sim-07' THEN 'core'
  WHEN 'sim-08' THEN 'core'
  WHEN 'sim-09' THEN 'core'
  WHEN 'sim-10' THEN 'type_ii'
END
WHERE exam_domain IS NULL;

-- ── 3. Learner exam eligibility tracker ───────────────────────────────────
-- Per-learner, per-credential, per-domain readiness state.
-- Upserted by evaluate_exam_eligibility() after each sim attempt completion.

CREATE TABLE IF NOT EXISTS learner_exam_eligibility (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credential_id       UUID NOT NULL REFERENCES credential_registry(id) ON DELETE CASCADE,
  domain_key          TEXT NOT NULL REFERENCES epa_exam_domains(domain_key) ON DELETE CASCADE,
  sims_passed         INTEGER NOT NULL DEFAULT 0,
  sims_required       INTEGER NOT NULL DEFAULT 1,
  modules_completed   INTEGER NOT NULL DEFAULT 0,
  modules_required    INTEGER NOT NULL DEFAULT 0,
  is_eligible         BOOLEAN NOT NULL DEFAULT false,
  eligible_at         TIMESTAMPTZ,
  last_evaluated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (learner_id, credential_id, domain_key)
);

CREATE INDEX IF NOT EXISTS idx_eligibility_learner
  ON learner_exam_eligibility(learner_id, credential_id);

ALTER TABLE learner_exam_eligibility ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Learners read own eligibility"
  ON learner_exam_eligibility FOR SELECT USING (learner_id = auth.uid());

CREATE POLICY "Admins manage eligibility"
  ON learner_exam_eligibility FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin','super_admin','org_admin','staff')
  ));

-- ── 4. evaluate_exam_eligibility() ────────────────────────────────────────
-- Upserts eligibility rows for all domains for a given learner + credential.
-- Call after every sim_attempt completion.

CREATE OR REPLACE FUNCTION evaluate_exam_eligibility(
  p_learner_id    UUID,
  p_credential_id UUID
)
RETURNS TABLE(domain_key TEXT, is_eligible BOOLEAN, sims_passed INTEGER, sims_required INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH domain_progress AS (
    SELECT
      d.domain_key,
      d.required_sim_pass_count                                              AS sims_required,
      COUNT(DISTINCT sa.simulation_id) FILTER (WHERE sa.passed = true)::int AS sims_passed
    FROM epa_exam_domains d
    LEFT JOIN training_simulations ts
      ON  ts.exam_domain   = d.domain_key
      AND ts.credential_id = p_credential_id
      AND ts.is_active     = true
    LEFT JOIN sim_attempts sa
      ON  sa.simulation_id = ts.id
      AND sa.learner_id    = p_learner_id
      AND sa.passed        = true
      AND sa.completed_at IS NOT NULL
    WHERE d.is_active = true
    GROUP BY d.domain_key, d.required_sim_pass_count
  )
  INSERT INTO learner_exam_eligibility
    (learner_id, credential_id, domain_key, sims_passed, sims_required,
     is_eligible, eligible_at, last_evaluated_at)
  SELECT
    p_learner_id,
    p_credential_id,
    dp.domain_key,
    dp.sims_passed,
    dp.sims_required,
    (dp.sims_passed >= dp.sims_required),
    CASE WHEN dp.sims_passed >= dp.sims_required THEN now() ELSE NULL END,
    now()
  FROM domain_progress dp
  ON CONFLICT (learner_id, credential_id, domain_key) DO UPDATE SET
    sims_passed       = EXCLUDED.sims_passed,
    sims_required     = EXCLUDED.sims_required,
    is_eligible       = EXCLUDED.is_eligible,
    eligible_at       = CASE
                          WHEN EXCLUDED.is_eligible AND learner_exam_eligibility.eligible_at IS NULL
                          THEN now()
                          ELSE learner_exam_eligibility.eligible_at
                        END,
    last_evaluated_at = now()
  RETURNING domain_key, is_eligible, sims_passed, sims_required;
END;
$$;

-- ── 5. Employer cohort enrollments ────────────────────────────────────────
-- Tracks HVAC companies sending groups of technicians through the program.

CREATE TABLE IF NOT EXISTS employer_cohort_enrollments (
  id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id                    UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  employer_name                TEXT NOT NULL,
  employer_contact_name        TEXT,
  employer_contact_email       TEXT,
  employer_contact_phone       TEXT,
  technician_count             INTEGER NOT NULL DEFAULT 1,
  exam_type                    TEXT NOT NULL DEFAULT 'universal'
                                 CHECK (exam_type IN ('core','type_i','type_ii','type_iii','universal')),
  preferred_certifying_body    TEXT DEFAULT 'no_preference'
                                 CHECK (preferred_certifying_body IN ('esco','mainstream','no_preference')),
  preferred_exam_format        TEXT DEFAULT 'in_person'
                                 CHECK (preferred_exam_format IN ('in_person','remote','no_preference')),
  requested_exam_window_start  DATE,
  requested_exam_window_end    DATE,
  funding_source               TEXT,
  po_number                    TEXT,
  status                       TEXT NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending','confirmed','in_training','exam_scheduled','completed','cancelled')),
  notes                        TEXT,
  created_by                   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at                   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employer_enrollments_cohort
  ON employer_cohort_enrollments(cohort_id);

CREATE INDEX IF NOT EXISTS idx_employer_enrollments_status
  ON employer_cohort_enrollments(status);

ALTER TABLE employer_cohort_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage employer enrollments"
  ON employer_cohort_enrollments FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin','super_admin','org_admin','staff')
  ));

-- ── 6. Exam schedule requests ─────────────────────────────────────────────
-- Learner-initiated exam scheduling. Admin confirms and links to exam_sessions.

CREATE TABLE IF NOT EXISTS exam_schedule_requests (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learner_id               UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  credential_id            UUID NOT NULL REFERENCES credential_registry(id) ON DELETE CASCADE,
  cohort_id                UUID REFERENCES cohorts(id) ON DELETE SET NULL,
  employer_enrollment_id   UUID REFERENCES employer_cohort_enrollments(id) ON DELETE SET NULL,
  exam_type                TEXT NOT NULL
                             CHECK (exam_type IN ('core','type_i','type_ii','type_iii','universal')),
  certifying_body          TEXT NOT NULL CHECK (certifying_body IN ('esco','mainstream')),
  exam_format              TEXT NOT NULL DEFAULT 'in_person'
                             CHECK (exam_format IN ('in_person','remote')),
  requested_date           DATE,
  requested_time_slot      TEXT,
  status                   TEXT NOT NULL DEFAULT 'pending'
                             CHECK (status IN ('pending','scheduled','confirmed','completed','cancelled','no_show')),
  scheduled_exam_session_id UUID REFERENCES exam_sessions(id) ON DELETE SET NULL,
  eligibility_verified_at  TIMESTAMPTZ,
  -- Snapshot of eligibility at time of request for audit trail
  eligibility_snapshot     JSONB,
  admin_notes              TEXT,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exam_requests_learner
  ON exam_schedule_requests(learner_id);

CREATE INDEX IF NOT EXISTS idx_exam_requests_status
  ON exam_schedule_requests(status);

CREATE INDEX IF NOT EXISTS idx_exam_requests_cohort
  ON exam_schedule_requests(cohort_id)
  WHERE cohort_id IS NOT NULL;

ALTER TABLE exam_schedule_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Learners read own requests"
  ON exam_schedule_requests FOR SELECT USING (learner_id = auth.uid());

CREATE POLICY "Learners insert own requests"
  ON exam_schedule_requests FOR INSERT WITH CHECK (learner_id = auth.uid());

CREATE POLICY "Admins manage requests"
  ON exam_schedule_requests FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin','super_admin','org_admin','staff')
  ));

-- ── 7. Certifying body routing rules ──────────────────────────────────────
-- Drives ESCO vs Mainstream recommendation based on enrollment context.
-- ESCO: workforce programs, school partnerships, employer cohorts.
-- Mainstream: quick turnaround, individual technicians.

CREATE TABLE IF NOT EXISTS certifying_body_routing (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name        TEXT NOT NULL,
  certifying_body  TEXT NOT NULL CHECK (certifying_body IN ('esco','mainstream')),
  context          TEXT NOT NULL
                     CHECK (context IN ('workforce_program','employer_cohort','individual','school_partnership','quick_turnaround')),
  exam_type        TEXT CHECK (exam_type IN ('core','type_i','type_ii','type_iii','universal')),
  priority         INTEGER NOT NULL DEFAULT 50,
  notes            TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE certifying_body_routing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage routing"
  ON certifying_body_routing FOR ALL
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin','super_admin','org_admin','staff')
  ));

CREATE POLICY "Staff read routing"
  ON certifying_body_routing FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin','super_admin','org_admin','staff','instructor')
  ));

INSERT INTO certifying_body_routing (rule_name, certifying_body, context, priority, notes)
VALUES
  ('Workforce programs default to ESCO',  'esco',       'workforce_program',  90, 'ESCO recognized by workforce boards and DOL-funded programs'),
  ('School partnerships default to ESCO', 'esco',       'school_partnership', 90, 'ESCO standard for academic partnerships'),
  ('Employer cohorts default to ESCO',    'esco',       'employer_cohort',    70, 'ESCO preferred for group employer testing'),
  ('Quick turnaround use Mainstream',     'mainstream', 'quick_turnaround',   80, 'Mainstream faster exam processing for urgent needs'),
  ('Individual testing default Mainstream','mainstream','individual',          60, 'Mainstream efficient for walk-in individual technicians')
ON CONFLICT DO NOTHING;

-- ── 8. recommend_certifying_body() ────────────────────────────────────────
-- Returns the recommended certifying body for a given enrollment context.

CREATE OR REPLACE FUNCTION recommend_certifying_body(
  p_context   TEXT,
  p_exam_type TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT certifying_body
  FROM certifying_body_routing
  WHERE is_active  = true
    AND context    = p_context
    AND (exam_type IS NULL OR exam_type = p_exam_type)
  ORDER BY priority DESC
  LIMIT 1;
$$;
