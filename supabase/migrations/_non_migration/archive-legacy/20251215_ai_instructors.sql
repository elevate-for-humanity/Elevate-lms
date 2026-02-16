-- AI Instructors System
-- Provides AI-powered instructional support for students

CREATE TABLE IF NOT EXISTS public.ai_instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  specialty text NOT NULL,
  system_prompt text NOT NULL,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.student_ai_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id),
  instructor_id uuid NOT NULL REFERENCES ai_instructors(id),
  program_slug text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, program_slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_instructors_specialty ON ai_instructors(specialty);
CREATE INDEX IF NOT EXISTS idx_ai_instructors_active ON ai_instructors(active);
CREATE INDEX IF NOT EXISTS idx_student_ai_assignments_student ON student_ai_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_ai_assignments_instructor ON student_ai_assignments(instructor_id);

-- RLS Policies
ALTER TABLE ai_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_ai_assignments ENABLE ROW LEVEL SECURITY;

-- Anyone can view active instructors
CREATE POLICY "Anyone can view active instructors"
  ON ai_instructors
  FOR SELECT
  USING (active = true);

-- Students can view their own assignments
CREATE POLICY "Students can view their assignments"
  ON student_ai_assignments
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Service role can manage everything
CREATE POLICY "Service role can manage instructors"
  ON ai_instructors
  FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role can manage assignments"
  ON student_ai_assignments
  FOR ALL
  TO service_role
  USING (true);

-- Seed default barber instructor
INSERT INTO ai_instructors (name, role, specialty, system_prompt)
VALUES (
  'Master Barber Coach – EFH',
  'AI Instructor',
  'Barber Apprenticeship',
  'You are a licensed master barber instructor. You guide students through theory, sanitation, haircutting techniques, state board readiness, professionalism, and apprenticeship success. You are supportive, clear, and compliant with state apprenticeship standards.'
)
ON CONFLICT DO NOTHING;

-- Comments
COMMENT ON TABLE ai_instructors IS 'AI instructors for different programs and specialties';
COMMENT ON TABLE student_ai_assignments IS 'Links students to their assigned AI instructors';
COMMENT ON COLUMN ai_instructors.system_prompt IS 'System prompt that defines the AI instructor behavior';
