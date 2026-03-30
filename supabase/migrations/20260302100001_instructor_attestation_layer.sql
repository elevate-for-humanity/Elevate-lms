-- Instructor Attestation Layer for Distance RTI + Work-Based Learning
--
-- DOL and ETPL reviewers require documented instructional oversight for
-- distance RTI programs. This layer proves:
--   1. An instructor reviewed student progress at defined checkpoints
--   2. The instructor attests competencies were covered
--   3. RTI hours are only countable after instructor sign-off
--
-- Attestation types:
--   module_completion  — instructor signs off on LMS module completion
--   session_delivery   — instructor attests cohort session was delivered
--   weekly_review      — periodic progress review (distance RTI requirement)
--   competency_checkpoint — skills assessment sign-off (practical eval)

-- 1. Instructor attestations table
CREATE TABLE IF NOT EXISTS instructor_attestations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who is attesting
  instructor_id uuid NOT NULL,
  instructor_name text NOT NULL,
  instructor_role text NOT NULL CHECK (instructor_role IN (
    'instructor', 'lead_instructor', 'program_director', 'sponsor_admin'
  )),
  
  -- What is being attested
  attestation_type text NOT NULL CHECK (attestation_type IN (
    'module_completion', 'session_delivery', 'weekly_review', 'competency_checkpoint'
  )),
  
  -- Who it's about
  student_id uuid NOT NULL,
  
  -- Context references (at least one must be set)
  program_id uuid,
  course_id uuid,
  cohort_session_id uuid,
  lesson_id uuid,
  hour_entry_id uuid,
  
  -- Attestation content
  competencies_covered text[],
  engagement_verified boolean NOT NULL DEFAULT true,
  engagement_notes text,
  hours_attested numeric,
  
  -- Attestation metadata
  attested_at timestamptz NOT NULL DEFAULT now(),
  attestation_method text NOT NULL DEFAULT 'digital_signature' CHECK (attestation_method IN (
    'digital_signature', 'in_person', 'video_review', 'lms_system'
  )),
  
  -- Immutable after creation
  created_at timestamptz NOT NULL DEFAULT now()
  
  CONSTRAINT attestation_has_context CHECK (
    program_id IS NOT NULL OR course_id IS NOT NULL OR 
    cohort_session_id IS NOT NULL OR lesson_id IS NOT NULL OR
    hour_entry_id IS NOT NULL
  )
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_attestation_student ON instructor_attestations(student_id);
CREATE INDEX IF NOT EXISTS idx_attestation_instructor ON instructor_attestations(instructor_id);
CREATE INDEX IF NOT EXISTS idx_attestation_program ON instructor_attestations(program_id);
CREATE INDEX IF NOT EXISTS idx_attestation_course ON instructor_attestations(course_id);
CREATE INDEX IF NOT EXISTS idx_attestation_session ON instructor_attestations(cohort_session_id);
CREATE INDEX IF NOT EXISTS idx_attestation_type ON instructor_attestations(attestation_type);
CREATE INDEX IF NOT EXISTS idx_attestation_date ON instructor_attestations(attested_at);

-- Composite index for the certificate issuance gate query
CREATE INDEX IF NOT EXISTS idx_attestation_student_program_type 
  ON instructor_attestations(student_id, program_id, attestation_type);

-- 2. Make attestations append-only (immutable after insert)
CREATE OR REPLACE FUNCTION prevent_attestation_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'instructor_attestations is append-only: % not allowed', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_attestation_update ON instructor_attestations;
CREATE TRIGGER trg_prevent_attestation_update
  BEFORE UPDATE ON instructor_attestations
  FOR EACH ROW EXECUTE FUNCTION prevent_attestation_mutation();

DROP TRIGGER IF EXISTS trg_prevent_attestation_delete ON instructor_attestations;
CREATE TRIGGER trg_prevent_attestation_delete
  BEFORE DELETE ON instructor_attestations
  FOR EACH ROW EXECUTE FUNCTION prevent_attestation_mutation();

-- 3. Add instructor_id to cohort_sessions (currently only has instructor_name text)
ALTER TABLE cohort_sessions ADD COLUMN IF NOT EXISTS instructor_id uuid;

-- 4. Add engagement tracking columns to lesson_progress
-- These support the "instructional engagement hours" requirement
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS engagement_verified boolean DEFAULT false;
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS engagement_verified_by uuid;
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS engagement_verified_at timestamptz;

-- 5. Add attestation requirement flag to programs
-- Programs can require instructor attestation for RTI completion
ALTER TABLE programs ADD COLUMN IF NOT EXISTS requires_instructor_attestation boolean DEFAULT false;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS min_engagement_hours numeric;

-- 6. RLS
ALTER TABLE instructor_attestations ENABLE ROW LEVEL SECURITY;

-- Service role can insert (API routes run as service role)
-- Authenticated users can read their own attestations
DROP POLICY IF EXISTS "Service role full access on attestations" ON instructor_attestations;
DROP POLICY IF EXISTS "Students can view own attestations" ON instructor_attestations;
DROP POLICY IF EXISTS "Instructors can view attestations they created" ON instructor_attestations;

CREATE POLICY "Service role full access on attestations"
  ON instructor_attestations FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Students can view own attestations"
  ON instructor_attestations FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Instructors can view attestations they created"
  ON instructor_attestations FOR SELECT
  TO authenticated
  USING (instructor_id = auth.uid());
