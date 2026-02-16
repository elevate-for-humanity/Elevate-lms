-- ================================================================
-- ALL ENROLLMENT FIXES — PASTE INTO SUPABASE SQL EDITOR
-- ================================================================
-- "enrollments" is a VIEW over "training_enrollments" in production.
-- All policies and grants target training_enrollments (the real table).
-- ================================================================


-- ================================================================
-- FIX 1: training_enrollments — student SELECT/INSERT/UPDATE + grants
-- ================================================================
BEGIN;
GRANT SELECT, INSERT, UPDATE ON public.training_enrollments TO authenticated;

DROP POLICY IF EXISTS "Students can view own enrollments" ON public.training_enrollments;
CREATE POLICY "Students can view own enrollments"
  ON public.training_enrollments FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Students can create own enrollments" ON public.training_enrollments;
CREATE POLICY "Students can create own enrollments"
  ON public.training_enrollments FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Students can update own enrollments" ON public.training_enrollments;
CREATE POLICY "Students can update own enrollments"
  ON public.training_enrollments FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
COMMIT;


-- ================================================================
-- FIX 2: partner tables — RLS policies + grants
-- ================================================================
BEGIN;

-- partner_lms_providers
ALTER TABLE IF EXISTS public.partner_lms_providers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "partner_lms_providers_public_read" ON public.partner_lms_providers;
DROP POLICY IF EXISTS "Public can view active providers" ON public.partner_lms_providers;
CREATE POLICY "partner_lms_providers_public_read"
  ON public.partner_lms_providers FOR SELECT USING (active = true);
DROP POLICY IF EXISTS "partner_lms_providers_admin_all" ON public.partner_lms_providers;
DROP POLICY IF EXISTS "Admins can manage providers" ON public.partner_lms_providers;
CREATE POLICY "partner_lms_providers_admin_all"
  ON public.partner_lms_providers FOR ALL TO authenticated USING (public.is_admin());

-- partner_lms_courses
ALTER TABLE IF EXISTS public.partner_lms_courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "partner_lms_courses_public_read" ON public.partner_lms_courses;
CREATE POLICY "partner_lms_courses_public_read"
  ON public.partner_lms_courses FOR SELECT USING (active = true);
DROP POLICY IF EXISTS "partner_lms_courses_admin_all" ON public.partner_lms_courses;
CREATE POLICY "partner_lms_courses_admin_all"
  ON public.partner_lms_courses FOR ALL TO authenticated USING (public.is_admin());

-- partner_courses
ALTER TABLE IF EXISTS public.partner_courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can view active courses" ON public.partner_courses;
DROP POLICY IF EXISTS "Anyone can view active partner courses" ON public.partner_courses;
CREATE POLICY "partner_courses_public_read"
  ON public.partner_courses FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Admins can manage courses" ON public.partner_courses;
CREATE POLICY "partner_courses_admin_all"
  ON public.partner_courses FOR ALL TO authenticated USING (public.is_admin());

-- partner_lms_enrollments
ALTER TABLE IF EXISTS public.partner_lms_enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "partner_lms_enrollments_own" ON public.partner_lms_enrollments;
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.partner_lms_enrollments;
CREATE POLICY "partner_lms_enrollments_own"
  ON public.partner_lms_enrollments FOR ALL TO authenticated USING (student_id = auth.uid());
DROP POLICY IF EXISTS "partner_lms_enrollments_admin" ON public.partner_lms_enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.partner_lms_enrollments;
CREATE POLICY "partner_lms_enrollments_admin"
  ON public.partner_lms_enrollments FOR ALL TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Service role can manage enrollments" ON public.partner_lms_enrollments;
CREATE POLICY "partner_lms_enrollments_service"
  ON public.partner_lms_enrollments FOR ALL TO public WITH CHECK (auth.role() = 'service_role');

-- partner_certificates
ALTER TABLE IF EXISTS public.partner_certificates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Students can view own certificates" ON public.partner_certificates;
CREATE POLICY "partner_certificates_own"
  ON public.partner_certificates FOR SELECT TO authenticated USING (student_id = auth.uid());
DROP POLICY IF EXISTS "Admins can view all certificates" ON public.partner_certificates;
CREATE POLICY "partner_certificates_admin"
  ON public.partner_certificates FOR ALL TO authenticated USING (public.is_admin());
DROP POLICY IF EXISTS "Service role can manage certificates" ON public.partner_certificates;
CREATE POLICY "partner_certificates_service"
  ON public.partner_certificates FOR ALL TO public WITH CHECK (auth.role() = 'service_role');

-- partner_lms_enrollment_failures
ALTER TABLE IF EXISTS public.partner_lms_enrollment_failures ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view enrollment failures" ON public.partner_lms_enrollment_failures;
CREATE POLICY "partner_enrollment_failures_admin"
  ON public.partner_lms_enrollment_failures FOR SELECT TO authenticated USING (public.is_admin());

-- Grants
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


-- ================================================================
-- FIX 3: documents — owner SELECT + UPDATE + admin ALL
-- ================================================================
BEGIN;
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Users can view own documents"
  ON public.documents FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Owners can view own documents" ON public.documents;
CREATE POLICY "Owners can view own documents"
  ON public.documents FOR SELECT TO authenticated USING (owner_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
CREATE POLICY "Users can update own documents"
  ON public.documents FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "documents_admin_all" ON public.documents;
CREATE POLICY "documents_admin_all"
  ON public.documents FOR ALL TO authenticated USING (public.is_admin());

GRANT SELECT, INSERT, UPDATE ON public.documents TO authenticated;
COMMIT;


-- ================================================================
-- FIX 4: lesson_progress — tenant_id optional + signup trigger
-- ================================================================
BEGIN;
DROP POLICY IF EXISTS lp_owner_insert ON public.lesson_progress;
CREATE POLICY lp_owner_insert ON public.lesson_progress
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL)
  );

DROP POLICY IF EXISTS lp_owner_update ON public.lesson_progress;
CREATE POLICY lp_owner_update ON public.lesson_progress
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL)
  );

DROP POLICY IF EXISTS lp_admin_select ON public.lesson_progress;
CREATE POLICY lp_admin_select ON public.lesson_progress
  FOR SELECT TO authenticated
  USING (
    is_admin()
    AND (tenant_id = get_current_tenant_id() OR is_super_admin())
  );

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_default_tenant uuid;
BEGIN
  SELECT id INTO v_default_tenant
  FROM public.tenants
  WHERE active = true
  ORDER BY created_at ASC
  LIMIT 1;

  INSERT INTO public.profiles (id, email, role, tenant_id)
  VALUES (NEW.id, NEW.email, 'student', v_default_tenant);
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'student')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
COMMIT;
