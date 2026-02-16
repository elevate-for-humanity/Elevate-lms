-- ============================================================================
-- Migration: Enrollment Flow Fixes
-- Date: 2026-01-19
-- Description: Adds missing tables and columns for enrollment flow improvements
-- ============================================================================

-- ============================================================================
-- 1. ADD COLUMNS TO programs TABLE (if table exists)
-- ============================================================================

DO $$ 
BEGIN
  -- Add funding_eligible column
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'programs' AND table_schema = 'public') THEN
    ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS funding_eligible BOOLEAN DEFAULT false;
    ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT false;
    ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS total_cost DECIMAL(10,2);
    ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
  END IF;
END $$;

-- ============================================================================
-- 2. ADD program_slug TO student_enrollments (if table exists)
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_enrollments' AND table_schema = 'public') THEN
    ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS program_slug TEXT;
    ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS funding_source TEXT;
    ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS case_id UUID;
    ALTER TABLE public.student_enrollments ADD COLUMN IF NOT EXISTS region_id TEXT;
  END IF;
END $$;

-- ============================================================================
-- 3. CREATE enrollment_idempotency TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.enrollment_idempotency (
  idempotency_key TEXT PRIMARY KEY,
  enrollment_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_enrollment_idempotency_user 
  ON public.enrollment_idempotency(user_id);

CREATE INDEX IF NOT EXISTS idx_enrollment_idempotency_expires 
  ON public.enrollment_idempotency(expires_at);

-- Enable RLS
ALTER TABLE public.enrollment_idempotency ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "users_own_idempotency" ON public.enrollment_idempotency;
DROP POLICY IF EXISTS "service_role_all_idempotency" ON public.enrollment_idempotency;

-- Create policies
CREATE POLICY "users_own_idempotency" ON public.enrollment_idempotency
  FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "service_role_all_idempotency" ON public.enrollment_idempotency
  FOR ALL TO service_role
  USING (true);

-- ============================================================================
-- 4. ENSURE stripe_webhook_events TABLE EXISTS AND HAS CORRECT COLUMNS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  payload JSONB,
  metadata JSONB,
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if table already existed
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stripe_webhook_events' AND table_schema = 'public') THEN
    ALTER TABLE public.stripe_webhook_events ADD COLUMN IF NOT EXISTS payload JSONB;
    ALTER TABLE public.stripe_webhook_events ADD COLUMN IF NOT EXISTS metadata JSONB;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_stripe_id 
  ON public.stripe_webhook_events(stripe_event_id);

CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_status 
  ON public.stripe_webhook_events(status);

-- ============================================================================
-- 5. CREATE CLEANUP FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_idempotency_keys()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.enrollment_idempotency
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ============================================================================
-- 6. ADD INDEXES (only if tables exist)
-- ============================================================================

-- Enrollments indexes - these will silently fail if columns don't exist
DO $$ 
BEGIN
  -- Enrollments indexes (course-based schema)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enrollments' AND column_name = 'course_id' AND table_schema = 'public'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_enrollments_user_course ON public.enrollments(user_id, course_id)';
  END IF;
  
  -- Enrollments indexes (program-based schema)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'enrollments' AND column_name = 'program_id' AND table_schema = 'public'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_enrollments_user_program ON public.enrollments(user_id, program_id)';
  END IF;
  
  -- student_enrollments indexes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_enrollments' AND table_schema = 'public') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_student_enrollments_student ON public.student_enrollments(student_id)';
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_student_enrollments_status ON public.student_enrollments(status)';
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Ignore errors from missing tables/columns
  NULL;
END $$;

-- ============================================================================
-- 7. UPDATE EXISTING PROGRAMS WITH FUNDING ELIGIBILITY
-- ============================================================================

DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'programs' AND column_name = 'funding_eligible' AND table_schema = 'public'
  ) THEN
    UPDATE public.programs
    SET funding_eligible = true
    WHERE slug IN (
      'hvac-technician',
      'direct-support-professional', 
      'peer-recovery-coach',
      'emergency-health-safety',
      'barber-apprenticeship'
    ) AND (funding_eligible IS NULL OR funding_eligible = false);
  END IF;
END $$;

-- ============================================================================
-- 8. ENROLLMENT STATUS SYNC TRIGGER
-- ============================================================================
-- Syncs status changes across enrollment tables

