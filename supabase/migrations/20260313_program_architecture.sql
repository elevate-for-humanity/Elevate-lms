-- ============================================================
-- Multi-Program Architecture Migration
-- Converts LMS from HVAC-centered to program-first design
-- ============================================================

-- 1. Add course_id to modules (link modules to courses, not just programs)
ALTER TABLE modules ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES training_courses(id);

-- 2. Add module_id to training_lessons (link lessons to modules)
ALTER TABLE training_lessons ADD COLUMN IF NOT EXISTS module_id UUID REFERENCES modules(id);

-- 3. Add program_id to training_lessons (denormalized for fast queries)
ALTER TABLE training_lessons ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id);

-- 4. Ensure training_courses.program_id has FK constraint
-- (column exists but may lack constraint)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'training_courses_program_id_fkey'
    AND table_name = 'training_courses'
  ) THEN
    ALTER TABLE training_courses
      ADD CONSTRAINT training_courses_program_id_fkey
      FOREIGN KEY (program_id) REFERENCES programs(id);
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

-- 5. Create program_completion table
CREATE TABLE IF NOT EXISTS program_completion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  enrollment_id UUID REFERENCES program_enrollments(id),
  completed_at TIMESTAMPTZ DEFAULT now(),
  completion_criteria JSONB DEFAULT '{}',
  progress_percent INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_program_completion_user ON program_completion(user_id);
CREATE INDEX IF NOT EXISTS idx_program_completion_program ON program_completion(program_id);

-- 6. Add completion_criteria to programs (per-program completion rules)
ALTER TABLE programs ADD COLUMN IF NOT EXISTS completion_criteria JSONB DEFAULT '{}';

-- 7. Ensure certificates table has program linkage columns
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id);
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES training_courses(id);
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS issued_by UUID REFERENCES auth.users(id);
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS completion_criteria JSONB DEFAULT '{}';

-- 8. Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_modules_course ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module ON training_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lessons_program ON training_lessons(program_id);
CREATE INDEX IF NOT EXISTS idx_certificates_program ON certificates(program_id);
CREATE INDEX IF NOT EXISTS idx_certificates_verification ON certificates(verification_token);

-- 9. RLS policies for program_completion
ALTER TABLE program_completion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own completions"
  ON program_completion FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on program_completion"
  ON program_completion FOR ALL
  USING (auth.role() = 'service_role');

-- 10. Create exam_events table (from audit finding)
CREATE TABLE IF NOT EXISTS exam_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_session_id UUID NOT NULL REFERENCES exam_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exam_events_session ON exam_events(exam_session_id);
CREATE INDEX IF NOT EXISTS idx_exam_events_user ON exam_events(user_id);

ALTER TABLE exam_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own exam events"
  ON exam_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own exam events"
  ON exam_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on exam_events"
  ON exam_events FOR ALL
  USING (auth.role() = 'service_role');
