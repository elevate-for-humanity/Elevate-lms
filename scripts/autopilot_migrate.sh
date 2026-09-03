#!/usr/bin/env bash
set -euo pipefail

DB_URL="${1:-}"
if [[ -z "${DB_URL}" ]]; then
  echo "Usage: $0 POSTGRES_DB_URL"
  echo ""
  echo "Example:"
  echo "  $0 'postgres://postgres:PASSWORD@db.cuxzzpsyufcewtmicszk.supabase.co:5432/postgres'"
  exit 1
fi

MIG_DIR="supabase/migrations"
ORDER=(
  "001_lms_schema.sql"
  "002_auth_instructor_certificates.sql"
  "003_analytics_events.sql"
  "004_add_missing_rls_policies.sql"
  "004_analytics_rls.sql"
  "20250127_create_automation_tables.sql"
  "20250127_create_generated_content.sql"
  "20250127_create_scholarship_applications.sql"
  "20250127_create_stripe_split_tables.sql"
)

echo "==> Applying migrations to ${DB_URL%%@*}@****** ..."
for f in "${ORDER[@]}"; do
  path="${MIG_DIR}/${f}"
  if [[ ! -f "${path}" ]]; then
    echo "ERROR: Migration file not found: ${path}"
    exit 1
  fi
  echo "-- Running ${path}"
  psql "${DB_URL}" -v ON_ERROR_STOP=1 -f "${path}"
done

echo ""
echo "==> Verifying schema objects exist..."
psql "${DB_URL}" -v ON_ERROR_STOP=1 <<'SQL'
-- Core tables verification
DO $$
DECLARE
  missing_count int := 0;
  obj_name text;
BEGIN
  -- Check core LMS tables
  IF to_regclass('programs') IS NULL THEN
    RAISE WARNING 'Missing table: programs';
    missing_count := missing_count + 1;
  END IF;
  
  IF to_regclass('courses') IS NULL THEN
    RAISE WARNING 'Missing table: courses';
    missing_count := missing_count + 1;
  END IF;
  
  IF to_regclass('lessons') IS NULL THEN
    RAISE WARNING 'Missing table: lessons';
    missing_count := missing_count + 1;
  END IF;
  
  IF to_regclass('enrollments') IS NULL THEN
    RAISE WARNING 'Missing table: enrollments';
    missing_count := missing_count + 1;
  END IF;
  
  IF to_regclass('lesson_progress') IS NULL THEN
    RAISE WARNING 'Missing table: lesson_progress';
    missing_count := missing_count + 1;
  END IF;
  
  IF to_regclass('certificates') IS NULL THEN
    RAISE WARNING 'Missing table: certificates';
    missing_count := missing_count + 1;
  END IF;
  
  -- Check auth tables
  IF to_regclass('instructor_certificates') IS NULL THEN
    RAISE WARNING 'Missing table: instructor_certificates';
    missing_count := missing_count + 1;
  END IF;
  
  -- Check analytics tables
  IF to_regclass('analytics_events') IS NULL THEN
    RAISE WARNING 'Missing table: analytics_events';
    missing_count := missing_count + 1;
  END IF;
  
  IF to_regclass('page_views') IS NULL THEN
    RAISE WARNING 'Missing table: page_views';
    missing_count := missing_count + 1;
  END IF;
  
  -- Check automation tables
  IF to_regclass('automation_workflows') IS NULL THEN
    RAISE WARNING 'Missing table: automation_workflows';
    missing_count := missing_count + 1;
  END IF;
  
  IF to_regclass('automation_executions') IS NULL THEN
    RAISE WARNING 'Missing table: automation_executions';
    missing_count := missing_count + 1;
  END IF;
  
  -- Check content tables
  IF to_regclass('generated_content') IS NULL THEN
    RAISE WARNING 'Missing table: generated_content';
    missing_count := missing_count + 1;
  END IF;
  
  -- Check scholarship tables
  IF to_regclass('scholarship_applications') IS NULL THEN
    RAISE WARNING 'Missing table: scholarship_applications';
    missing_count := missing_count + 1;
  END IF;
  
  IF to_regclass('scholarship_reviews') IS NULL THEN
    RAISE WARNING 'Missing table: scholarship_reviews';
    missing_count := missing_count + 1;
  END IF;
  
  -- Check payment tables
  IF to_regclass('stripe_accounts') IS NULL THEN
    RAISE WARNING 'Missing table: stripe_accounts';
    missing_count := missing_count + 1;
  END IF;
  
  IF to_regclass('stripe_splits') IS NULL THEN
    RAISE WARNING 'Missing table: stripe_splits';
    missing_count := missing_count + 1;
  END IF;
  
  IF missing_count > 0 THEN
    RAISE EXCEPTION 'Schema validation failed: % table(s) missing', missing_count;
  ELSE
    RAISE NOTICE '✅ All 16 tables exist';
  END IF;
END$$;

-- Check RLS enabled flags
SELECT 
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'programs', 'courses', 'lessons', 'enrollments', 'lesson_progress', 'certificates',
    'instructor_certificates', 'analytics_events', 'page_views',
    'automation_workflows', 'automation_executions', 'generated_content',
    'scholarship_applications', 'scholarship_reviews',
    'stripe_accounts', 'stripe_splits'
  )
ORDER BY tablename;

-- Count RLS policies
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;
SQL

echo ""
echo "==> ✅ Migration complete! All tables verified."
echo ""
echo "Next steps:"
echo "  1. Check Supabase dashboard: https://supabase.com/dashboard/project/cuxzzpsyufcewtmicszk/editor"
echo "  2. Add your first course: see QUICK_START_ADD_COURSE.md"
echo "  3. Test enrollment: go to /programs on your site"