CREATE OR REPLACE FUNCTION sync_enrollment_status()
RETURNS TRIGGER AS $$
BEGIN
  -- When program_enrollments status changes, update related course enrollments
  IF TG_TABLE_NAME = 'program_enrollments' THEN
    UPDATE public.enrollments 
    SET status = CASE 
      WHEN NEW.status = 'COMPLETED' THEN 'completed'
      WHEN NEW.status = 'completed' THEN 'completed'
      WHEN NEW.status = 'WITHDRAWN' THEN 'withdrawn'
      WHEN NEW.status = 'withdrawn' THEN 'withdrawn'
      WHEN NEW.status = 'SUSPENDED' THEN 'suspended'
      WHEN NEW.status = 'suspended' THEN 'suspended'
      ELSE 'active'
    END,
    completed_at = CASE 
      WHEN NEW.status IN ('COMPLETED', 'completed') THEN NOW()
      ELSE completed_at
    END
    WHERE user_id = NEW.student_id
    AND course_id IN (
      SELECT id FROM public.courses 
      WHERE program_id::text = NEW.program_id 
         OR program_id::text = (SELECT id::text FROM public.programs WHERE slug = NEW.program_id)
    );
  END IF;
  
  -- When student_enrollments status changes, update related course enrollments
  IF TG_TABLE_NAME = 'student_enrollments' THEN
    UPDATE public.enrollments 
    SET status = CASE 
      WHEN NEW.status = 'completed' THEN 'completed'
      WHEN NEW.status = 'dropped' THEN 'withdrawn'
      WHEN NEW.status = 'suspended' THEN 'suspended'
      ELSE 'active'
    END,
    completed_at = CASE 
      WHEN NEW.status = 'completed' THEN NOW()
      ELSE completed_at
    END
    WHERE user_id = NEW.student_id
    AND course_id IN (
      SELECT id FROM public.courses 
      WHERE program_id::text = NEW.program_id::text
         OR slug ILIKE NEW.program_slug || '%'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers (drop first if exist, then create)
DO $$ 
BEGIN
  -- Drop and create trigger for program_enrollments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'program_enrollments' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS trigger_sync_program_enrollment_status ON public.program_enrollments;
    EXECUTE '
      CREATE TRIGGER trigger_sync_program_enrollment_status
        AFTER UPDATE OF status ON public.program_enrollments
        FOR EACH ROW
        WHEN (OLD.status IS DISTINCT FROM NEW.status)
        EXECUTE FUNCTION sync_enrollment_status()
    ';
  END IF;
  
  -- Drop and create trigger for student_enrollments
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_enrollments' AND table_schema = 'public') THEN
    DROP TRIGGER IF EXISTS trigger_sync_student_enrollment_status ON public.student_enrollments;
    EXECUTE '
      CREATE TRIGGER trigger_sync_student_enrollment_status
        AFTER UPDATE OF status ON public.student_enrollments
        FOR EACH ROW
        WHEN (OLD.status IS DISTINCT FROM NEW.status)
        EXECUTE FUNCTION sync_enrollment_status()
    ';
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Ignore errors if tables don't exist
  RAISE NOTICE 'Trigger creation skipped: %', SQLERRM;
END $$;

-- ============================================================================
-- 9. SCHEDULE CLEANUP CRON JOB (if pg_cron is available)
-- ============================================================================
-- Runs daily at 3 AM to clean up expired idempotency keys

DO $$
BEGIN
  -- Check if pg_cron extension is available
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Remove existing job if it exists
    PERFORM cron.unschedule('cleanup_idempotency_keys');
    
    -- Schedule new job to run daily at 3 AM UTC
    PERFORM cron.schedule(
      'cleanup_idempotency_keys',
      '0 3 * * *',
      'SELECT cleanup_expired_idempotency_keys()'
    );
    
    RAISE NOTICE 'Cron job scheduled: cleanup_idempotency_keys';
  ELSE
    RAISE NOTICE 'pg_cron not available - cleanup job not scheduled. Run cleanup_expired_idempotency_keys() manually or via external cron.';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not schedule cron job: %', SQLERRM;
END $$;

-- ============================================================================
-- 10. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, DELETE ON public.enrollment_idempotency TO authenticated;
GRANT ALL ON public.enrollment_idempotency TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.stripe_webhook_events TO service_role;
