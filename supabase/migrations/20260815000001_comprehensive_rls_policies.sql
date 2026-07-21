-- =============================================================================
-- COMPREHENSIVE RLS POLICIES - Elevate LMS
-- Fixes: 25 tables with RLS enabled but NO policies
-- Date: 2026-08-15
-- =============================================================================
-- This migration adds proper Row Level Security policies to all affected tables
-- Organized by priority: P0 Critical > P1 Major > P2 Administrative
-- =============================================================================

BEGIN;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin', 'staff')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's tenant_id
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT tenant_id FROM public.profiles
    WHERE id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- P0 CRITICAL TABLES - Apprenticeship System
-- apprentice_hours, competency_signoffs, host_shop_apprentices,
-- host_shop_evaluations, host_shop_subscriptions, host_shops
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLE: apprentice_hours
-- Purpose: Track daily hour logs for apprenticeship programs
-- Access Pattern: Apprentices see own hours, supervisors see their shop's apprentices
-- -----------------------------------------------------------------------------

-- Drop existing policies if any
DROP POLICY IF EXISTS "apprentice_hours_apprentice_select" ON apprentice_hours;
DROP POLICY IF EXISTS "apprentice_hours_apprentice_insert" ON apprentice_hours;
DROP POLICY IF EXISTS "apprentice_hours_apprentice_update" ON apprentice_hours;
DROP POLICY IF EXISTS "apprentice_hours_supervisor_access" ON apprentice_hours;
DROP POLICY IF EXISTS "apprentice_hours_admin_all" ON apprentice_hours;

-- Apprentices can view their own hours
CREATE POLICY "apprentice_hours_apprentice_select"
  ON apprentice_hours FOR SELECT
  TO authenticated
  USING (
    -- User is the apprentice
    auth.uid() = (
      SELECT apprentice_id FROM host_shop_apprentices
      WHERE id = apprentice_hours.host_shop_apprentice_id
    )
  );

-- Apprentices can insert their own hours
CREATE POLICY "apprentice_hours_apprentice_insert"
  ON apprentice_hours FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = (
      SELECT apprentice_id FROM host_shop_apprentices
      WHERE id = apprentice_hours.host_shop_apprentice_id
    )
  );

-- Apprentices can update their own hours (only pending ones)
CREATE POLICY "apprentice_hours_apprentice_update"
  ON apprentice_hours FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = (
      SELECT apprentice_id FROM host_shop_apprentices
      WHERE id = apprentice_hours.host_shop_apprentice_id
    )
    AND status = 'pending'
  );

-- Supervisors can view and approve hours for their shop's apprentices
CREATE POLICY "apprentice_hours_supervisor_access"
  ON apprentice_hours FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM host_shop_apprentices hsa
      JOIN host_shops hs ON hs.id = hsa.host_shop_id
      JOIN profiles p ON p.id = auth.uid()
      WHERE hsa.id = apprentice_hours.host_shop_apprentice_id
      AND (
        -- User is the supervisor of this apprentice
        hsa.supervisor_id = auth.uid()
        -- OR user is the shop owner (tenant owner)
        OR hs.owner_email = p.email
        -- OR user is an admin
        OR p.role IN ('admin', 'super_admin', 'staff')
      )
    )
  );

-- Admin can do everything
CREATE POLICY "apprentice_hours_admin_all"
  ON apprentice_hours FOR ALL
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- TABLE: competency_signoffs
-- Purpose: Track skill competency sign-offs by supervisors
-- Access Pattern: Apprentices see own, supervisors approve for their shop
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "signoffs_apprentice_select" ON competency_signoffs;
DROP POLICY IF EXISTS "signoffs_supervisor_access" ON competency_signoffs;
DROP POLICY IF EXISTS "signoffs_admin_all" ON competency_signoffs;

