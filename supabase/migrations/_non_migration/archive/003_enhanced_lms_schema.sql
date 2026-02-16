-- ============================================================================
-- ENHANCED LMS SCHEMA - Hybrid Approach
-- Combines current LMS with Milady-style rich metadata
-- ============================================================================

-- ============================================================================
-- ENHANCE EXISTING COURSES TABLE
-- ============================================================================

-- Add rich metadata columns
ALTER TABLE courses ADD COLUMN IF NOT EXISTS provider text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS duration_hours int;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS format text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS difficulty text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS prerequisites text[];
ALTER TABLE courses ADD COLUMN IF NOT EXISTS learning_outcomes text[];
ALTER TABLE courses ADD COLUMN IF NOT EXISTS target_audience text[];

-- Add external integration columns
ALTER TABLE courses ADD COLUMN IF NOT EXISTS external_url text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS promo_code text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS partner_code text;

-- Add certification columns
ALTER TABLE courses ADD COLUMN IF NOT EXISTS certification_name text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS certification_issuer text;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS certification_valid_period text;

-- Add compliance columns
ALTER TABLE courses ADD COLUMN IF NOT EXISTS dol_registered boolean DEFAULT false;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS etpl_approved boolean DEFAULT false;

-- Add updated_at column
ALTER TABLE courses ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ============================================================================
-- CREATE MODULES TABLE (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  "order" int NOT NULL,
  duration_hours int,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);
CREATE INDEX IF NOT EXISTS idx_modules_order ON modules(course_id, "order");

-- Enable RLS
ALTER TABLE modules ENABLE ROW LEVEL SECURITY;

-- Public read policy
CREATE POLICY "modules are readable" ON modules FOR SELECT USING (true);

-- ============================================================================
-- ENHANCE LESSONS TABLE
-- ============================================================================

-- Add module_id column (nullable for backward compatibility)
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES modules(id) ON DELETE CASCADE;

-- Add rich metadata columns
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS duration_minutes int;
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS topics text[];
ALTER TABLE lessons ADD COLUMN IF NOT EXISTS resources jsonb;

-- Create index for module_id
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON lessons(module_id, idx);

-- ============================================================================
-- ENHANCE ENROLLMENTS TABLE
-- ============================================================================

-- Add status column
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- Add external integration columns
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS external_enrollment_id text;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS external_status text;

-- Add timestamps
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS enrolled_at timestamptz DEFAULT now();
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- ============================================================================
-- CREATE MODULE_PROGRESS TABLE (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS module_progress (
  user_id uuid NOT NULL,
  module_id uuid NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  status text DEFAULT 'not_started',
  completion_percent int DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  PRIMARY KEY (user_id, module_id)
);

-- Enable RLS
ALTER TABLE module_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Users can manage their own progress
CREATE POLICY "module progress by owner" ON module_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- ENHANCE LESSON_PROGRESS TABLE
-- ============================================================================

-- Add completion flag
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS completed boolean DEFAULT false;

-- Add time tracking
ALTER TABLE lesson_progress ADD COLUMN IF NOT EXISTS time_spent_minutes int DEFAULT 0;

-- ============================================================================
-- CREATE CERTIFICATIONS TABLE (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid REFERENCES courses(id),
  certification_name text NOT NULL,
  certification_issuer text NOT NULL,
  issued_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  certificate_url text,
  verify_code text UNIQUE,
  external_certificate_url text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_certifications_user_id ON certifications(user_id);
CREATE INDEX IF NOT EXISTS idx_certifications_verify_code ON certifications(verify_code);
CREATE INDEX IF NOT EXISTS idx_certifications_course_id ON certifications(course_id);

-- Enable RLS
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own certifications
CREATE POLICY "certifications by owner" ON certifications
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Public can verify certifications
CREATE POLICY "public verify certifications" ON certifications
  FOR SELECT TO anon USING (true);

-- Policy: Staff can issue certifications
CREATE POLICY "staff issue certifications" ON certifications
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role IN ('staff', 'admin')
    )
  );

