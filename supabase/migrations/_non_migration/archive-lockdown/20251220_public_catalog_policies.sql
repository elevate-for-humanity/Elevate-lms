-- PUBLIC CATALOG POLICIES
-- Migration: 20251220_public_catalog_policies
-- Purpose: Enable safe public read access to catalog/marketing tables
-- 
-- These tables contain public information that should be readable by anyone:
-- - Programs and courses
-- - Partner information
-- - Credentials and certifications
-- - Grant opportunities
-- - Public resources

-- ============================================================================
-- Enable RLS on catalog tables
-- ============================================================================

ALTER TABLE IF EXISTS public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lms_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.partner_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.partner_lms_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.credentialing_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.grant_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.grant_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.lesson_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.drug_testing_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.drug_testing_training ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Public read policies for catalog tables
-- ============================================================================

-- Programs (public catalog)
CREATE POLICY "public_read_programs" ON public.programs
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Courses (public catalog)
CREATE POLICY "public_read_courses" ON public.courses
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true OR status = 'published');

-- LMS Courses (public catalog)
CREATE POLICY "public_read_lms_courses" ON public.lms_courses
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Partner Courses (public catalog)
CREATE POLICY "public_read_partner_courses" ON public.partner_courses
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

-- Partner LMS Providers (public info)
CREATE POLICY "public_read_partner_providers" ON public.partner_lms_providers
  FOR SELECT
  TO anon, authenticated
  USING (active = true OR is_active = true);

-- Credentials (public catalog)
CREATE POLICY "public_read_credentials" ON public.credentials
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Credentialing Partners (public info)
CREATE POLICY "public_read_credentialing_partners" ON public.credentialing_partners
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Grant Sources (public info)
CREATE POLICY "public_read_grant_sources" ON public.grant_sources
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Grant Opportunities (public info)
CREATE POLICY "public_read_grant_opportunities" ON public.grant_opportunities
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Resources (public content)
CREATE POLICY "public_read_resources" ON public.resources
  FOR SELECT
  TO anon, authenticated
  USING (is_published = true);

-- Lesson Resources (public content)
CREATE POLICY "public_read_lesson_resources" ON public.lesson_resources
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Drug Testing Services (public catalog)
CREATE POLICY "public_read_drug_testing_services" ON public.drug_testing_services
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- Drug Testing Training (public catalog)
CREATE POLICY "public_read_drug_testing_training" ON public.drug_testing_training
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

-- ============================================================================
-- COMPLETION NOTICE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ PUBLIC CATALOG POLICIES APPLIED';
  RAISE NOTICE '   - Programs, courses, and partner courses are publicly readable';
  RAISE NOTICE '   - Grant opportunities and resources are publicly readable';
  RAISE NOTICE '   - Drug testing services are publicly readable';
  RAISE NOTICE '';
  RAISE NOTICE '   All catalog tables now have RLS enabled with safe public read access';
END $$;