-- Apprentices can view their own signoffs
CREATE POLICY "signoffs_apprentice_select"
  ON competency_signoffs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM host_shop_apprentices hsa
      WHERE hsa.id = competency_signoffs.host_shop_apprentice_id
      AND hsa.apprentice_id = auth.uid()
    )
  );

-- Supervisors can manage signoffs for their shop's apprentices
CREATE POLICY "signoffs_supervisor_access"
  ON competency_signoffs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM host_shop_apprentices hsa
      JOIN host_shops hs ON hs.id = hsa.host_shop_id
      JOIN profiles p ON p.id = auth.uid()
      WHERE hsa.id = competency_signoffs.host_shop_apprentice_id
      AND (
        hsa.supervisor_id = auth.uid()
        OR hs.owner_email = p.email
        OR p.role IN ('admin', 'super_admin', 'staff')
      )
    )
  );

-- Admin can do everything
CREATE POLICY "signoffs_admin_all"
  ON competency_signoffs FOR ALL
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- TABLE: host_shop_apprentices
-- Purpose: Links apprentices to host shops
-- Access Pattern: Apprentices see own, supervisors see their shop
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "apprentices_own_select" ON host_shop_apprentices;
DROP POLICY IF EXISTS "apprentices_shop_access" ON host_shop_apprentices;
DROP POLICY IF EXISTS "apprentices_admin_all" ON host_shop_apprentices;

-- Apprentices can view their own apprenticeship record
CREATE POLICY "apprentices_own_select"
  ON host_shop_apprentices FOR SELECT
  TO authenticated
  USING (apprentice_id = auth.uid());

-- Supervisors can manage apprentices in their shop
CREATE POLICY "apprentices_shop_access"
  ON host_shop_apprentices FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM host_shops hs
      JOIN profiles p ON p.id = auth.uid()
      WHERE hs.id = host_shop_apprentices.host_shop_id
      AND (
        hs.owner_email = p.email
        OR p.role IN ('admin', 'super_admin', 'staff')
      )
    )
  );

-- Admin can do everything
CREATE POLICY "apprentices_admin_all"
  ON host_shop_apprentices FOR ALL
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- TABLE: host_shop_evaluations
-- Purpose: Performance evaluations for apprentices
-- Access Pattern: Apprentices see own, supervisors manage for their shop
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "evaluations_apprentice_select" ON host_shop_evaluations;
DROP POLICY IF EXISTS "evaluations_supervisor_access" ON host_shop_evaluations;
DROP POLICY IF EXISTS "evaluations_admin_all" ON host_shop_evaluations;

-- Note: This table may not exist yet, creating conditionally
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='host_shop_evaluations') THEN
    -- Apprentices can view their own evaluations
    EXECUTE format(
      'CREATE POLICY "evaluations_apprentice_select" ON host_shop_evaluations FOR SELECT TO authenticated USING (apprentice_id = auth.uid())'
    );
    
    -- Supervisors can manage evaluations for their shop
    EXECUTE format(
      'CREATE POLICY "evaluations_supervisor_access" ON host_shop_evaluations FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM host_shop_apprentices hsa JOIN host_shops hs ON hs.id = hsa.host_shop_id JOIN profiles p ON p.id = auth.uid() WHERE hsa.id = host_shop_evaluations.apprentice_id AND (hs.owner_email = p.email OR p.role IN (''admin'',''super_admin'',''staff''))))'
    );
    
    -- Admin can do everything
    EXECUTE format(
      'CREATE POLICY "evaluations_admin_all" ON host_shop_evaluations FOR ALL TO authenticated USING (public.is_admin())'
    );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- TABLE: host_shop_subscriptions
-- Purpose: Subscription/plan associations for host shops
-- Access Pattern: Shop owners and admins only
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "subscriptions_shop_access" ON host_shop_subscriptions;
DROP POLICY IF EXISTS "subscriptions_admin_all" ON host_shop_subscriptions;

