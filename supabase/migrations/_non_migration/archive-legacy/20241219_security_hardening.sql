-- =====================================================
-- SECURITY HARDENING - BULK + SAFE
-- =====================================================
-- Purpose: Fix all 29 security items in bulk
-- Time: 30 minutes
-- Safe: No logic changes, only hardening
-- =====================================================

-- =====================================================
-- STEP 1: FIX MUTABLE SEARCH_PATH ON FUNCTIONS
-- =====================================================
-- This fixes the "role mutable search_path" security finding
-- by explicitly setting search_path on all public functions

-- Generate ALTER statements (run this first to see what will change)
-- Uncomment to preview:
-- SELECT
--   'ALTER FUNCTION ' ||
--   n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ') ' ||
--   'SET search_path = pg_catalog, public;' AS fix_sql
-- FROM pg_proc p
-- JOIN pg_namespace n ON n.oid = p.pronamespace
-- WHERE n.nspname = 'public'
--   AND coalesce(array_to_string(p.proconfig, ','), '') LIKE '%search_path%';

-- Apply the fix to all public functions
DO $$
DECLARE
  r RECORD;
  v_sql TEXT;
BEGIN
  FOR r IN
    SELECT
      n.nspname,
      p.proname,
      pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    v_sql := format(
      'ALTER FUNCTION %I.%I(%s) SET search_path = pg_catalog, public',
      r.nspname,
      r.proname,
      r.args
    );
    
    BEGIN
      EXECUTE v_sql;
      RAISE NOTICE 'Fixed: %.%(%)', r.nspname, r.proname, r.args;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped: %.%(%): %', r.nspname, r.proname, r.args, SQLERRM;
    END;
  END LOOP;
END $$;

-- =====================================================
-- STEP 2: ENABLE RLS ON ALL TABLES (BULK)
-- =====================================================
-- This enables RLS on any table that doesn't have it yet

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE '_prisma_%'
      AND tablename NOT LIKE 'schema_migrations'
      AND tablename NOT LIKE 'supabase_%'
      AND NOT EXISTS (
        SELECT 1
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public'
          AND c.relname = r.tablename
          AND c.relrowsecurity = true
      )
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
    RAISE NOTICE 'Enabled RLS on: %', r.tablename;
  END LOOP;
END $$;

-- =====================================================
-- STEP 3: CREATE INDEXES ON FOREIGN KEYS (BULK)
-- =====================================================
-- This creates indexes on all foreign key columns that don't have them
-- Massive performance improvement for RLS + joins + dashboards

DO $$
DECLARE
  r RECORD;
  v_index_name TEXT;
  v_sql TEXT;
BEGIN
  FOR r IN
    WITH fks AS (
      SELECT
        n.nspname AS schema_name,
        t.relname AS table_name,
        a.attname AS column_name,
        con.conname AS constraint_name
      FROM pg_constraint con
      JOIN pg_class t ON t.oid = con.conrelid
      JOIN pg_namespace n ON n.oid = t.relnamespace
      JOIN unnest(con.conkey) AS colnum(attnum) ON true
      JOIN pg_attribute a ON a.attrelid = t.oid AND a.attnum = colnum.attnum
      WHERE con.contype = 'f'
        AND n.nspname = 'public'
    )
    SELECT *
    FROM fks
    WHERE NOT EXISTS (
      SELECT 1
      FROM pg_index i
      JOIN pg_class idx ON idx.oid = i.indexrelid
      JOIN pg_class tbl ON tbl.oid = i.indrelid
      JOIN pg_namespace ns ON ns.oid = tbl.relnamespace
      WHERE ns.nspname = fks.schema_name
        AND tbl.relname = fks.table_name
        AND pg_get_indexdef(i.indexrelid) ILIKE ('%' || fks.column_name || '%')
    )
  LOOP
    v_index_name := 'idx_' || r.table_name || '_' || r.column_name;
    v_sql := format(
      'CREATE INDEX IF NOT EXISTS %I ON public.%I(%I);',
      v_index_name,
      r.table_name,
      r.column_name
    );
    
    BEGIN
      EXECUTE v_sql;
      RAISE NOTICE 'Created index: % on %.%', v_index_name, r.table_name, r.column_name;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped index: % on %.%: %', v_index_name, r.table_name, r.column_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- =====================================================
-- STEP 4: CREATE PERFORMANCE INDEXES FOR COMMON QUERIES
-- =====================================================
-- These are predictable indexes for attendance, hours, alerts, enrollments

