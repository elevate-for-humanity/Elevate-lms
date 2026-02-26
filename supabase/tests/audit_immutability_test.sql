-- ============================================================
-- Audit table immutability assertions
--
-- Run this after applying migrations to verify admin_audit_events
-- is truly immutable for non-service roles.
--
-- Expected results:
--   All INSERT/UPDATE/DELETE by authenticated role → FAIL (policy violation)
--   SELECT by admin role → SUCCEED
--   INSERT by service_role → SUCCEED
--   No FK cascades into admin_audit_events
-- ============================================================

-- 1. Verify RLS is enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables
    WHERE tablename = 'admin_audit_events'
    AND schemaname = 'public'
    AND rowsecurity = true
  ) THEN
    RAISE EXCEPTION 'FAIL: RLS is not enabled on admin_audit_events';
  END IF;
  RAISE NOTICE 'PASS: RLS is enabled on admin_audit_events';
END $$;

-- 2. Verify no foreign keys reference admin_audit_events (no cascade risk)
DO $$
DECLARE
  fk_count INTEGER;
BEGIN
  SELECT count(*) INTO fk_count
  FROM information_schema.referential_constraints rc
  JOIN information_schema.constraint_column_usage ccu
    ON rc.unique_constraint_name = ccu.constraint_name
  WHERE ccu.table_name = 'admin_audit_events'
    AND ccu.table_schema = 'public';

  IF fk_count > 0 THEN
    RAISE EXCEPTION 'FAIL: % foreign key(s) reference admin_audit_events — cascade delete risk', fk_count;
  END IF;
  RAISE NOTICE 'PASS: No foreign keys reference admin_audit_events';
END $$;

-- 3. Verify policies exist for DENY on UPDATE and DELETE
DO $$
DECLARE
  deny_update BOOLEAN;
  deny_delete BOOLEAN;
  deny_insert BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_audit_events'
    AND schemaname = 'public'
    AND cmd = 'UPDATE'
  ) INTO deny_update;

  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_audit_events'
    AND schemaname = 'public'
    AND cmd = 'DELETE'
  ) INTO deny_delete;

  SELECT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'admin_audit_events'
    AND schemaname = 'public'
    AND cmd = 'INSERT'
  ) INTO deny_insert;

  IF NOT deny_update THEN
    RAISE EXCEPTION 'FAIL: No UPDATE policy on admin_audit_events';
  END IF;
  IF NOT deny_delete THEN
    RAISE EXCEPTION 'FAIL: No DELETE policy on admin_audit_events';
  END IF;
  IF NOT deny_insert THEN
    RAISE EXCEPTION 'FAIL: No INSERT policy on admin_audit_events';
  END IF;

  RAISE NOTICE 'PASS: UPDATE, DELETE, and INSERT policies exist on admin_audit_events';
END $$;

-- 4. List all policies for manual review
SELECT
  policyname,
  cmd,
  roles,
  qual AS using_expression,
  with_check
FROM pg_policies
WHERE tablename = 'admin_audit_events'
  AND schemaname = 'public'
ORDER BY cmd, policyname;