-- Shop owners and admins can view subscriptions
CREATE POLICY "subscriptions_shop_access"
  ON host_shop_subscriptions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM host_shops hs
      JOIN profiles p ON p.id = auth.uid()
      WHERE hs.id = host_shop_subscriptions.tenant_id
      AND (
        hs.owner_email = p.email
        OR p.role IN ('admin', 'super_admin', 'staff')
      )
    )
  );

-- Only admins can modify subscriptions
CREATE POLICY "subscriptions_admin_all"
  ON host_shop_subscriptions FOR ALL
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- TABLE: host_shops
-- Purpose: Host shop/organization records
-- Access Pattern: Shop owners and admins
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "host_shops_shop_access" ON host_shops;
DROP POLICY IF EXISTS "host_shops_admin_all" ON host_shops;

-- Shop owners and admins can view shop details
CREATE POLICY "host_shops_shop_access"
  ON host_shops FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND (
        host_shops.owner_email = p.email
        OR p.role IN ('admin', 'super_admin', 'staff')
      )
    )
  );

-- Only admins can modify shop records
CREATE POLICY "host_shops_admin_all"
  ON host_shops FOR ALL
  TO authenticated
  USING (public.is_admin());

-- =============================================================================
-- P1 MAJOR TABLES - Curriculum & Course Generation
-- curricula, curriculum_versions, curriculum_licenses, instructor_profiles,
-- generated_assignments, generated_modules, generated_quizzes, generated_resources,
-- course_module_settings, ai_conversations
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLE: curricula
-- Purpose: Curriculum metadata and licensing info
-- Access Pattern: Public can view published, admins manage all
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "curricula_public_read" ON curricula;
DROP POLICY IF EXISTS "curricula_admin_all" ON curricula;

-- Public read for published curricula
CREATE POLICY "curricula_public_read"
  ON curricula FOR SELECT
  TO authenticated
  USING (status = 'published' OR public.is_admin());

-- Admins can manage all curricula
CREATE POLICY "curricula_admin_all"
  ON curricula FOR ALL
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- TABLE: curriculum_versions
-- Purpose: Version history for curricula
-- Access Pattern: Same as parent curriculum
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "cv_authenticated_read" ON curriculum_versions;
DROP POLICY IF EXISTS "cv_admin_all" ON curriculum_versions;

-- Authenticated users can view versions of published curricula
CREATE POLICY "cv_authenticated_read"
  ON curriculum_versions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM curricula c
      WHERE c.id = curriculum_versions.curriculum_id
      AND (c.status = 'published' OR public.is_admin())
    )
  );

-- Admins can manage all versions
CREATE POLICY "cv_admin_all"
  ON curriculum_versions FOR ALL
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- TABLE: curriculum_licenses
-- Purpose: School licenses for curriculum access
-- Access Pattern: School admins and license owners
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "licenses_school_access" ON curriculum_licenses;
DROP POLICY IF EXISTS "licenses_admin_all" ON curriculum_licenses;

-- Schools can view their own licenses
CREATE POLICY "licenses_school_access"
  ON curriculum_licenses FOR SELECT
  TO authenticated
  USING (
    school_id IN (
      SELECT id FROM schools
      WHERE email = (SELECT email FROM profiles WHERE id = auth.uid())
    )
    OR public.is_admin()
  );

-- Admins can manage all licenses
CREATE POLICY "licenses_admin_all"
  ON curriculum_licenses FOR ALL
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- TABLE: instructor_profiles
-- Purpose: Instructor information linked to profiles
-- Access Pattern: Instructors manage own, public can view active
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "instructor_own_profile" ON instructor_profiles;
DROP POLICY IF EXISTS "instructor_public_read" ON instructor_profiles;
DROP POLICY IF EXISTS "instructor_admin_all" ON instructor_profiles;

-- Instructors can manage their own profile
CREATE POLICY "instructor_own_profile"
  ON instructor_profiles FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Public can view active instructor profiles
