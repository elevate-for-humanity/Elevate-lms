-- WIOA PIRL Reporting Infrastructure
-- Provides: mappings table, export jobs table, and RPC for participant data extraction

-- ============================================================
-- 1. PIRL Element Mappings
-- Maps PIRL element numbers to source table/column in our schema.
-- Used by the export adapter to know where each data point lives.
-- ============================================================

CREATE TABLE IF NOT EXISTS wioa_pirl_mappings (
  id SERIAL PRIMARY KEY,
  schema_id TEXT NOT NULL DEFAULT 'ETA-9170-PY25',
  element TEXT NOT NULL,
  element_name TEXT NOT NULL,
  source_table TEXT NOT NULL,
  source_column TEXT NOT NULL,
  transform TEXT,  -- optional: 'boolean_to_01', 'gender_code', 'race_hispanic', etc.
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
  UNIQUE(schema_id, element)
);

ALTER TABLE wioa_pirl_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manage_pirl_mappings" ON wioa_pirl_mappings FOR ALL
  TO authenticated USING ((auth.jwt() ->> 'role') = 'admin' OR (auth.jwt() ->> 'role') = 'service_role');
GRANT ALL ON wioa_pirl_mappings TO service_role;
GRANT SELECT ON wioa_pirl_mappings TO authenticated;

-- Seed initial mappings for the starter schema elements
INSERT INTO wioa_pirl_mappings (schema_id, element, element_name, source_table, source_column, transform) VALUES
  ('ETA-9170-PY25', '100', 'Unique Individual Identifier', 'wioa_participants', 'id', 'uuid_to_12char'),
  ('ETA-9170-PY25', '101', 'Social Security Number', 'wioa_participant_records', 'ssn_last4', 'pad_ssn'),
  ('ETA-9170-PY25', '102', 'Date of Birth', 'wioa_participants', 'date_of_birth', NULL),
  ('ETA-9170-PY25', '103', 'Zip Code of Residence', 'profiles', 'zip_code', NULL),
  ('ETA-9170-PY25', '200', 'Individual with a Disability', 'wioa_participant_records', 'disability_status', 'boolean_to_01'),
  ('ETA-9170-PY25', '201', 'Ethnicity Hispanic/Latino', 'wioa_participant_records', 'race_ethnicity', 'race_hispanic'),
  ('ETA-9170-PY25', '204', 'Black or African American', 'wioa_participant_records', 'race_ethnicity', 'race_black'),
  ('ETA-9170-PY25', '206', 'White', 'wioa_participant_records', 'race_ethnicity', 'race_white'),
  ('ETA-9170-PY25', '300', 'Gender', 'wioa_participant_records', 'gender', 'gender_code'),
  ('ETA-9170-PY25', '301', 'Veteran Status', 'wioa_participant_records', 'veteran_status', 'boolean_to_01'),
  ('ETA-9170-PY25', '400', 'Employment Status at Participation', 'wioa_participant_records', 'employment_status_at_entry', 'employment_code'),
  ('ETA-9170-PY25', '401', 'Highest School Grade Completed', 'wioa_participant_records', 'education_level_at_entry', NULL),
  ('ETA-9170-PY25', '900', 'Date of Program Participation', 'wioa_participants', 'enrollment_date', NULL),
  ('ETA-9170-PY25', '901', 'Date of Program Exit', 'wioa_participants', 'exit_date', NULL),
  ('ETA-9170-PY25', '923', 'WIOA Title I Adult', 'wioa_participants', 'funding_source', 'funding_wioa'),
  ('ETA-9170-PY25', '1000', 'Received Training', '_constant', '1', NULL),
  ('ETA-9170-PY25', '1600', 'Employed 1st Quarter After Exit', 'wioa_participant_records', 'employed_q2_after_exit', 'boolean_to_019'),
  ('ETA-9170-PY25', '1602', 'Employed 2nd Quarter After Exit', 'wioa_participant_records', 'employed_q2_after_exit', 'boolean_to_019'),
  ('ETA-9170-PY25', '1604', 'Employed 4th Quarter After Exit', 'wioa_participant_records', 'employed_q4_after_exit', 'boolean_to_019'),
  ('ETA-9170-PY25', '1700', 'Median Earnings 2nd Quarter', 'wioa_participant_records', 'median_earnings_q2', NULL),
  ('ETA-9170-PY25', '1800', 'Type of Recognized Credential', 'wioa_participant_records', 'credential_attained', 'boolean_to_01'),
  ('ETA-9170-PY25', '1811', 'Measurable Skill Gains - EFL', 'wioa_participant_records', 'measurable_skill_gain', 'boolean_to_01'),
  ('ETA-9170-PY25', '1813', 'Measurable Skill Gains - Transcript', 'wioa_participant_records', 'measurable_skill_gain', 'boolean_to_01')
ON CONFLICT (schema_id, element) DO NOTHING;

-- ============================================================
-- 2. Export Jobs Table
-- Tracks each export run for audit trail.
-- ============================================================

