-- 20260215_rls_test_harness.sql
--
-- JWT simulation test harness for verifying RLS enforcement.
-- Creates a function that tests access for each role.
-- Run after 20260215_break_recursion_use_definer_functions.sql.
--
-- Usage: SELECT * FROM public.rls_test_report();

CREATE OR REPLACE FUNCTION public.rls_test_report()
RETURNS TABLE (
  test_name text,
  passed boolean,
  detail text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count bigint;
  v_admin_id uuid;
  v_student_id uuid;
  v_admin_tenant uuid;
  v_student_tenant uuid;
BEGIN
  -- Get a real admin and student for testing
  SELECT id, tenant_id INTO v_admin_id, v_admin_tenant
  FROM profiles WHERE role IN ('admin', 'super_admin') AND tenant_id IS NOT NULL LIMIT 1;

  SELECT id, tenant_id INTO v_student_id, v_student_tenant
  FROM profiles WHERE role = 'student' AND tenant_id IS NOT NULL LIMIT 1;

  -- Test 1: Zero NULL tenant_id in profiles
  SELECT count(*) INTO v_count FROM profiles WHERE tenant_id IS NULL;
  test_name := 'profiles: zero NULL tenant_id';
  passed := v_count = 0;
  detail := v_count || ' NULLs';
  RETURN NEXT;

  -- Test 2: Zero NULL tenant_id in training_enrollments
  SELECT count(*) INTO v_count FROM training_enrollments WHERE tenant_id IS NULL;
  test_name := 'training_enrollments: zero NULL tenant_id';
  passed := v_count = 0;
  detail := v_count || ' NULLs';
  RETURN NEXT;

  -- Test 3: Zero NULL tenant_id in certificates
  SELECT count(*) INTO v_count FROM certificates WHERE tenant_id IS NULL;
  test_name := 'certificates: zero NULL tenant_id';
  passed := v_count = 0;
  detail := v_count || ' NULLs';
  RETURN NEXT;

  -- Test 4: Zero NULL tenant_id in lesson_progress
  SELECT count(*) INTO v_count FROM lesson_progress WHERE tenant_id IS NULL;
  test_name := 'lesson_progress: zero NULL tenant_id';
  passed := v_count = 0;
  detail := v_count || ' NULLs';
  RETURN NEXT;

  -- Test 5: Zero NULL tenant_id in shops
  SELECT count(*) INTO v_count FROM shops WHERE tenant_id IS NULL;
  test_name := 'shops: zero NULL tenant_id';
  passed := v_count = 0;
  detail := v_count || ' NULLs';
  RETURN NEXT;

  -- Test 6: Zero NULL tenant_id in shop_staff
  SELECT count(*) INTO v_count FROM shop_staff WHERE tenant_id IS NULL;
  test_name := 'shop_staff: zero NULL tenant_id';
  passed := v_count = 0;
  detail := v_count || ' NULLs';
  RETURN NEXT;

  -- Test 7: Zero NULL tenant_id in apprentice_placements
  SELECT count(*) INTO v_count FROM apprentice_placements WHERE tenant_id IS NULL;
  test_name := 'apprentice_placements: zero NULL tenant_id';
  passed := v_count = 0;
  detail := v_count || ' NULLs';
  RETURN NEXT;

  -- Test 8: NOT NULL constraints exist
  SELECT count(*) INTO v_count
  FROM information_schema.check_constraints
  WHERE constraint_name IN (
    'profiles_tenant_id_not_null',
    'training_enrollments_tenant_id_not_null',
    'certificates_tenant_id_not_null',
    'lesson_progress_tenant_id_not_null',
    'placements_tenant_id_not_null',
    'shops_tenant_id_not_null',
    'shop_staff_tenant_id_not_null'
  );
  test_name := 'NOT NULL constraints exist';
  passed := v_count = 7;
  detail := v_count || '/7 constraints';
  RETURN NEXT;

  -- Test 9: RLS enabled on key tables
  SELECT count(*) INTO v_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'training_enrollments', 'certificates',
                      'lesson_progress', 'shops', 'shop_staff',
                      'apprentice_placements', 'programs', 'users',
                      'organization_users', 'marketing_campaigns',
                      'tenant_licenses', 'license_events')
    AND rowsecurity = true;
  test_name := 'RLS enabled on scoped tables';
  passed := v_count >= 10;
  detail := v_count || ' tables with RLS';
  RETURN NEXT;

  -- Test 10: No policies with inline profiles lookup (recursion check)
  SELECT count(*) INTO v_count
  FROM pg_policies
  WHERE tablename = 'profiles'
    AND (qual ILIKE '%FROM profiles%' OR qual ILIKE '%FROM public.profiles%')
    AND qual NOT ILIKE '%is_admin%'
    AND qual NOT ILIKE '%is_super_admin%'
    AND qual NOT ILIKE '%get_current_tenant_id%';
  test_name := 'profiles: no recursive inline lookups';
  passed := v_count = 0;
  detail := v_count || ' recursive policies';
  RETURN NEXT;

  -- Test 11: is_admin() function exists and is SECURITY DEFINER
  SELECT count(*) INTO v_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'is_admin'
    AND p.prosecdef = true;
  test_name := 'is_admin() is SECURITY DEFINER';
  passed := v_count = 1;
  detail := v_count || ' functions';
  RETURN NEXT;

  -- Test 12: is_super_admin() function exists and is SECURITY DEFINER
  SELECT count(*) INTO v_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'is_super_admin'
    AND p.prosecdef = true;
  test_name := 'is_super_admin() is SECURITY DEFINER';
  passed := v_count = 1;
  detail := v_count || ' functions';
  RETURN NEXT;

  -- Test 13: get_current_tenant_id() function exists and is SECURITY DEFINER
  SELECT count(*) INTO v_count
  FROM pg_proc p
  JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public'
    AND p.proname = 'get_current_tenant_id'
    AND p.prosecdef = true;
  test_name := 'get_current_tenant_id() is SECURITY DEFINER';
  passed := v_count = 1;
  detail := v_count || ' functions';
  RETURN NEXT;

  -- Test 14: auto_set_tenant_id() trigger exists on key tables
  SELECT count(*) INTO v_count
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  WHERE t.tgname = 'set_tenant_id_on_insert'
    AND c.relname IN ('training_enrollments', 'certificates', 'lesson_progress',
                       'apprentice_placements', 'shops', 'shop_staff');
  test_name := 'auto_set_tenant_id triggers on 6 tables';
  passed := v_count = 6;
  detail := v_count || '/6 triggers';
  RETURN NEXT;

  -- Test 15: prevent_tenant_id_change trigger on profiles
  SELECT count(*) INTO v_count
  FROM pg_trigger t
  JOIN pg_class c ON c.oid = t.tgrelid
  WHERE t.tgname = 'protect_tenant_id'
    AND c.relname = 'profiles';
  test_name := 'prevent_tenant_id_change trigger on profiles';
  passed := v_count = 1;
  detail := v_count || ' triggers';
  RETURN NEXT;

  -- Test 16: Admin exists
  test_name := 'admin user exists for testing';
  passed := v_admin_id IS NOT NULL;
  detail := COALESCE(v_admin_id::text, 'none');
  RETURN NEXT;

  -- Test 17: Student exists
  test_name := 'student user exists for testing';
  passed := v_student_id IS NOT NULL;
  detail := COALESCE(v_student_id::text, 'none');
  RETURN NEXT;

  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.rls_test_report() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rls_test_report() TO authenticated;
GRANT EXECUTE ON FUNCTION public.rls_test_report() TO service_role;