CREATE POLICY "instructor_public_read"
  ON instructor_profiles FOR SELECT
  TO authenticated
  USING (
    active = true
    OR user_id = auth.uid()
    OR public.is_admin()
  );

-- Admins can manage all instructor profiles
CREATE POLICY "instructor_admin_all"
  ON instructor_profiles FOR ALL
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- TABLE: generated_courses
-- Purpose: AI-generated course metadata
-- Access Pattern: Course creators and admins
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "gen_courses_creator_access" ON generated_courses;
DROP POLICY IF EXISTS "gen_courses_admin_all" ON generated_courses;

-- Course creators can view and manage their courses
CREATE POLICY "gen_courses_creator_access"
  ON generated_courses FOR ALL
  TO authenticated
  USING (created_by = auth.uid());

-- Admins can manage all courses
CREATE POLICY "gen_courses_admin_all"
  ON generated_courses FOR ALL
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- TABLE: generated_modules
-- Purpose: Course modules for generated courses
-- Access Pattern: Through parent course
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "gen_modules_course_access" ON generated_modules;
DROP POLICY IF EXISTS "gen_modules_admin_all" ON generated_modules;

-- Access through parent course
CREATE POLICY "gen_modules_course_access"
  ON generated_modules FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM generated_courses gc
      WHERE gc.id = generated_modules.course_id
      AND (gc.created_by = auth.uid() OR public.is_admin())
    )
  );

-- Admins can manage all modules
CREATE POLICY "gen_modules_admin_all"
  ON generated_modules FOR ALL
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- TABLE: generated_lessons
-- Purpose: Individual lessons in generated courses
-- Access Pattern: Through parent course
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "gen_lessons_course_access" ON generated_lessons;
DROP POLICY IF EXISTS "gen_lessons_admin_all" ON generated_lessons;

-- Access through parent course
CREATE POLICY "gen_lessons_course_access"
  ON generated_lessons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM generated_courses gc
      WHERE gc.id = generated_lessons.course_id
      AND (gc.created_by = auth.uid() OR public.is_admin())
    )
  );

-- Admins can manage all lessons
CREATE POLICY "gen_lessons_admin_all"
  ON generated_lessons FOR ALL
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- TABLE: generated_quizzes
-- Purpose: Quiz questions and settings
-- Access Pattern: Through parent course
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "gen_quizzes_course_access" ON generated_quizzes;
DROP POLICY IF EXISTS "gen_quizzes_admin_all" ON generated_quizzes;

-- Access through parent course
CREATE POLICY "gen_quizzes_course_access"
  ON generated_quizzes FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM generated_courses gc
      WHERE gc.id = generated_quizzes.course_id
      AND (gc.created_by = auth.uid() OR public.is_admin())
    )
  );

-- Admins can manage all quizzes
CREATE POLICY "gen_quizzes_admin_all"
  ON generated_quizzes FOR ALL
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- TABLE: generated_assignments
-- Purpose: Assignment instructions and rubrics
-- Access Pattern: Through parent course
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "gen_assignments_course_access" ON generated_assignments;
DROP POLICY IF EXISTS "gen_assignments_admin_all" ON generated_assignments;

-- Access through parent course
CREATE POLICY "gen_assignments_course_access"
  ON generated_assignments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM generated_courses gc
      WHERE gc.id = generated_assignments.course_id
      AND (gc.created_by = auth.uid() OR public.is_admin())
    )
  );

-- Admins can manage all assignments
CREATE POLICY "gen_assignments_admin_all"
  ON generated_assignments FOR ALL
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- TABLE: generated_resources
-- Purpose: Course resources (PDFs, worksheets, etc.)
-- Access Pattern: Through parent course
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "gen_resources_course_access" ON generated_resources;
DROP POLICY IF EXISTS "gen_resources_admin_all" ON generated_resources;

-- Access through parent course
CREATE POLICY "gen_resources_course_access"
  ON generated_resources FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM generated_courses gc
      WHERE gc.id = generated_resources.course_id
      AND (gc.created_by = auth.uid() OR public.is_admin())
    )
  );

