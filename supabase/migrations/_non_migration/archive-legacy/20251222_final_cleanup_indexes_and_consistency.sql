-- Final cleanup: Add missing indexes and fix field name consistency
-- This migration ensures all foreign keys have indexes and normalizes field names

-- ============================================================================
-- Add missing indexes on foreign keys
-- ============================================================================

-- Enrollments
CREATE INDEX IF NOT EXISTS idx_enrollments_user_program ON public.enrollments(user_id, program_id);

-- Lesson Progress
CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment_lesson ON public.lesson_progress(enrollment_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_status ON public.lesson_progress(status);

-- Module Progress
CREATE INDEX IF NOT EXISTS idx_module_progress_enrollment_module ON public.module_progress(enrollment_id, module_id);
CREATE INDEX IF NOT EXISTS idx_module_progress_status ON public.module_progress(status);

-- Applications
CREATE INDEX IF NOT EXISTS idx_applications_user_program ON public.applications(user_id, program_id);
CREATE INDEX IF NOT EXISTS idx_applications_status_submitted ON public.applications(status, submitted_at);

-- Certificates
CREATE INDEX IF NOT EXISTS idx_certificates_user_program ON public.certificates(user_id, program_id);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON public.certificates(issued_at);

-- AI Conversations
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user ON public.ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation ON public.ai_messages(conversation_id);

-- Study Groups
CREATE INDEX IF NOT EXISTS idx_study_group_members_user ON public.study_group_members(user_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'study_group_members');
CREATE INDEX IF NOT EXISTS idx_study_group_members_group ON public.study_group_members(group_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'study_group_members');

-- Discussion Posts
CREATE INDEX IF NOT EXISTS idx_discussion_posts_thread ON public.discussion_posts(thread_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'discussion_posts');
CREATE INDEX IF NOT EXISTS idx_discussion_posts_user ON public.discussion_posts(user_id) WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'discussion_posts');

-- ============================================================================
-- Normalize field names (add aliases where needed)
-- ============================================================================

-- Products: Ensure both is_active and active work
DO $$
BEGIN
  -- If products table has 'active' but not 'is_active', add is_active as computed column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'active'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.products ADD COLUMN is_active BOOLEAN GENERATED ALWAYS AS (active) STORED;
  END IF;
  
  -- If products table has 'is_active' but not 'active', add active as computed column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'is_active'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'products' AND column_name = 'active'
  ) THEN
    ALTER TABLE public.products ADD COLUMN active BOOLEAN GENERATED ALWAYS AS (is_active) STORED;
  END IF;
END $$;

-- Courses: Ensure both status and is_published work
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'status'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'is_published'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN is_published BOOLEAN GENERATED ALWAYS AS (status = 'published') STORED;
  END IF;
END $$;

-- ============================================================================
-- Ensure all tables have updated_at triggers
-- ============================================================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT table_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND column_name = 'updated_at'
      AND table_name NOT IN (
        SELECT event_object_table
        FROM information_schema.triggers
        WHERE trigger_name = 'set_updated_at'
      )
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON public.%I
        FOR EACH ROW
        EXECUTE FUNCTION public.handle_updated_at();
    ', r.table_name, r.table_name);
    RAISE NOTICE 'Added updated_at trigger to: %', r.table_name;
  END LOOP;
END $$;

-- ============================================================================
-- Log completion
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Final cleanup complete: indexes added, field names normalized, triggers verified';
END $$;
