-- Proctor portal: exam session tracking for Certiport, EPA 608 (ESCO), and other proctored exams.
-- Provides audit trail for WIOA/DOL workforce board compliance.

CREATE TYPE exam_provider AS ENUM ('certiport', 'esco_epa608', 'careersafe_osha', 'other');
CREATE TYPE exam_session_status AS ENUM ('checked_in', 'in_progress', 'completed', 'voided', 'no_show');
CREATE TYPE exam_result AS ENUM ('pass', 'fail', 'incomplete', 'pending');
CREATE TYPE id_type AS ENUM ('drivers_license', 'state_id', 'passport', 'military_id', 'other');

CREATE TABLE exam_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     UUID REFERENCES tenants(id) ON DELETE CASCADE,

  -- Test taker
  student_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  student_name  TEXT NOT NULL,
  student_email TEXT,

  -- Exam info
  provider      exam_provider NOT NULL,
  exam_name     TEXT NOT NULL,                          -- e.g. "EPA 608 Universal", "OSHA 30", "IC3 Digital Literacy"
  exam_code     TEXT,                                   -- Certiport exam code or ESCO exam ID
  start_code    TEXT,                                   -- One-time start code from provider
  start_key     TEXT,                                   -- Start key (Certiport/ESCO)

  -- ID verification
  id_verified   BOOLEAN NOT NULL DEFAULT FALSE,
  id_type       id_type,
  id_notes      TEXT,                                   -- e.g. "Name mismatch — used maiden name"

  -- Session tracking
  status        exam_session_status NOT NULL DEFAULT 'checked_in',
  result        exam_result DEFAULT 'pending',
  score         NUMERIC(5,2),                           -- Percentage or raw score if available
  duration_min  INTEGER DEFAULT 180,                    -- Allowed duration in minutes
  started_at    TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,

  -- Proctor
  proctor_id    UUID REFERENCES profiles(id) ON DELETE SET NULL,
  proctor_name  TEXT NOT NULL,
  proctor_notes TEXT,

  -- Program linkage (optional)
  program_slug  TEXT,                                   -- e.g. "hvac-technician"
  cohort_id     UUID,

  -- Audit
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX idx_exam_sessions_tenant    ON exam_sessions(tenant_id);
CREATE INDEX idx_exam_sessions_student   ON exam_sessions(student_id);
CREATE INDEX idx_exam_sessions_proctor   ON exam_sessions(proctor_id);
CREATE INDEX idx_exam_sessions_provider  ON exam_sessions(provider);
CREATE INDEX idx_exam_sessions_status    ON exam_sessions(status);
CREATE INDEX idx_exam_sessions_created   ON exam_sessions(created_at DESC);

-- RLS
ALTER TABLE exam_sessions ENABLE ROW LEVEL SECURITY;

-- Admins, staff, and instructors can read all sessions for their tenant
CREATE POLICY exam_sessions_read ON exam_sessions
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff', 'instructor')
    )
  );

-- Admins, staff, and instructors can insert sessions
CREATE POLICY exam_sessions_insert ON exam_sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff', 'instructor')
    )
  );

-- Admins, staff, and instructors can update sessions
CREATE POLICY exam_sessions_update ON exam_sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff', 'instructor')
    )
  );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_exam_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_exam_sessions_updated_at
  BEFORE UPDATE ON exam_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_exam_sessions_updated_at();

