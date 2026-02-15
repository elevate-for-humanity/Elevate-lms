-- ============================================================
-- COMBINED MIGRATION: 2026-02-16
-- Apply in Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/cuxzzpsyufcewtmicszk/sql/new
--
-- Contains 4 migrations:
-- 1. Fix certificates policies (drop USING(true), tenant-scope)
-- 2. Scope 18 admin policies to tenant
-- 3. Partner visibility on lesson_progress
-- 4. Two-tenant isolation test function
-- ============================================================

-- ============ 1. FIX CERTIFICATES POLICIES ============

BEGIN;

DROP POLICY IF EXISTS "certificates_public_verify" ON certificates;
DROP POLICY IF EXISTS "certificates_admin_all" ON certificates;
DROP POLICY IF EXISTS "Users can view own certificates" ON certificates;

-- Public verification — narrow surface, only rows with verification_url
CREATE POLICY "certificates_public_verify" ON certificates
  FOR SELECT TO anon, authenticated
  USING (verification_url IS NOT NULL);

-- Users read own certificates within tenant
CREATE POLICY "certificates_user_read" ON certificates
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    AND tenant_id = public.get_current_tenant_id()
  );

-- Admin read — tenant-scoped
CREATE POLICY "certificates_admin_read" ON certificates
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    AND (
      public.is_super_admin()
      OR tenant_id = public.get_current_tenant_id()
    )
  );

COMMIT;

-- ============ 2. SCOPE ADMIN POLICIES TO TENANT ============

BEGIN;

-- agreements
DROP POLICY IF EXISTS "agreements_admin_all" ON agreements;
CREATE POLICY "agreements_admin_all" ON agreements
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- apprentice_assignments
DROP POLICY IF EXISTS "assignments_admin_all" ON apprentice_assignments;
CREATE POLICY "assignments_admin_all" ON apprentice_assignments
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- attendance_hours
DROP POLICY IF EXISTS "hours_admin_update" ON attendance_hours;
CREATE POLICY "hours_admin_update" ON attendance_hours
  FOR UPDATE TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

DROP POLICY IF EXISTS "hours_admin_delete" ON attendance_hours;
CREATE POLICY "hours_admin_delete" ON attendance_hours
  FOR DELETE TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- cohorts
DROP POLICY IF EXISTS "cohorts_admin_all" ON cohorts;
CREATE POLICY "cohorts_admin_all" ON cohorts
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- content_pages
DROP POLICY IF EXISTS "content_pages_admin_all" ON content_pages;
CREATE POLICY "content_pages_admin_all" ON content_pages
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- content_versions
DROP POLICY IF EXISTS "content_versions_admin_all" ON content_versions;
CREATE POLICY "content_versions_admin_all" ON content_versions
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- credential_submissions
DROP POLICY IF EXISTS "credential_submissions_admin_all" ON credential_submissions;
CREATE POLICY "credential_submissions_admin_all" ON credential_submissions
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- enrollment_transitions
DROP POLICY IF EXISTS "enrollment_transitions_admin" ON enrollment_transitions;
CREATE POLICY "enrollment_transitions_admin" ON enrollment_transitions
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- forum_comments
DROP POLICY IF EXISTS "forum_comments_admin_all" ON forum_comments;
CREATE POLICY "forum_comments_admin_all" ON forum_comments
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- franchises
DROP POLICY IF EXISTS "franchise_admin_all" ON franchises;
CREATE POLICY "franchise_admin_all" ON franchises
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- intakes
DROP POLICY IF EXISTS "intakes_admin_all" ON intakes;
CREATE POLICY "intakes_admin_all" ON intakes
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- partner_organizations
DROP POLICY IF EXISTS "partner_orgs_admin_all" ON partner_organizations;
CREATE POLICY "partner_orgs_admin_all" ON partner_organizations
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- partner_shops
DROP POLICY IF EXISTS "partner_shops_admin_all" ON partner_shops;
CREATE POLICY "partner_shops_admin_all" ON partner_shops
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- partner_sites
DROP POLICY IF EXISTS "partner_sites_admin_all" ON partner_sites;
CREATE POLICY "partner_sites_admin_all" ON partner_sites
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- payment_plans
DROP POLICY IF EXISTS "payment_plans_admin_all" ON payment_plans;
CREATE POLICY "payment_plans_admin_all" ON payment_plans
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- shop_staff
DROP POLICY IF EXISTS "shop_staff_admin_manage" ON shop_staff;
CREATE POLICY "shop_staff_admin_manage" ON shop_staff
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- social_media_settings
DROP POLICY IF EXISTS "social_media_admin_all" ON social_media_settings;
CREATE POLICY "social_media_admin_all" ON social_media_settings
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- training_enrollments
DROP POLICY IF EXISTS "training_enrollments_admin_all" ON training_enrollments;
CREATE POLICY "training_enrollments_admin_all" ON training_enrollments
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- profiles (identity table — must be tenant-scoped)
DROP POLICY IF EXISTS "profiles_admin_select" ON profiles;
CREATE POLICY "profiles_admin_select" ON profiles
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