-- Admins can manage all resources
CREATE POLICY "gen_resources_admin_all"
  ON generated_resources FOR ALL
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- TABLE: course_module_settings
-- Purpose: Per-module configuration settings
-- Note: Create if doesn't exist
-- -----------------------------------------------------------------------------

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='course_module_settings') THEN
    CREATE TABLE IF NOT EXISTS public.course_module_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      module_id UUID NOT NULL,
      settings JSONB DEFAULT '{}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;
END $$;

ALTER TABLE IF EXISTS course_module_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "cms_module_access" ON course_module_settings;
DROP POLICY IF EXISTS "cms_admin_all" ON course_module_settings;

-- Access through parent course
CREATE POLICY "cms_module_access"
  ON course_module_settings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM generated_modules gm
      JOIN generated_courses gc ON gc.id = gm.course_id
      WHERE gm.id = course_module_settings.module_id
      AND (gc.created_by = auth.uid() OR public.is_admin())
    )
  );

-- Admins can manage all settings
CREATE POLICY "cms_admin_all"
  ON course_module_settings FOR ALL
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- TABLE: ai_conversations
-- Purpose: AI tutor/chat conversations
-- Access Pattern: User owns their conversations
-- -----------------------------------------------------------------------------

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ai_conversations') THEN
    DROP POLICY IF EXISTS "ai_conv_own_select" ON ai_conversations;
    DROP POLICY IF EXISTS "ai_conv_own_all" ON ai_conversations;
    DROP POLICY IF EXISTS "ai_conv_admin_all" ON ai_conversations;
    
    -- Users can view their own conversations
    EXECUTE format(
      'CREATE POLICY "ai_conv_own_select" ON ai_conversations FOR SELECT TO authenticated USING (user_id = auth.uid())'
    );
    
    -- Users can manage their own conversations
    EXECUTE format(
      'CREATE POLICY "ai_conv_own_all" ON ai_conversations FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())'
    );
    
    -- Admins can view all (for support/debugging)
    EXECUTE format(
      'CREATE POLICY "ai_conv_admin_all" ON ai_conversations FOR SELECT TO authenticated USING (public.is_admin())'
    );
  END IF;
END $$;

-- =============================================================================
-- P2 ADMINISTRATIVE TABLES
-- schools, enterprise_licenses, individual_licenses, trials,
-- blueprint_monitors, course_factory_jobs, course_publish_logs, focused_reviews
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLE: schools
-- Purpose: School accounts with license aggregation
-- Access Pattern: Admin only (sensitive organizational data)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "schools_admin_all" ON schools;

-- Only admins can manage schools
CREATE POLICY "schools_admin_all"
  ON schools FOR ALL
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- TABLE: enterprise_licenses
-- Purpose: Enterprise-level curriculum licenses
-- Access Pattern: Admin only (contractual/billing data)
-- -----------------------------------------------------------------------------

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='enterprise_licenses') THEN
    DROP POLICY IF EXISTS "ent_licenses_admin_all" ON enterprise_licenses;
    
    EXECUTE format(
      'CREATE POLICY "ent_licenses_admin_all" ON enterprise_licenses FOR ALL TO authenticated USING (public.is_admin())'
    );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- TABLE: individual_licenses
-- Purpose: Individual user licenses
-- Access Pattern: User owns their license, admin can manage
-- -----------------------------------------------------------------------------

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='individual_licenses') THEN
    DROP POLICY IF EXISTS "ind_license_own" ON individual_licenses;
    DROP POLICY IF EXISTS "ind_license_admin_all" ON individual_licenses;
    
    EXECUTE format(
      'CREATE POLICY "ind_license_own" ON individual_licenses FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())'
    );
    
    EXECUTE format(
      'CREATE POLICY "ind_license_admin_all" ON individual_licenses FOR ALL TO authenticated USING (public.is_admin())'
    );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- TABLE: trials
