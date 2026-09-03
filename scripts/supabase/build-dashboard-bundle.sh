#!/usr/bin/env bash
# build-dashboard-bundle.sh
#
# Concatenates the pending migration files listed below into a single SQL
# bundle suitable for pasting into the Supabase Dashboard SQL Editor.
#
# Usage:
#   bash scripts/supabase/build-dashboard-bundle.sh > scripts/supabase/ELEVATE_PENDING_MIGRATIONS.sql
#
# After applying, verify with:
#   SELECT proname FROM pg_proc WHERE proname = 'record_checkpoint_attempt';
#   SELECT column_name FROM information_schema.columns
#     WHERE table_schema = 'public' AND table_name = 'two_factor_auth'
#       AND column_name IN ('enabled', 'is_enabled');
#   SELECT conname FROM pg_constraint
#     WHERE conrelid = 'public.onboarding_progress'::regclass
#       AND conname = 'onboarding_progress_user_step_unique';
#   SELECT tablename FROM pg_tables
#     WHERE schemaname = 'public'
#       AND tablename IN ('checkpoint_scores', 'step_submissions', 'program_completion_certificates');

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
MIGRATIONS_DIR="$REPO_ROOT/supabase/migrations"

# Ordered list of pending migrations to bundle.
# 20260530100001 must run after 20260327000003 (checkpoint_scores table).
PENDING=(
  "20260601000006_step_submissions_review_columns.sql"
  "20260702000001_rls_and_security_hardening.sql"
  "20260702000002_store_products_product_id.sql"
  "20260702000003_store_products_stripe_id.sql"
  "20260702000004_course_pipeline_drafts.sql"
  "20260702000005_ai_memory_ttl.sql"
  "20260702000006_guardrail_enforcement_log.sql"
  "20260702000007_courses_course_code.sql"
  "20260702000008_ai_conversation_memory.sql"
  "20260702000009_normalize_two_factor_auth.sql"
  "20260702000010_onboarding_progress_unique.sql"
  "20260702000011_ensure_storage_buckets.sql"
  "20260702000012_external_courses_support_fee.sql"
  "20260702000013_workflow_engine.sql"
  "20260702000014_testing_center.sql"
  "20260530100001_lms_checkpoint_certificate_rpc.sql"
)

echo "-- ============================================================"
echo "-- ELEVATE PENDING MIGRATIONS BUNDLE"
echo "-- Generated: $(date -u '+%Y-%m-%dT%H:%M:%SZ')"
echo "-- Project:   cuxzzpsyufcewtmicszk"
echo "-- Run on:    Supabase Dashboard → SQL Editor"
echo "-- ============================================================"
echo ""

for file in "${PENDING[@]}"; do
  path="$MIGRATIONS_DIR/$file"
  if [[ ! -f "$path" ]]; then
    echo "-- WARNING: $file not found — skipping" >&2
    continue
  fi
  echo "-- ────────────────────────────────────────────────────────────"
  echo "-- $file"
  echo "-- ────────────────────────────────────────────────────────────"
  cat "$path"
  echo ""
done