CREATE TABLE IF NOT EXISTS wioa_pirl_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_id TEXT NOT NULL,
  quarter TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  record_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  warning_count INTEGER DEFAULT 0,
  checksum_sha256 TEXT,
  file_path TEXT,
  report_json JSONB,
  created_by UUID,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE wioa_pirl_exports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_manage_pirl_exports" ON wioa_pirl_exports FOR ALL
  TO authenticated USING ((auth.jwt() ->> 'role') = 'admin' OR (auth.jwt() ->> 'role') = 'service_role');
GRANT ALL ON wioa_pirl_exports TO service_role;
GRANT SELECT ON wioa_pirl_exports TO authenticated;

-- ============================================================
-- 3. Export Issues Table
-- Stores validation issues from each export run.
-- ============================================================

CREATE TABLE IF NOT EXISTS wioa_pirl_export_issues (
  id BIGSERIAL PRIMARY KEY,
  export_id UUID NOT NULL REFERENCES wioa_pirl_exports(id) ON DELETE CASCADE,
  participant_id TEXT NOT NULL,
  element TEXT NOT NULL,
  field_name TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('error', 'warning')),
  message TEXT NOT NULL,
  value TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pirl_issues_export ON wioa_pirl_export_issues(export_id);
CREATE INDEX IF NOT EXISTS idx_pirl_issues_severity ON wioa_pirl_export_issues(severity);

ALTER TABLE wioa_pirl_export_issues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_read_pirl_issues" ON wioa_pirl_export_issues FOR SELECT
  TO authenticated USING ((auth.jwt() ->> 'role') = 'admin');
GRANT ALL ON wioa_pirl_export_issues TO service_role;
GRANT SELECT ON wioa_pirl_export_issues TO authenticated;

-- ============================================================
-- 4. RPC: wioa_participants_for_quarter
-- Returns participant data joined across all relevant tables
-- for a given quarter date range. This is the real data source.
-- ============================================================

CREATE OR REPLACE FUNCTION wioa_participants_for_quarter(
  quarter_start DATE,
  quarter_end DATE
)
RETURNS TABLE (
  participant_id UUID,
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  date_of_birth DATE,
  ssn_last4 TEXT,
  zip_code TEXT,
  gender TEXT,
  race_ethnicity TEXT,
  veteran_status BOOLEAN,
  disability_status BOOLEAN,
  employment_status_at_entry TEXT,
  education_level_at_entry TEXT,
  enrollment_date DATE,
  exit_date DATE,
  funding_source TEXT,
  employed_q2_after_exit BOOLEAN,
  employed_q4_after_exit BOOLEAN,
  median_earnings_q2 NUMERIC,
  credential_attained BOOLEAN,
  measurable_skill_gain BOOLEAN,
  employer_name TEXT,
  job_title TEXT,
  employment_date DATE,
  hourly_wage NUMERIC,
  annual_salary NUMERIC,
  credential_name TEXT,
  credential_issued_at TIMESTAMPTZ
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    wp.id AS participant_id,
    wp.user_id,
    wp.first_name,
    wp.last_name,
    wp.date_of_birth,
    wpr.ssn_last4,
    COALESCE(p.zip_code, (wp.address->>'zip')::TEXT) AS zip_code,
    wpr.gender,
    wpr.race_ethnicity,
    COALESCE(wpr.veteran_status, false) AS veteran_status,
    COALESCE(wpr.disability_status, false) AS disability_status,
    wpr.employment_status_at_entry,
    wpr.education_level_at_entry,
    wp.enrollment_date,
    wp.exit_date,
    wp.funding_source,
    wpr.employed_q2_after_exit,
    wpr.employed_q4_after_exit,
    wpr.median_earnings_q2,
    COALESCE(wpr.credential_attained, false) AS credential_attained,
    COALESCE(wpr.measurable_skill_gain, false) AS measurable_skill_gain,
    eo.employer_name,
    eo.job_title,
    eo.employment_date,
    eo.hourly_wage,
    eo.annual_salary,
    cert.credential_name,
    cert.issued_at AS credential_issued_at
  FROM wioa_participants wp
  LEFT JOIN wioa_participant_records wpr
    ON wpr.participant_id = wp.id
  LEFT JOIN profiles p
    ON p.id = wp.user_id
  LEFT JOIN LATERAL (
    SELECT eo2.employer_name, eo2.job_title, eo2.employment_date,
           eo2.hourly_wage, eo2.annual_salary
    FROM employment_outcomes eo2
    WHERE eo2.user_id = wp.user_id
    ORDER BY eo2.employment_date DESC NULLS LAST
    LIMIT 1
  ) eo ON true
  LEFT JOIN LATERAL (
    SELECT c.credential_name, c.issued_at
    FROM certificates c
    WHERE c.user_id = wp.user_id AND c.status = 'active'
    ORDER BY c.issued_at DESC NULLS LAST
    LIMIT 1
  ) cert ON true
  WHERE wp.eligibility_status = 'verified'
    AND wp.enrollment_date <= quarter_end
    AND (wp.exit_date IS NULL OR wp.exit_date >= quarter_start);
$$;

COMMENT ON FUNCTION wioa_participants_for_quarter IS 'Returns all verified WIOA participants active during the given quarter, joined with outcome and credential data for PIRL export.';
