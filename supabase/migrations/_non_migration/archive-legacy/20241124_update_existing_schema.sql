-- ============================================================================
-- UPDATE EXISTING SCHEMA - Add missing columns to existing courses table
-- ============================================================================

-- Add missing columns to courses table
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS etpl_program_id TEXT,
  ADD COLUMN IF NOT EXISTS provider TEXT,
  ADD COLUMN IF NOT EXISTS format TEXT,
  ADD COLUMN IF NOT EXISTS difficulty TEXT,
  ADD COLUMN IF NOT EXISTS prerequisites TEXT[],
  ADD COLUMN IF NOT EXISTS learning_outcomes TEXT[],
  ADD COLUMN IF NOT EXISTS target_audience TEXT[],
  ADD COLUMN IF NOT EXISTS certification_name TEXT,
  ADD COLUMN IF NOT EXISTS certification_issuer TEXT,
  ADD COLUMN IF NOT EXISTS certification_valid_period TEXT,
  ADD COLUMN IF NOT EXISTS etpl_approved BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS external_provider TEXT,
  ADD COLUMN IF NOT EXISTS external_program_id TEXT,
  ADD COLUMN IF NOT EXISTS external_url TEXT,
  ADD COLUMN IF NOT EXISTS external_license_required BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS external_lms_config JSONB;

-- Create modules table if it doesn't exist
CREATE TABLE IF NOT EXISTS modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  "order" INTEGER NOT NULL,
  duration_hours INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on course_id
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);

-- Create programs table if it doesn't exist
CREATE TABLE IF NOT EXISTS programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  track TEXT,
  blurb TEXT,
  hours TEXT,
  cover_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add program_id to courses if it doesn't exist
ALTER TABLE courses
  ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id);

-- Create external_lms_enrollments table
CREATE TABLE IF NOT EXISTS external_lms_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  course_code TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  access_url TEXT,
  credentials JSONB,
  last_accessed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create ojt_logs table
CREATE TABLE IF NOT EXISTS ojt_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  course_code TEXT NOT NULL,
  date DATE NOT NULL,
  hours NUMERIC(5,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  description TEXT,
  supervisor_name TEXT,
  supervisor_title TEXT,
  supervisor_signature TEXT,
  location TEXT,
  skills TEXT[],
  verified BOOLEAN DEFAULT false,
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  verification_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_external_lms_enrollments_student 
  ON external_lms_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_external_lms_enrollments_course 
  ON external_lms_enrollments(course_code);
CREATE INDEX IF NOT EXISTS idx_ojt_logs_student 
  ON ojt_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_ojt_logs_course 
  ON ojt_logs(course_code);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Schema updated successfully';
  RAISE NOTICE '   - Added missing columns to courses table';
  RAISE NOTICE '   - Created modules table';
  RAISE NOTICE '   - Created programs table';
  RAISE NOTICE '   - Created external_lms_enrollments table';
  RAISE NOTICE '   - Created ojt_logs table';
END $$;
