-- ============================================================================
-- FIX: Recursive RLS + Auto-populate tenant_id on INSERT
-- ============================================================================
-- Problem 1: get_current_tenant_id() queries profiles, which has RLS that
--            calls get_current_tenant_id() → infinite recursion → stack overflow.
-- Fix: Use SECURITY DEFINER to bypass RLS inside the function.
--
-- Problem 2: 133 code write paths don't include tenant_id in INSERT payloads.
-- Fix: BEFORE INSERT trigger auto-populates tenant_id from auth context.
-- ============================================================================

-- ============================================================================
-- STEP 1: Fix the recursive RLS function
-- ============================================================================
-- SECURITY DEFINER runs as the function owner (postgres), bypassing RLS.
-- This breaks the recursion: profiles RLS → get_current_tenant_id() → profiles (no RLS).

CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
$$;

-- Keep the alias in sync
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_current_tenant_id()
$$;

-- ============================================================================
-- STEP 2: Create the auto-populate trigger function
-- ============================================================================
-- 3-tier logic:
--   1. If tenant_id is already provided in the INSERT → keep it
--   2. If auth.uid() exists → pull tenant_id from profiles
--   3. If neither → use the default Elevate tenant (for service role / system inserts)

CREATE OR REPLACE FUNCTION public.auto_populate_tenant_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  -- Tier 1: tenant_id already provided
  IF NEW.tenant_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Tier 2: authenticated user context exists
  IF auth.uid() IS NOT NULL THEN
    SELECT tenant_id INTO v_tenant_id
    FROM public.profiles
    WHERE id = auth.uid();

    IF v_tenant_id IS NOT NULL THEN
      NEW.tenant_id := v_tenant_id;
      RETURN NEW;
    END IF;
  END IF;

  -- Tier 3: fallback to default Elevate tenant (for service role / system operations)
  SELECT id INTO v_tenant_id
  FROM public.tenants
  WHERE slug = 'elevate-for-humanity'
  LIMIT 1;

  NEW.tenant_id := v_tenant_id;
  RETURN NEW;
END;
$$;

-- ============================================================================
-- STEP 3: Attach trigger to all core base tables
-- ============================================================================
-- These are the tables that receive writes (directly or via views).
-- The trigger fires BEFORE INSERT, so it fills tenant_id before the row hits
-- NOT NULL constraints or RLS policies.

-- Core LMS tables
DROP TRIGGER IF EXISTS trg_auto_tenant_training_courses ON training_courses;
CREATE TRIGGER trg_auto_tenant_training_courses
  BEFORE INSERT ON training_courses
  FOR EACH ROW EXECUTE FUNCTION auto_populate_tenant_id();

DROP TRIGGER IF EXISTS trg_auto_tenant_training_lessons ON training_lessons;
CREATE TRIGGER trg_auto_tenant_training_lessons
  BEFORE INSERT ON training_lessons
  FOR EACH ROW EXECUTE FUNCTION auto_populate_tenant_id();

DROP TRIGGER IF EXISTS trg_auto_tenant_training_enrollments ON training_enrollments;
CREATE TRIGGER trg_auto_tenant_training_enrollments
  BEFORE INSERT ON training_enrollments
  FOR EACH ROW EXECUTE FUNCTION auto_populate_tenant_id();

DROP TRIGGER IF EXISTS trg_auto_tenant_training_programs ON training_programs;
CREATE TRIGGER trg_auto_tenant_training_programs
  BEFORE INSERT ON training_programs
  FOR EACH ROW EXECUTE FUNCTION auto_populate_tenant_id();

-- Identity & progress
DROP TRIGGER IF EXISTS trg_auto_tenant_profiles ON profiles;
CREATE TRIGGER trg_auto_tenant_profiles
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION auto_populate_tenant_id();

DROP TRIGGER IF EXISTS trg_auto_tenant_certificates ON certificates;
CREATE TRIGGER trg_auto_tenant_certificates
  BEFORE INSERT ON certificates
  FOR EACH ROW EXECUTE FUNCTION auto_populate_tenant_id();

DROP TRIGGER IF EXISTS trg_auto_tenant_lesson_progress ON lesson_progress;
CREATE TRIGGER trg_auto_tenant_lesson_progress
  BEFORE INSERT ON lesson_progress
  FOR EACH ROW EXECUTE FUNCTION auto_populate_tenant_id();

-- Additional tables with tenant_id that receive writes
DROP TRIGGER IF EXISTS trg_auto_tenant_modules ON modules;
CREATE TRIGGER trg_auto_tenant_modules
  BEFORE INSERT ON modules
  FOR EACH ROW EXECUTE FUNCTION auto_populate_tenant_id();

DROP TRIGGER IF EXISTS trg_auto_tenant_assignments ON assignments;
CREATE TRIGGER trg_auto_tenant_assignments
  BEFORE INSERT ON assignments
  FOR EACH ROW EXECUTE FUNCTION auto_populate_tenant_id();

DROP TRIGGER IF EXISTS trg_auto_tenant_grades ON grades;
CREATE TRIGGER trg_auto_tenant_grades
  BEFORE INSERT ON grades
  FOR EACH ROW EXECUTE FUNCTION auto_populate_tenant_id();

DROP TRIGGER IF EXISTS trg_auto_tenant_job_placements ON job_placements;
CREATE TRIGGER trg_auto_tenant_job_placements
  BEFORE INSERT ON job_placements
  FOR EACH ROW EXECUTE FUNCTION auto_populate_tenant_id();

DROP TRIGGER IF EXISTS trg_auto_tenant_notifications ON notifications;
CREATE TRIGGER trg_auto_tenant_notifications
  BEFORE INSERT ON notifications
  FOR EACH ROW EXECUTE FUNCTION auto_populate_tenant_id();

-- Operational tables that receive frequent writes
DROP TRIGGER IF EXISTS trg_auto_tenant_cohorts ON cohorts;
CREATE TRIGGER trg_auto_tenant_cohorts
  BEFORE INSERT ON cohorts
  FOR EACH ROW EXECUTE FUNCTION auto_populate_tenant_id();

DROP TRIGGER IF EXISTS trg_auto_tenant_student_applications ON student_applications;
CREATE TRIGGER trg_auto_tenant_student_applications
  BEFORE INSERT ON student_applications
  FOR EACH ROW EXECUTE FUNCTION auto_populate_tenant_id();

DROP TRIGGER IF EXISTS trg_auto_tenant_invoices ON invoices;
CREATE TRIGGER trg_auto_tenant_invoices
  BEFORE INSERT ON invoices
  FOR EACH ROW EXECUTE FUNCTION auto_populate_tenant_id();

DROP TRIGGER IF EXISTS trg_auto_tenant_shops ON shops;
CREATE TRIGGER trg_auto_tenant_shops
  BEFORE INSERT ON shops
  FOR EACH ROW EXECUTE FUNCTION auto_populate_tenant_id();

DROP TRIGGER IF EXISTS trg_auto_tenant_subscriptions ON subscriptions;
CREATE TRIGGER trg_auto_tenant_subscriptions
  BEFORE INSERT ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION auto_populate_tenant_id();