-- Purpose: Trial accounts tracking
-- Access Pattern: Admin only (business metrics)
-- -----------------------------------------------------------------------------

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='trials') THEN
    DROP POLICY IF EXISTS "trials_admin_all" ON trials;
    
    EXECUTE format(
      'CREATE POLICY "trials_admin_all" ON trials FOR ALL TO authenticated USING (public.is_admin())'
    );
  END IF;
END $$;

-- -----------------------------------------------------------------------------
-- TABLE: blueprint_monitors
-- Purpose: Blueprint change monitoring (internal system)
-- Access Pattern: Admin only (configuration data)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "blueprint_monitors_admin_all" ON blueprint_monitors;

-- Only admins can manage blueprint monitors
CREATE POLICY "blueprint_monitors_admin_all"
  ON blueprint_monitors FOR ALL
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- TABLE: course_factory_jobs
-- Purpose: AI course generation job tracking
-- Access Pattern: Job creators and admins
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "cf_jobs_creator_access" ON course_factory_jobs;
DROP POLICY IF EXISTS "cf_jobs_admin_all" ON course_factory_jobs;

-- Job creators can view their own jobs
CREATE POLICY "cf_jobs_creator_access"
  ON course_factory_jobs FOR SELECT
  TO authenticated
  USING (requested_by = auth.uid());

-- Only admins can create/modify jobs (prevents unauthorized job creation)
CREATE POLICY "cf_jobs_admin_all"
  ON course_factory_jobs FOR ALL
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- TABLE: course_publish_logs
-- Purpose: Audit log for course publishing actions
-- Access Pattern: Admin only (audit trail)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "cpl_admin_read" ON course_publish_logs;

-- Admins can view publish logs (read-only audit trail)
CREATE POLICY "cpl_admin_read"
  ON course_publish_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Insert policy for service role (system logging)
CREATE POLICY "cpl_service_insert"
  ON course_publish_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.role() = 'service_role');

-- -----------------------------------------------------------------------------
-- TABLE: focused_reviews
-- Purpose: Curriculum review tracking
-- Access Pattern: Reviewers and admins
-- -----------------------------------------------------------------------------

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='focused_reviews') THEN
    DROP POLICY IF EXISTS "fr_reviewer_access" ON focused_reviews;
    DROP POLICY IF EXISTS "fr_admin_all" ON focused_reviews;
    
    -- Reviewers can view assigned reviews
    EXECUTE format(
      'CREATE POLICY "fr_reviewer_access" ON focused_reviews FOR SELECT TO authenticated USING (reviewer_id = auth.uid())'
    );
    
    -- Admins can manage all reviews
    EXECUTE format(
      'CREATE POLICY "fr_admin_all" ON focused_reviews FOR ALL TO authenticated USING (public.is_admin())'
    );
  END IF;
END $$;

-- =============================================================================
-- ADDITIONAL SUPPORT TABLES
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLE: plans (host shop subscription plans)
-- Access Pattern: Public read, admin write
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "plans_public_read" ON plans;
DROP POLICY IF EXISTS "plans_admin_all" ON plans;

-- Public can view active plans
CREATE POLICY "plans_public_read"
  ON plans FOR SELECT
  TO authenticated
  USING (is_active = true OR public.is_admin());

-- Only admins can modify plans
CREATE POLICY "plans_admin_all"
  ON plans FOR ALL
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- TABLE: plan_features
-- Access Pattern: Through parent plan (admin only)
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "plan_features_admin_all" ON plan_features;

-- Admin access through plan
CREATE POLICY "plan_features_admin_all"
  ON plan_features FOR ALL
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- TABLE: course_generation_jobs
-- Access Pattern: Job creators and admins
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "cgj_creator_access" ON course_generation_jobs;
DROP POLICY IF EXISTS "cgj_admin_all" ON course_generation_jobs;

