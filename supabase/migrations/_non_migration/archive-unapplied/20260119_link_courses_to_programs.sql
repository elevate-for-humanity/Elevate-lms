-- ============================================================================
-- Migration: Link Courses to Programs
-- Date: 2026-01-19
-- Description: Ensures courses are properly linked to programs for enrollment
-- ============================================================================

-- ============================================================================
-- 1. ADD slug/category COLUMNS TO courses IF IT'S A TABLE (not a view)
-- ============================================================================

DO $$ 
BEGIN
  -- Only alter if courses is a TABLE, not a VIEW
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'courses' 
    AND table_schema = 'public' 
    AND table_type = 'BASE TABLE'
  ) THEN
    ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS slug TEXT;
    ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS category TEXT;
  END IF;
END $$;

-- ============================================================================
-- 2. LINK COURSES TO PROGRAMS BY MATCHING NAMES/SLUGS
-- ============================================================================

-- Update courses that have NULL program_id but can be matched by name/slug
-- Only runs if courses is a BASE TABLE (not a view)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'courses' AND table_schema = 'public' AND table_type = 'BASE TABLE'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'programs' AND table_schema = 'public'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'program_id' AND table_schema = 'public'
  ) THEN
    
    -- Link HVAC courses
    UPDATE public.courses c
    SET program_id = p.id
    FROM public.programs p
    WHERE c.program_id IS NULL
    AND p.slug = 'hvac-technician'
    AND LOWER(c.title) LIKE '%hvac%';
    
    -- Link Barber courses
    UPDATE public.courses c
    SET program_id = p.id
    FROM public.programs p
    WHERE c.program_id IS NULL
    AND p.slug = 'barber-apprenticeship'
    AND (LOWER(c.title) LIKE '%barber%' OR LOWER(c.title) LIKE '%milady%');
    
    -- Link DSP courses
    UPDATE public.courses c
    SET program_id = p.id
    FROM public.programs p
    WHERE c.program_id IS NULL
    AND p.slug = 'direct-support-professional'
    AND (LOWER(c.title) LIKE '%dsp%' OR LOWER(c.title) LIKE '%direct support%');
    
    -- Link Peer Recovery courses
    UPDATE public.courses c
    SET program_id = p.id
    FROM public.programs p
    WHERE c.program_id IS NULL
    AND p.slug = 'peer-recovery-coach'
    AND (LOWER(c.title) LIKE '%peer%' OR LOWER(c.title) LIKE '%recovery%');
    
    -- Link Emergency Health & Safety courses
    UPDATE public.courses c
    SET program_id = p.id
    FROM public.programs p
    WHERE c.program_id IS NULL
    AND p.slug = 'emergency-health-safety'
    AND (LOWER(c.title) LIKE '%cpr%' OR LOWER(c.title) LIKE '%first aid%' OR LOWER(c.title) LIKE '%osha%');
    
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not update courses: %', SQLERRM;
END $$;

-- ============================================================================
-- 3. CREATE program_courses JUNCTION TABLE FOR MANY-TO-MANY
-- ============================================================================
-- Some courses may belong to multiple programs

CREATE TABLE IF NOT EXISTS public.program_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL,
  course_id UUID NOT NULL,
  is_required BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_program_courses_program ON public.program_courses(program_id);
CREATE INDEX IF NOT EXISTS idx_program_courses_course ON public.program_courses(course_id);

-- Enable RLS
ALTER TABLE public.program_courses ENABLE ROW LEVEL SECURITY;

-- Public read access
DROP POLICY IF EXISTS "public_read_program_courses" ON public.program_courses;
CREATE POLICY "public_read_program_courses" ON public.program_courses
  FOR SELECT TO anon, authenticated
  USING (true);

-- Service role full access
DROP POLICY IF EXISTS "service_role_all_program_courses" ON public.program_courses;
CREATE POLICY "service_role_all_program_courses" ON public.program_courses
  FOR ALL TO service_role
  USING (true);

-- ============================================================================
-- 4. POPULATE program_courses FROM EXISTING courses.program_id
-- ============================================================================

DO $$
BEGIN
  -- Only populate if courses has program_id column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'courses' AND column_name = 'program_id' AND table_schema = 'public'
  ) THEN
    INSERT INTO public.program_courses (program_id, course_id, is_required, order_index)
    SELECT 
      c.program_id,
      c.id,
      true,
      COALESCE(c.order_index, 0)
    FROM public.courses c
    WHERE c.program_id IS NOT NULL
    ON CONFLICT (program_id, course_id) DO NOTHING;
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not populate program_courses: %', SQLERRM;
END $$;

-- ============================================================================
-- 5. CREATE partner_program_courses FOR PARTNER INTEGRATIONS
-- ============================================================================
-- Links partner courses (Coursera, LinkedIn, etc.) to programs

CREATE TABLE IF NOT EXISTS public.partner_program_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL,
  partner_course_id UUID NOT NULL,
  is_required BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, partner_course_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_program_courses_program ON public.partner_program_courses(program_id);
CREATE INDEX IF NOT EXISTS idx_partner_program_courses_course ON public.partner_program_courses(partner_course_id);

-- Enable RLS
ALTER TABLE public.partner_program_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_partner_program_courses" ON public.partner_program_courses;
CREATE POLICY "public_read_partner_program_courses" ON public.partner_program_courses
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "service_role_all_partner_program_courses" ON public.partner_program_courses;
CREATE POLICY "service_role_all_partner_program_courses" ON public.partner_program_courses
  FOR ALL TO service_role
  USING (true);

-- ============================================================================
-- 6. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON public.program_courses TO anon, authenticated;
GRANT ALL ON public.program_courses TO service_role;

GRANT SELECT ON public.partner_program_courses TO anon, authenticated;
GRANT ALL ON public.partner_program_courses TO service_role;