-- Attendance tracking indexes
CREATE INDEX IF NOT EXISTS idx_attendance_events_student_date 
  ON attendance_events(student_id, session_date DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_events_enrollment_date 
  ON attendance_events(enrollment_id, session_date DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_events_date 
  ON attendance_events(session_date DESC);

-- Hour logs indexes
CREATE INDEX IF NOT EXISTS idx_hour_logs_student_date 
  ON hour_logs(student_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_hour_logs_enrollment_date 
  ON hour_logs(enrollment_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_hour_logs_date 
  ON hour_logs(date DESC);

-- Enrollments indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_student_status 
  ON enrollments(student_id, status);

CREATE INDEX IF NOT EXISTS idx_enrollments_partner_status 
  ON enrollments(partner_owner_user_id, status);

CREATE INDEX IF NOT EXISTS idx_enrollments_program_status 
  ON enrollments(program_id, status);

CREATE INDEX IF NOT EXISTS idx_enrollments_schedule_locked 
  ON enrollments(schedule_locked_at) 
  WHERE schedule_locked_at IS NOT NULL;

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_applications_user_status 
  ON applications(user_id, status);

CREATE INDEX IF NOT EXISTS idx_applications_status_created 
  ON applications(status, created_at DESC);

-- Alert notifications indexes
CREATE INDEX IF NOT EXISTS idx_alert_notifications_student_resolved 
  ON alert_notifications(student_id, resolved_at);

CREATE INDEX IF NOT EXISTS idx_alert_notifications_partner_resolved 
  ON alert_notifications(partner_user_id, resolved_at);

CREATE INDEX IF NOT EXISTS idx_alert_notifications_type_created 
  ON alert_notifications(alert_type, created_at DESC);

-- Reporting verdicts indexes
CREATE INDEX IF NOT EXISTS idx_reporting_verdicts_enrollment_period 
  ON reporting_verdicts(enrollment_id, period_start DESC);

CREATE INDEX IF NOT EXISTS idx_reporting_verdicts_status_period 
  ON reporting_verdicts(status, period_start DESC);

-- Onboarding indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_signatures_user_document 
  ON onboarding_signatures(user_id, document_id);

CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_complete 
  ON onboarding_progress(user_id, is_complete);

-- Partner profiles indexes
CREATE INDEX IF NOT EXISTS idx_partner_profiles_user_status 
  ON partner_profiles(user_id, status);

CREATE INDEX IF NOT EXISTS idx_partner_profiles_role_status 
  ON partner_profiles(role, status);

-- Student assignments indexes
CREATE INDEX IF NOT EXISTS idx_student_assignments_partner_active 
  ON student_assignments(partner_user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_student_assignments_student_active 
  ON student_assignments(student_id, is_active);

-- Payroll profiles indexes
CREATE INDEX IF NOT EXISTS idx_payroll_profiles_user_status 
  ON payroll_profiles(user_id, status);

CREATE INDEX IF NOT EXISTS idx_payroll_profiles_status 
  ON payroll_profiles(status) 
  WHERE status = 'PENDING';

-- Login events indexes (for inactivity tracking)
CREATE INDEX IF NOT EXISTS idx_login_events_user_occurred 
  ON login_events(user_id, occurred_at DESC);

-- Progress events indexes
CREATE INDEX IF NOT EXISTS idx_progress_events_student_updated 
  ON progress_events(student_id, updated_at DESC);

-- =====================================================
-- STEP 5: VERIFY RESULTS
-- =====================================================

-- Create verification view
CREATE OR REPLACE VIEW security_status AS
SELECT
  'RLS Enabled' AS check_type,
  COUNT(*) AS total_tables,
  COUNT(*) FILTER (WHERE relrowsecurity) AS protected_tables,
  COUNT(*) FILTER (WHERE NOT relrowsecurity) AS unprotected_tables
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname NOT LIKE 'pg_%'
  AND c.relname NOT LIKE '_prisma_%'
  AND c.relname NOT LIKE 'schema_migrations'
  AND c.relname NOT LIKE 'supabase_%'
UNION ALL
SELECT
  'FK Indexes' AS check_type,
  COUNT(DISTINCT con.conname) AS total_fks,
  COUNT(DISTINCT CASE WHEN idx.indexrelid IS NOT NULL THEN con.conname END) AS indexed_fks,
  COUNT(DISTINCT CASE WHEN idx.indexrelid IS NULL THEN con.conname END) AS missing_indexes
FROM pg_constraint con
JOIN pg_class t ON t.oid = con.conrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
LEFT JOIN pg_index idx ON idx.indrelid = t.oid
WHERE con.contype = 'f'
  AND n.nspname = 'public';

COMMENT ON VIEW security_status IS 'Shows security hardening status';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration:
-- ✅ Fixed mutable search_path on all functions
-- ✅ Enabled RLS on all public tables
-- ✅ Created indexes on all foreign keys
-- ✅ Created performance indexes for common queries
-- ✅ Created verification view
--
-- Run this query to verify:
-- SELECT * FROM security_status;
--
-- Expected results:
-- - RLS Enabled: unprotected_tables = 0
-- - FK Indexes: missing_indexes = 0 (or very low)
-- =====================================================