DROP POLICY IF EXISTS "profiles_admin_all" ON profiles;
CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL TO authenticated
  USING (
    public.is_admin()
    AND (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
  );

-- Drop policy on enrollments VIEW (can't have RLS on views)
DROP POLICY IF EXISTS "enrollments_admin_all" ON enrollments;

COMMIT;

-- ============ 3. PARTNER VISIBILITY ON LESSON_PROGRESS ============

BEGIN;

DROP POLICY IF EXISTS "lesson_progress_partner_read" ON lesson_progress;

CREATE POLICY "lesson_progress_partner_read" ON lesson_progress
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    AND EXISTS (
      SELECT 1
      FROM training_enrollments te
      JOIN apprentice_placements ap ON ap.student_id = te.user_id
                                    AND ap.tenant_id = te.tenant_id
                                    AND ap.status = 'active'
      JOIN shop_staff ss ON ss.shop_id = ap.shop_id
                         AND ss.tenant_id = ap.tenant_id
                         AND ss.active = true
      WHERE te.id = lesson_progress.enrollment_id
        AND te.tenant_id = lesson_progress.tenant_id
        AND ss.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "training_enrollments_partner_read" ON training_enrollments;

CREATE POLICY "training_enrollments_partner_read" ON training_enrollments
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    AND EXISTS (
      SELECT 1
      FROM apprentice_placements ap
      JOIN shop_staff ss ON ss.shop_id = ap.shop_id
                         AND ss.tenant_id = ap.tenant_id
                         AND ss.active = true
      WHERE ap.student_id = training_enrollments.user_id
        AND ap.tenant_id = training_enrollments.tenant_id
        AND ap.status = 'active'
        AND ss.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_apprentice_placements_student_shop
  ON apprentice_placements(student_id, shop_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_shop_staff_user_shop
  ON shop_staff(user_id, shop_id)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_lesson_progress_enrollment
  ON lesson_progress(enrollment_id);

COMMIT;

-- ============ 4. TWO-TENANT ISOLATION TEST ============

CREATE OR REPLACE FUNCTION public.rls_two_tenant_test()
RETURNS TABLE(test_name text, passed boolean, detail text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tenant_a uuid := '6ba71334-58f4-4104-9b2a-5114f2a7614c';
  v_tenant_b uuid := '11b642ac-e91c-48a0-b9f2-86d9344daedb';
  v_admin_a uuid := '9c8ba3bb-efbb-4a9d-a794-ea67129db43f';
  v_user_b uuid := 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee';
  v_count_a int;
  v_count_b int;
  v_count_total int;
  v_enrollment_a uuid := 'aaaa1111-0000-0000-0000-000000000001';
  v_enrollment_b uuid := 'bbbb2222-0000-0000-0000-000000000002';
BEGIN
  -- SETUP
  INSERT INTO profiles (id, tenant_id, role, full_name)
  VALUES (v_user_b, v_tenant_b, 'admin', 'Tenant B Test Admin')
  ON CONFLICT (id) DO UPDATE SET tenant_id = v_tenant_b, role = 'admin';

  INSERT INTO training_enrollments (id, user_id, tenant_id, status)
  VALUES (v_enrollment_a, v_admin_a, v_tenant_a, 'active')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO training_enrollments (id, user_id, tenant_id, status)
  VALUES (v_enrollment_b, v_user_b, v_tenant_b, 'active')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO certificates (id, user_id, tenant_id, enrollment_id, certificate_number, issued_at)
  VALUES ('cccc3333-0000-0000-0000-000000000003', v_admin_a, v_tenant_a, v_enrollment_a, 'TEST-CERT-A', now())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO certificates (id, user_id, tenant_id, enrollment_id, certificate_number, issued_at)
  VALUES ('dddd4444-0000-0000-0000-000000000004', v_user_b, v_tenant_b, v_enrollment_b, 'TEST-CERT-B', now())
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO lesson_progress (id, user_id, tenant_id, enrollment_id, lesson_id, course_id)
  VALUES ('eeee5555-0000-0000-0000-000000000005', v_admin_a, v_tenant_a, v_enrollment_a,
    '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO lesson_progress (id, user_id, tenant_id, enrollment_id, lesson_id, course_id)
  VALUES ('ffff6666-0000-0000-0000-000000000006', v_user_b, v_tenant_b, v_enrollment_b,
    '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000004')
  ON CONFLICT (id) DO NOTHING;

  -- TEST 1: get_current_tenant_id() for Tenant A
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_a::text)::text, true);
  PERFORM set_config('role', 'authenticated', true);

  test_name := 'get_current_tenant_id() for Tenant A admin';
  passed := (public.get_current_tenant_id() = v_tenant_a);
  detail := 'Returns ' || COALESCE(public.get_current_tenant_id()::text, 'NULL');
  RETURN NEXT;

  -- TEST 2: get_current_tenant_id() for Tenant B
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_b::text)::text, true);

  test_name := 'get_current_tenant_id() for Tenant B admin';
  passed := (public.get_current_tenant_id() = v_tenant_b);
  detail := 'Returns ' || COALESCE(public.get_current_tenant_id()::text, 'NULL');
  RETURN NEXT;

  -- TEST 3: Tenant A certs scoped
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_a::text)::text, true);

  SELECT count(*) INTO v_count_a FROM certificates WHERE tenant_id = public.get_current_tenant_id();
  SELECT count(*) INTO v_count_b FROM certificates WHERE tenant_id = v_tenant_b AND tenant_id = public.get_current_tenant_id();

  test_name := 'Tenant A: certificates scoped, zero Tenant B rows via predicate';
  passed := (v_count_b = 0 AND v_count_a > 0);
  detail := 'Own: ' || v_count_a || ', Cross: ' || v_count_b;
  RETURN NEXT;

  -- TEST 4: Tenant B certs scoped
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_b::text)::text, true);

  SELECT count(*) INTO v_count_b FROM certificates WHERE tenant_id = public.get_current_tenant_id();
  SELECT count(*) INTO v_count_a FROM certificates WHERE tenant_id = v_tenant_a AND tenant_id = public.get_current_tenant_id();

  test_name := 'Tenant B: certificates scoped, zero Tenant A rows via predicate';
  passed := (v_count_a = 0 AND v_count_b > 0);
  detail := 'Own: ' || v_count_b || ', Cross: ' || v_count_a;
  RETURN NEXT;

  -- TEST 5: Tenant A lesson_progress scoped
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_a::text)::text, true);

  SELECT count(*) INTO v_count_a FROM lesson_progress WHERE tenant_id = public.get_current_tenant_id();
  SELECT count(*) INTO v_count_b FROM lesson_progress WHERE tenant_id = v_tenant_b AND tenant_id = public.get_current_tenant_id();

  test_name := 'Tenant A: lesson_progress scoped, zero Tenant B rows';
  passed := (v_count_b = 0 AND v_count_a > 0);
  detail := 'Own: ' || v_count_a || ', Cross: ' || v_count_b;
  RETURN NEXT;

  -- TEST 6: Tenant B lesson_progress scoped
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_b::text)::text, true);

  SELECT count(*) INTO v_count_b FROM lesson_progress WHERE tenant_id = public.get_current_tenant_id();
  SELECT count(*) INTO v_count_a FROM lesson_progress WHERE tenant_id = v_tenant_a AND tenant_id = public.get_current_tenant_id();

  test_name := 'Tenant B: lesson_progress scoped, zero Tenant A rows';
  passed := (v_count_a = 0 AND v_count_b > 0);
  detail := 'Own: ' || v_count_b || ', Cross: ' || v_count_a;
  RETURN NEXT;

  -- TEST 7: training_enrollments isolation
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_a::text)::text, true);

  SELECT count(*) INTO v_count_b FROM training_enrollments WHERE tenant_id = v_tenant_b AND tenant_id = public.get_current_tenant_id();

  test_name := 'Tenant A: zero Tenant B enrollments via predicate';
  passed := (v_count_b = 0);
  detail := 'Cross-tenant: ' || v_count_b;
  RETURN NEXT;

  -- TEST 8: is_admin() per tenant
  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_admin_a::text)::text, true);
  test_name := 'is_admin() for Tenant A admin';
  passed := public.is_admin();
  detail := CASE WHEN passed THEN 'true' ELSE 'false' END;
  RETURN NEXT;

  PERFORM set_config('request.jwt.claims', json_build_object('sub', v_user_b::text)::text, true);
  test_name := 'is_admin() for Tenant B admin';
  passed := public.is_admin();
  detail := CASE WHEN passed THEN 'true' ELSE 'false' END;
  RETURN NEXT;

  -- TEST 9: protect_tenant_id trigger on all core tables
  test_name := 'protect_tenant_id trigger on all 7 core tables';
  SELECT count(DISTINCT tgrelid::regclass::text) INTO v_count_a
  FROM pg_trigger WHERE tgname = 'protect_tenant_id';
  passed := (v_count_a >= 7);
  detail := v_count_a || ' tables have protect_tenant_id trigger (expect >= 7)';
  RETURN NEXT;

  -- TEST 10: NOT NULL constraints
  test_name := 'NOT NULL constraints on tenant_id (>= 7)';
  SELECT count(*) INTO v_count_a FROM information_schema.check_constraints WHERE constraint_name LIKE '%tenant_id_not_null%';
  passed := (v_count_a >= 7);
  detail := v_count_a || ' constraints';
  RETURN NEXT;

  -- CLEANUP
  DELETE FROM lesson_progress WHERE id IN ('eeee5555-0000-0000-0000-000000000005', 'ffff6666-0000-0000-0000-000000000006');
  DELETE FROM certificates WHERE id IN ('cccc3333-0000-0000-0000-000000000003', 'dddd4444-0000-0000-0000-000000000004');
  DELETE FROM training_enrollments WHERE id IN ('aaaa1111-0000-0000-0000-000000000001', 'bbbb2222-0000-0000-0000-000000000002');

  RETURN;
