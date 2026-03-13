-- OJT Competency Tracker
-- Tracks employer-supervised field training sign-offs for workforce programs.
-- Each row = one competency verified by a supervisor for a student.

CREATE TABLE IF NOT EXISTS ojt_competency_signoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID NOT NULL, -- e.g. HVAC program ID
  competency_id TEXT NOT NULL, -- matches OjtCompetency.id (e.g. 'ojt-01')
  employer_name TEXT NOT NULL,
  supervisor_name TEXT NOT NULL,
  supervisor_title TEXT,
  date_observed DATE NOT NULL,
  date_verified DATE, -- when supervisor signed off
  hours_logged NUMERIC(5,1) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'needs_review')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One sign-off per competency per student
  UNIQUE (student_id, program_id, competency_id)
);

-- Index for student progress queries
CREATE INDEX IF NOT EXISTS idx_ojt_signoffs_student ON ojt_competency_signoffs(student_id, program_id);
CREATE INDEX IF NOT EXISTS idx_ojt_signoffs_status ON ojt_competency_signoffs(status);

-- OJT hours summary view
CREATE OR REPLACE VIEW ojt_student_summary AS
SELECT
  student_id,
  program_id,
  COUNT(*) FILTER (WHERE status = 'verified') AS competencies_verified,
  COUNT(*) AS competencies_total,
  SUM(hours_logged) AS total_hours,
  MIN(date_observed) AS first_observation,
  MAX(date_verified) AS last_verification
FROM ojt_competency_signoffs
GROUP BY student_id, program_id;

-- RLS
ALTER TABLE ojt_competency_signoffs ENABLE ROW LEVEL SECURITY;

-- Students can view their own sign-offs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ojt_competency_signoffs' AND policyname = 'Students view own OJT signoffs') THEN
    CREATE POLICY "Students view own OJT signoffs"
      ON ojt_competency_signoffs FOR SELECT
      USING (auth.uid() = student_id);
  END IF;
END $$;

-- Admins can manage all sign-offs
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ojt_competency_signoffs' AND policyname = 'Admins manage OJT signoffs') THEN
    CREATE POLICY "Admins manage OJT signoffs"
      ON ojt_competency_signoffs FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'super_admin')
        )
      );
  END IF;
END $$;
