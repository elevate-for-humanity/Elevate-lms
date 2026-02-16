-- Performance Optimization Indexes
-- Created: 2026-01-08
-- Purpose: Add missing indexes to improve query performance

-- Courses table indexes
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_slug ON public.courses(slug);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON public.courses(created_at DESC);

-- Enrollments table indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_created_at ON public.enrollments(enrolled_at DESC);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_course ON public.enrollments(student_id, course_id);

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

-- Applications table indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_program_id ON public.applications(program_id);

-- Lessons table indexes (only if lessons is a table, not a view)
DO $$
BEGIN
  -- Check if lessons is a table (not a view) before creating index
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'lessons' 
    AND table_type = 'BASE TABLE'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_lessons_order_index ON public.lessons(course_id, order_index);
  END IF;
END $$;

-- Audit logs indexes (if exists)
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- Comment explaining the indexes
COMMENT ON INDEX idx_courses_status IS 'Improves filtering by course status (published, draft, etc.)';
COMMENT ON INDEX idx_courses_slug IS 'Improves course lookup by slug for SEO-friendly URLs';
COMMENT ON INDEX idx_enrollments_student_course IS 'Composite index for checking existing enrollments';
-- Only add comment if index exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_lessons_order_index') THEN
    COMMENT ON INDEX idx_lessons_order_index IS 'Composite index for ordering lessons within a course';
  END IF;
END $$;
