-- Lock down public lesson access
--
-- Schema verified before writing:
--   course_lessons.module_id          ✓ (20260402000006_canonical_curriculum.sql:56)
--   course_modules.course_id          ✓ (20260601000005_baseline_untracked_tables.sql:1978)
--   profiles(id, role)                ✓ (20260227000003_schema_governance_baseline.sql:10)
--   courses uses status/is_active     ✓ NOT is_published (that column is on training_courses)
--
-- The proposed migration used is_published on courses — that column does not
-- exist on public.courses. This migration uses the correct columns.
--
-- What this closes:
--   20260402000006 issued GRANT SELECT ON course_lessons TO anon and created
--   a policy with no auth.role() check. Any unauthenticated browser client
--   could read full lesson content (quiz_questions, content, video_url,
--   passing_score) for every published course.
--
-- Apply: Supabase Dashboard → SQL Editor
-- Verify: run the queries at the bottom with SET ROLE anon / authenticated

BEGIN;

-- =========================================================
-- 1. course_lessons — remove anon, require authenticated
-- =========================================================

REVOKE ALL ON public.course_lessons FROM anon;
REVOKE ALL ON public.course_lessons FROM public;
GRANT  SELECT ON public.course_lessons TO authenticated;
GRANT  ALL    ON public.course_lessons TO service_role;

-- Drop all known permissive policies from prior migrations
DROP POLICY IF EXISTS "Anyone can read course lessons"                    ON public.course_lessons;
DROP POLICY IF EXISTS "Authenticated users can read course lessons"       ON public.course_lessons;
DROP POLICY IF EXISTS "Users can read published course lessons"           ON public.course_lessons;
DROP POLICY IF EXISTS "course_lessons_select"                             ON public.course_lessons;
DROP POLICY IF EXISTS "Authenticated read published lessons"              ON public.course_lessons;
DROP POLICY IF EXISTS "course_lessons_authenticated_read"                 ON public.course_lessons;
DROP POLICY IF EXISTS "Admins and instructors can read all course lessons" ON public.course_lessons;
DROP POLICY IF EXISTS "Service role lessons"                              ON public.course_lessons;
DROP POLICY IF EXISTS "course_lessons_service_role"                       ON public.course_lessons;

-- Learners: read lessons for published, active courses
-- Uses status + is_active — the actual columns on public.courses
CREATE POLICY "course_lessons_authenticated_read"
  ON public.course_lessons
  FOR SELECT
  TO authenticated
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1
      FROM public.course_modules cm
      JOIN public.courses c ON c.id = cm.course_id
      WHERE cm.id          = course_lessons.module_id
        AND c.status       = 'published'
        AND c.is_active    = true
    )
  );

-- Admins and instructors: read all lessons regardless of publish state
-- (needed for admin curriculum builder and instructor preview)
CREATE POLICY "course_lessons_admin_read"
  ON public.course_lessons
  FOR SELECT
  TO authenticated
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id   = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'instructor', 'staff')
    )
  );

-- Service role: unrestricted (used by server-side pipeline and seed scripts)
CREATE POLICY "course_lessons_service_role"
  ON public.course_lessons
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =========================================================
-- 2. lms_lessons view — remove anon grant
-- =========================================================
-- View uses security_invoker=true so underlying RLS is the real gate.
-- Revoking anon removes the explicit grant as belt-and-suspenders.

REVOKE ALL   ON public.lms_lessons FROM anon;
REVOKE ALL   ON public.lms_lessons FROM public;
GRANT  SELECT ON public.lms_lessons TO authenticated, service_role;

-- =========================================================
-- 3. course_modules — ensure anon cannot read module structure
-- =========================================================

REVOKE ALL   ON public.course_modules FROM anon;
REVOKE ALL   ON public.course_modules FROM public;
GRANT  SELECT ON public.course_modules TO authenticated;
GRANT  ALL    ON public.course_modules TO service_role;

ALTER TABLE public.course_modules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "course_modules_authenticated_read" ON public.course_modules;
DROP POLICY IF EXISTS "course_modules_admin_read"         ON public.course_modules;
DROP POLICY IF EXISTS "course_modules_service_role"       ON public.course_modules;

