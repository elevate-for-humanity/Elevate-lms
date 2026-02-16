-- Fix: Partner LMS table RLS policies were only in archive-unapplied.
-- Without these, /courses/partners returns empty results (RLS enabled, no policies)
-- or is wide open (RLS not enabled).
--
-- Tables: partner_lms_providers, partner_lms_courses, partner_courses,
--         partner_lms_enrollments, partner_certificates
--
-- Uses is_admin() SECURITY DEFINER to avoid profiles recursion.

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. partner_lms_providers
-- ────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.partner_lms_providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_lms_providers_public_read" ON public.partner_lms_providers;
DROP POLICY IF EXISTS "Public can view active providers" ON public.partner_lms_providers;
CREATE POLICY "partner_lms_providers_public_read"
  ON public.partner_lms_providers
  FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "partner_lms_providers_admin_all" ON public.partner_lms_providers;
DROP POLICY IF EXISTS "Admins can manage providers" ON public.partner_lms_providers;
CREATE POLICY "partner_lms_providers_admin_all"
  ON public.partner_lms_providers
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ────────────────────────────────────────────────────────────────
-- 2. partner_lms_courses
-- ────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.partner_lms_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_lms_courses_public_read" ON public.partner_lms_courses;
CREATE POLICY "partner_lms_courses_public_read"
  ON public.partner_lms_courses
  FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "partner_lms_courses_admin_all" ON public.partner_lms_courses;
CREATE POLICY "partner_lms_courses_admin_all"
  ON public.partner_lms_courses
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ────────────────────────────────────────────────────────────────
-- 3. partner_courses
-- ────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.partner_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active courses" ON public.partner_courses;
DROP POLICY IF EXISTS "Anyone can view active partner courses" ON public.partner_courses;
CREATE POLICY "partner_courses_public_read"
  ON public.partner_courses
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage courses" ON public.partner_courses;
CREATE POLICY "partner_courses_admin_all"
  ON public.partner_courses
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ────────────────────────────────────────────────────────────────
-- 4. partner_lms_enrollments
-- ────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.partner_lms_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_lms_enrollments_own" ON public.partner_lms_enrollments;
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.partner_lms_enrollments;
CREATE POLICY "partner_lms_enrollments_own"
  ON public.partner_lms_enrollments
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "partner_lms_enrollments_admin" ON public.partner_lms_enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.partner_lms_enrollments;
CREATE POLICY "partner_lms_enrollments_admin"
  ON public.partner_lms_enrollments
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Service role for Edge Functions
DROP POLICY IF EXISTS "Service role can manage enrollments" ON public.partner_lms_enrollments;
CREATE POLICY "partner_lms_enrollments_service"
  ON public.partner_lms_enrollments
  FOR ALL
  TO public
  WITH CHECK (auth.role() = 'service_role');

-- ────────────────────────────────────────────────────────────────
-- 5. partner_certificates
-- ────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.partner_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own certificates" ON public.partner_certificates;
CREATE POLICY "partner_certificates_own"
  ON public.partner_certificates
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all certificates" ON public.partner_certificates;
CREATE POLICY "partner_certificates_admin"
  ON public.partner_certificates
  FOR ALL
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Service role can manage certificates" ON public.partner_certificates;
CREATE POLICY "partner_certificates_service"
  ON public.partner_certificates
  FOR ALL
  TO public
  WITH CHECK (auth.role() = 'service_role');

-- ────────────────────────────────────────────────────────────────
-- 6. partner_lms_enrollment_failures (admin only)
-- ────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.partner_lms_enrollment_failures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view enrollment failures" ON public.partner_lms_enrollment_failures;
CREATE POLICY "partner_enrollment_failures_admin"
  ON public.partner_lms_enrollment_failures
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ────────────────────────────────────────────────────────────────
-- 7. Grants
-- ────────────────────────────────────────────────────────────────
GRANT SELECT ON public.partner_lms_providers TO anon, authenticated;
GRANT SELECT ON public.partner_lms_courses TO anon, authenticated;
GRANT SELECT ON public.partner_courses TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.partner_lms_enrollments TO authenticated;
GRANT SELECT ON public.partner_certificates TO authenticated;
GRANT ALL ON public.partner_lms_providers TO service_role;
GRANT ALL ON public.partner_lms_courses TO service_role;
GRANT ALL ON public.partner_courses TO service_role;
GRANT ALL ON public.partner_lms_enrollments TO service_role;
GRANT ALL ON public.partner_certificates TO service_role;
GRANT ALL ON public.partner_lms_enrollment_failures TO service_role;

COMMIT;