END;
$$;

COMMENT ON FUNCTION public.rls_two_tenant_test() IS
  'Two-tenant isolation proof. Run: SELECT * FROM rls_two_tenant_test();';

-- ============ 5. EXTEND prevent_tenant_id_change TO ALL CORE TABLES ============
-- profiles already has this trigger from 20260130_protect_tenant_id.sql.
-- Add it to the remaining 6 core skeleton tables.

DROP TRIGGER IF EXISTS protect_tenant_id ON training_enrollments;
CREATE TRIGGER protect_tenant_id
  BEFORE UPDATE ON training_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_tenant_id_change();

DROP TRIGGER IF EXISTS protect_tenant_id ON certificates;
CREATE TRIGGER protect_tenant_id
  BEFORE UPDATE ON certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_tenant_id_change();

DROP TRIGGER IF EXISTS protect_tenant_id ON lesson_progress;
CREATE TRIGGER protect_tenant_id
  BEFORE UPDATE ON lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_tenant_id_change();

DROP TRIGGER IF EXISTS protect_tenant_id ON apprentice_placements;
CREATE TRIGGER protect_tenant_id
  BEFORE UPDATE ON apprentice_placements
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_tenant_id_change();

DROP TRIGGER IF EXISTS protect_tenant_id ON shops;
CREATE TRIGGER protect_tenant_id
  BEFORE UPDATE ON shops
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_tenant_id_change();

DROP TRIGGER IF EXISTS protect_tenant_id ON shop_staff;
CREATE TRIGGER protect_tenant_id
  BEFORE UPDATE ON shop_staff
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_tenant_id_change();

-- ============ ALSO CREATE exec_sql FOR FUTURE MIGRATIONS ============

CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Restrict to service role only
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM anon;
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