CREATE POLICY "course_modules_authenticated_read"
  ON public.course_modules
  FOR SELECT
  TO authenticated
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.courses c
      WHERE c.id       = course_modules.course_id
        AND c.status   = 'published'
        AND c.is_active = true
    )
  );

CREATE POLICY "course_modules_admin_read"
  ON public.course_modules
  FOR SELECT
  TO authenticated
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id   = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'instructor', 'staff')
    )
  );

CREATE POLICY "course_modules_service_role"
  ON public.course_modules
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- =========================================================
-- 4. courses — keep anon catalog read, tighten policies
-- =========================================================
-- courses uses status + is_active, NOT is_published.
-- Anon can see published catalog rows (name, price, description).
-- This is intentional for the public course catalog pages.

GRANT SELECT ON public.courses TO anon;
GRANT SELECT ON public.courses TO authenticated;
GRANT ALL    ON public.courses TO service_role;

DROP POLICY IF EXISTS "Anyone can read courses"                ON public.courses;
DROP POLICY IF EXISTS "Public can read published courses"      ON public.courses;
DROP POLICY IF EXISTS "Public read published courses"          ON public.courses;
DROP POLICY IF EXISTS "courses_select"                         ON public.courses;
DROP POLICY IF EXISTS "Anon can read published catalog courses" ON public.courses;
DROP POLICY IF EXISTS "Authenticated users can read published courses" ON public.courses;
DROP POLICY IF EXISTS "Admins can read all courses"            ON public.courses;
DROP POLICY IF EXISTS "Service role courses"                   ON public.courses;

-- Anon: published catalog only
CREATE POLICY "courses_anon_catalog"
  ON public.courses
  FOR SELECT
  TO anon
  USING (status = 'published' AND is_active = true);

-- Authenticated learners: published courses
CREATE POLICY "courses_authenticated_read"
  ON public.courses
  FOR SELECT
  TO authenticated
  USING (
    auth.role() = 'authenticated'
    AND status  = 'published'
    AND is_active = true
  );

-- Admins/instructors: all courses (draft + published)
CREATE POLICY "courses_admin_read"
  ON public.courses
  FOR SELECT
  TO authenticated
  USING (
    auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id   = auth.uid()
        AND p.role IN ('admin', 'super_admin', 'instructor', 'staff')
    )
  );

-- Service role: unrestricted
CREATE POLICY "courses_service_role"
  ON public.courses
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMIT;

-- =========================================================
-- Post-migration verification queries
-- Run these in Supabase SQL Editor after applying.
-- =========================================================
--
-- 1. Check grants — anon should NOT appear for course_lessons or lms_lessons:
--
--    SELECT grantee, table_name, privilege_type
--    FROM information_schema.role_table_grants
--    WHERE table_schema = 'public'
--      AND table_name IN ('course_lessons', 'lms_lessons', 'course_modules', 'courses')
--    ORDER BY table_name, grantee, privilege_type;
--
--    Expected:
--      course_lessons  → authenticated (SELECT), service_role (ALL)
--      lms_lessons     → authenticated (SELECT), service_role (SELECT)
--      course_modules  → authenticated (SELECT), service_role (ALL)
--      courses         → anon (SELECT), authenticated (SELECT), service_role (ALL)
--
-- 2. Anon cannot read lesson content:
--
--    SET ROLE anon;
--    SELECT id, title, quiz_questions FROM public.course_lessons LIMIT 5;
--    -- Expected: 0 rows
--
--    SELECT id, title, quiz_questions FROM public.lms_lessons LIMIT 5;
--    -- Expected: 0 rows
--
-- 3. Anon CAN read published courses (catalog):
--
--    SET ROLE anon;
--    SELECT id, title, status FROM public.courses WHERE status = 'published' LIMIT 5;
--    -- Expected: rows returned
--
-- 4. Authenticated learner can read published lesson titles:
--
--    SET ROLE authenticated;
--    SET request.jwt.claims TO '{"role":"authenticated","sub":"<any-real-user-uuid>"}';
--    SELECT id, title FROM public.course_lessons LIMIT 5;
--    -- Expected: rows for published courses
--
-- 5. Admin can read all lessons:
--
--    -- (set JWT to an admin user's UUID)
--    SELECT id, title, quiz_questions FROM public.course_lessons LIMIT 5;
--    -- Expected: rows including quiz_questions
