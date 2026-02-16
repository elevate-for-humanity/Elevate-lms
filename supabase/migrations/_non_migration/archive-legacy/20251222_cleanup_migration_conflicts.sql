-- PHASE B: Migration Cleanup
-- This migration ensures idempotency and fixes conflicts from numbered migrations
-- Safe to run multiple times

-- Ensure all tables use explicit public schema
-- (Some old migrations omitted schema prefix)

-- Fix any tables that might exist without schema prefix
DO $$
BEGIN
  -- Move tables to public schema if they exist in wrong location
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'programs' AND table_schema != 'public') THEN
    EXECUTE 'ALTER TABLE programs SET SCHEMA public';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'modules' AND table_schema != 'public') THEN
    EXECUTE 'ALTER TABLE modules SET SCHEMA public';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lessons' AND table_schema != 'public') THEN
    EXECUTE 'ALTER TABLE lessons SET SCHEMA public';
  END IF;
END $$;

-- Ensure RLS is enabled on all core tables
ALTER TABLE IF EXISTS public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Add missing indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_programs_slug ON public.programs(slug);
CREATE INDEX IF NOT EXISTS idx_programs_active ON public.programs(is_active);
CREATE INDEX IF NOT EXISTS idx_modules_program_id ON public.modules(program_id);
CREATE INDEX IF NOT EXISTS idx_lessons_module_id ON public.lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON public.enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_program_id ON public.enrollments(program_id);

-- Ensure updated_at triggers exist
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to core tables (idempotent)
DO $$
BEGIN
  DROP TRIGGER IF EXISTS set_updated_at ON public.programs;
  CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.programs
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
    
  DROP TRIGGER IF EXISTS set_updated_at ON public.modules;
  CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.modules
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
    
  DROP TRIGGER IF EXISTS set_updated_at ON public.lessons;
  CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.lessons
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
END $$;

-- Log cleanup completion
DO $$
BEGIN
  RAISE NOTICE 'PHASE B cleanup completed: schema normalized, RLS enabled, indexes verified';
END $$;
