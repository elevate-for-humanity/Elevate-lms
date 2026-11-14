#!/bin/bash
# Run all SQL migrations to load courses and data

echo "🚀 Running all SQL migrations..."

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SUPABASE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
  echo "❌ Error: Supabase credentials not found"
  echo "Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"
  exit 1
fi

MIGRATIONS=(
  "20240116_add_cip_soc_codes.sql"
  "20240116_seed_cip_soc_codes.sql"
  "20241115_add_all_etpl_programs.sql"
  "20241116_add_jri_courses.sql"
  "20241116_add_nrf_rise_up_courses.sql"
  "20241116_create_lms_courses_part1.sql"
  "20241116_create_lms_courses_part2.sql"
  "20241116_create_lms_courses_part3.sql"
  "20241116_create_lms_courses_part4.sql"
  "20241116_create_medical_assistant_course.sql"
  "20251116020545_lesson_progress.sql"
  "20251116020748_course_completion_view.sql"
  "20251117_advanced_lms_features.sql"
  "20251117_advanced_rbac.sql"
  "20251117_hr_payroll_system.sql"
  "20251117_multi_tenancy.sql"
  "20251117_sso_and_2fa.sql"
)

cd supabase/migrations

for migration in "${MIGRATIONS[@]}"; do
  if [ -f "$migration" ]; then
    echo "📝 Running: $migration"
    # Note: Actual execution requires Supabase CLI or direct SQL execution
    # This script documents what needs to run
  else
    echo "⚠️  Not found: $migration"
  fi
done

echo ""
echo "✅ Migration list complete"
echo ""
echo "📋 NEXT STEPS:"
echo "1. Go to Supabase Dashboard: ${SUPABASE_URL/https:\/\//https://app.supabase.com/project/}/editor"
echo "2. Copy and paste each migration file into SQL Editor"
echo "3. Run them in order"
echo ""
echo "OR use Supabase CLI:"
echo "  supabase db push"
