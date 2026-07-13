-- Cohort scheduling + reporting layer
-- APPLIED TO PRODUCTION: 2026-03-01
--
-- Cohorts are scheduling/reporting containers, NOT completion gates.
-- Course certificates gate on lesson completion + quiz scores.
-- Apprenticeship certificates gate on OJL + RTI hour minimums.
-- Cohort metadata is admin-editable and partner-flexible.
-- Expected hours are DERIVED from cohort ranges, never hard-coded as gates.

-- 1. Add workforce scheduling columns to existing cohorts table
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS program_slug text;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS partner_name text;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS partner_id uuid;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS cohort_name text;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS cohort_start_date date;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS cohort_end_date date;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS planned_end_date date;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS duration_weeks_min int;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS duration_weeks_max int;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS delivery_window_text text DEFAULT 'Mon-Thu 5:30-8:30 PM';
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS session_length_minutes_default int DEFAULT 180;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS sessions_per_week_min int DEFAULT 2;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS sessions_per_week_max int DEFAULT 4;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS funding_streams jsonb DEFAULT '[]';
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS reporting_notes text;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS seat_time_minimum_hours numeric;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS seat_time_enforced boolean DEFAULT false;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS seat_time_enforced_reason text;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS max_enrollment int;

CREATE INDEX IF NOT EXISTS idx_cohorts_partner_name ON cohorts(partner_name);
CREATE INDEX IF NOT EXISTS idx_cohorts_start_date ON cohorts(cohort_start_date);

-- 2. Cohort sessions (actual delivered sessions)
CREATE TABLE IF NOT EXISTS cohort_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  start_time time,
  end_time time,
  duration_minutes int,
  delivered_minutes int,
  modality text DEFAULT 'hybrid' CHECK (modality IN ('in_person', 'hybrid', 'virtual')),
  location text,
  instructor_name text,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cohort_sessions_cohort_id ON cohort_sessions(cohort_id);
CREATE INDEX IF NOT EXISTS idx_cohort_sessions_date ON cohort_sessions(session_date);

-- 3. Cohort attendance
CREATE TABLE IF NOT EXISTS cohort_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_session_id uuid NOT NULL REFERENCES cohort_sessions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  status text DEFAULT 'present' CHECK (status IN ('present', 'late', 'absent', 'excused', 'makeup')),
  minutes_attended int,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cohort_attendance_session ON cohort_attendance(cohort_session_id);
CREATE INDEX IF NOT EXISTS idx_cohort_attendance_user ON cohort_attendance(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_cohort_attendance_unique ON cohort_attendance(cohort_session_id, user_id);

-- 4. Add cohort_id FK to enrollment tables
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS cohort_id uuid REFERENCES cohorts(id);
ALTER TABLE program_enrollments ADD COLUMN IF NOT EXISTS cohort_id uuid REFERENCES cohorts(id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_cohort ON student_enrollments(cohort_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_cohort ON program_enrollments(cohort_id);

-- 5. RLS
ALTER TABLE cohort_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_cohort_sessions" ON cohort_sessions FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "service_role_cohort_attendance" ON cohort_attendance FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "authenticated_read_own_attendance" ON cohort_attendance
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "authenticated_read_enrolled_sessions" ON cohort_sessions
  FOR SELECT TO authenticated
  USING (
    cohort_id IN (
      SELECT cohort_id FROM student_enrollments WHERE student_id = auth.uid() AND cohort_id IS NOT NULL
      UNION
      SELECT cohort_id FROM program_enrollments WHERE user_id = auth.uid() AND cohort_id IS NOT NULL
    )
  );
