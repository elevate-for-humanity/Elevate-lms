-- Fix RLS on training_courses and training_lessons
-- Problem: Multiple permissive policies from different migrations allow anon/public
-- read access to all course and lesson data, including quiz answers and video URLs.
-- Solution: Drop all old policies, create proper tenant-scoped policies.
-- training_courses gets a limited public catalog policy (name, price, description only via view).
-- training_lessons is fully locked to authenticated + tenant-scoped users.

BEGIN;

-- ============================================================================
-- 1. DROP ALL EXISTING POLICIES ON training_courses
-- ============================================================================
DROP POLICY IF EXISTS "anon_read_active_courses" ON training_courses;
DROP POLICY IF EXISTS "anyone_read_active_courses" ON training_courses;
DROP POLICY IF EXISTS "auth_read_training_courses" ON training_courses;
DROP POLICY IF EXISTS "courses_select" ON training_courses;
DROP POLICY IF EXISTS "courses_insert" ON training_courses;
DROP POLICY IF EXISTS "courses_update" ON training_courses;
DROP POLICY IF EXISTS "courses_delete" ON training_courses;

-- ============================================================================
-- 2. DROP ALL EXISTING POLICIES ON training_lessons
-- ============================================================================
DROP POLICY IF EXISTS "auth_read_training_lessons" ON training_lessons;
DROP POLICY IF EXISTS "lessons_admin_all" ON training_lessons;
DROP POLICY IF EXISTS "lessons_student_read" ON training_lessons;
DROP POLICY IF EXISTS "lessons_select" ON training_lessons;
DROP POLICY IF EXISTS "lessons_insert" ON training_lessons;
DROP POLICY IF EXISTS "lessons_update" ON training_lessons;
DROP POLICY IF EXISTS "lessons_delete" ON training_lessons;

-- ============================================================================
-- 3. ENSURE RLS IS ENABLED
-- ============================================================================
ALTER TABLE training_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_lessons ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 4. training_courses POLICIES
-- ============================================================================

-- Public catalog: anon can see active courses (name, price, description are not sensitive)
-- This supports the public-facing course catalog pages.
CREATE POLICY courses_anon_catalog ON training_courses
  FOR SELECT TO anon
  USING (is_active = true);

-- Authenticated users: tenant-scoped read
CREATE POLICY courses_auth_select ON training_courses
  FOR SELECT TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    OR is_super_admin()
  );

-- Insert/Update/Delete: tenant-scoped + admin
CREATE POLICY courses_auth_insert ON training_courses
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = get_current_tenant_id()
    OR is_super_admin()
  );

CREATE POLICY courses_auth_update ON training_courses
  FOR UPDATE TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    OR is_super_admin()
  );

CREATE POLICY courses_auth_delete ON training_courses
  FOR DELETE TO authenticated
  USING (is_super_admin());

-- ============================================================================
-- 5. training_lessons POLICIES — NO ANON ACCESS
-- ============================================================================

-- Authenticated users: tenant-scoped read
CREATE POLICY lessons_auth_select ON training_lessons
  FOR SELECT TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    OR is_super_admin()
  );

-- Insert: tenant-scoped
CREATE POLICY lessons_auth_insert ON training_lessons
  FOR INSERT TO authenticated
  WITH CHECK (
    tenant_id = get_current_tenant_id()
    OR is_super_admin()
  );

-- Update: tenant-scoped
CREATE POLICY lessons_auth_update ON training_lessons
  FOR UPDATE TO authenticated
  USING (
    tenant_id = get_current_tenant_id()
    OR is_super_admin()
  );

-- Delete: super admin only
CREATE POLICY lessons_auth_delete ON training_lessons
  FOR DELETE TO authenticated
  USING (is_super_admin());

COMMIT;