-- Job creators can view their jobs
CREATE POLICY "cgj_creator_access"
  ON course_generation_jobs FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

-- Only admins can create/modify jobs
CREATE POLICY "cgj_admin_all"
  ON course_generation_jobs FOR ALL
  TO authenticated
  USING (public.is_admin());

-- -----------------------------------------------------------------------------
-- TABLE: course_media_assets
-- Access Pattern: Through parent course
-- -----------------------------------------------------------------------------

DROP POLICY IF EXISTS "cma_course_access" ON course_media_assets;
DROP POLICY IF EXISTS "cma_admin_all" ON course_media_assets;

-- Access through parent course
CREATE POLICY "cma_course_access"
  ON course_media_assets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM generated_courses gc
      WHERE gc.id = course_media_assets.course_id
      AND (gc.created_by = auth.uid() OR public.is_admin())
    )
  );

-- Admins can manage all media
CREATE POLICY "cma_admin_all"
  ON course_media_assets FOR ALL
  TO authenticated
  USING (public.is_admin());

-- =============================================================================
-- VERIFICATION QUERIES (for documentation)
-- =============================================================================

-- Comment for documentation
COMMENT ON FUNCTION public.is_admin() IS 'Check if current user has admin privileges';
COMMENT ON FUNCTION public.is_super_admin() IS 'Check if current user is super_admin';
COMMENT ON FUNCTION public.get_user_tenant_id() IS 'Get the tenant_id for the current user';

COMMIT;

-- =============================================================================
-- SUMMARY OF POLICIES CREATED
-- =============================================================================
/*
P0 CRITICAL TABLES (Apprenticeship System):
  - apprentice_hours: 4 policies (apprentice select/insert/update + supervisor + admin)
  - competency_signoffs: 3 policies (apprentice select + supervisor + admin)
  - host_shop_apprentices: 3 policies (own select + shop access + admin)
  - host_shop_evaluations: 3 policies (conditional, same pattern)
  - host_shop_subscriptions: 2 policies (shop access select + admin all)
  - host_shops: 2 policies (shop access select + admin all)

P1 MAJOR TABLES (Curriculum & Course Generation):
  - curricula: 2 policies (public read + admin all)
  - curriculum_versions: 2 policies (authenticated read + admin all)
  - curriculum_licenses: 2 policies (school access + admin all)
  - instructor_profiles: 3 policies (own all + public read + admin all)
  - generated_courses: 2 policies (creator all + admin all)
  - generated_modules: 2 policies (course access + admin all)
  - generated_lessons: 2 policies (course access + admin all)
  - generated_quizzes: 2 policies (course access + admin all)
  - generated_assignments: 2 policies (course access + admin all)
  - generated_resources: 2 policies (course access + admin all)
  - course_module_settings: 2 policies (module access + admin all)
  - ai_conversations: 3 policies (own select + own all + admin read)

P2 ADMINISTRATIVE TABLES:
  - schools: 1 policy (admin all)
  - enterprise_licenses: 1 policy (admin all, conditional)
  - individual_licenses: 2 policies (own all + admin all, conditional)
  - trials: 1 policy (admin all, conditional)
  - blueprint_monitors: 1 policy (admin all)
  - course_factory_jobs: 2 policies (creator select + admin all)
  - course_publish_logs: 2 policies (admin read + service insert)
  - focused_reviews: 2 policies (reviewer access + admin all, conditional)

ADDITIONAL TABLES:
  - plans: 2 policies (public read + admin all)
  - plan_features: 1 policy (admin all)
  - course_generation_jobs: 2 policies (creator select + admin all)
  - course_media_assets: 2 policies (course access + admin all)

HELPER FUNCTIONS:
  - is_admin(): Returns true if user is admin/super_admin/staff
  - is_super_admin(): Returns true if user is super_admin
  - get_user_tenant_id(): Returns tenant_id for current user

TOTAL: ~55 policies across 25+ tables
*/