-- ============================================================================
-- CREATE SCHOLARSHIPS TABLE (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES courses(id),
  name text NOT NULL,
  amount_cents int NOT NULL,
  currency text DEFAULT 'USD',
  frequency text,
  recipients_per_period int,
  eligibility_requirements text[],
  application_url text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scholarships_course_id ON scholarships(course_id);
CREATE INDEX IF NOT EXISTS idx_scholarships_active ON scholarships(active);

-- Enable RLS
ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;

-- Policy: Public can read active scholarships
CREATE POLICY "scholarships readable" ON scholarships
  FOR SELECT USING (active = true);

-- ============================================================================
-- CREATE SCHOLARSHIP_APPLICATIONS TABLE (NEW)
-- ============================================================================

CREATE TABLE IF NOT EXISTS scholarship_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scholarship_id uuid REFERENCES scholarships(id),
  status text DEFAULT 'pending',
  applied_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid,
  notes text
);

CREATE INDEX IF NOT EXISTS idx_scholarship_applications_user_id ON scholarship_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_scholarship_applications_scholarship_id ON scholarship_applications(scholarship_id);
CREATE INDEX IF NOT EXISTS idx_scholarship_applications_status ON scholarship_applications(status);

-- Enable RLS
ALTER TABLE scholarship_applications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own applications
CREATE POLICY "scholarship applications by owner" ON scholarship_applications
  FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can create their own applications
CREATE POLICY "users can apply" ON scholarship_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Staff can review applications
CREATE POLICY "staff review applications" ON scholarship_applications
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role IN ('staff', 'admin')
    )
  );

-- ============================================================================
-- CREATE HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate course completion percentage
CREATE OR REPLACE FUNCTION calculate_course_completion(
  p_user_id uuid,
  p_course_id uuid
)
RETURNS int
LANGUAGE plpgsql
AS $$
DECLARE
  total_lessons int;
  completed_lessons int;
BEGIN
  -- Count total lessons
  SELECT COUNT(*) INTO total_lessons
  FROM lessons
  WHERE course_id = p_course_id;
  
  -- Count completed lessons
  SELECT COUNT(*) INTO completed_lessons
  FROM lesson_progress
  WHERE user_id = p_user_id
    AND lesson_id IN (SELECT id FROM lessons WHERE course_id = p_course_id)
    AND completed = true;
  
  -- Return percentage
  IF total_lessons = 0 THEN
    RETURN 0;
  ELSE
    RETURN (completed_lessons * 100 / total_lessons);
  END IF;
END;
$$;

-- Function to check if user completed course
CREATE OR REPLACE FUNCTION is_course_completed(
  p_user_id uuid,
  p_course_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  completion_percent int;
BEGIN
  completion_percent := calculate_course_completion(p_user_id, p_course_id);
  RETURN completion_percent = 100;
END;
$$;

-- ============================================================================
-- CREATE TRIGGERS
-- ============================================================================

-- Trigger to update updated_at on courses
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON modules TO authenticated, anon;
GRANT SELECT ON certifications TO authenticated, anon;
GRANT SELECT ON scholarships TO authenticated, anon;
GRANT SELECT, INSERT ON scholarship_applications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON module_progress TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify new tables exist
SELECT 'modules table exists' AS status, COUNT(*) AS row_count FROM modules;
SELECT 'certifications table exists' AS status, COUNT(*) AS row_count FROM certifications;
SELECT 'scholarships table exists' AS status, COUNT(*) AS row_count FROM scholarships;
SELECT 'scholarship_applications table exists' AS status, COUNT(*) AS row_count FROM scholarship_applications;
SELECT 'module_progress table exists' AS status, COUNT(*) AS row_count FROM module_progress;

-- Verify new columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'courses' 
  AND column_name IN ('provider', 'duration_hours', 'external_url', 'certification_name')
ORDER BY column_name;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Enhanced LMS schema applied successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'New features:';
  RAISE NOTICE '- Modules table for hierarchical course structure';
  RAISE NOTICE '- Rich metadata columns on courses';
  RAISE NOTICE '- External integration support (Milady, etc.)';
  RAISE NOTICE '- Certifications tracking';
  RAISE NOTICE '- Scholarships management';
  RAISE NOTICE '- Module progress tracking';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Migrate Milady data to database';
  RAISE NOTICE '2. Update course service';
  RAISE NOTICE '3. Enhance UI components';
END $$;
