-- =============================================================================
-- Elevate LMS — Pending dashboard migrations (manual apply)
-- =============================================================================
-- Run in Supabase Dashboard → SQL Editor in this order.
-- Each file is idempotent unless noted. Re-running is safe for items marked idempotent.
--
-- 1. Core LMS gating (if not already applied)
--    supabase/migrations/20260327000003_checkpoint_gating.sql
-- 2. Step submission review columns
--    supabase/migrations/20260601000006_step_submissions_review_columns.sql
-- 3. July 2026 hardening batch (apply 01 → 14 in numeric order)
--    supabase/migrations/20260702000001_rls_and_security_hardening.sql
--    … through …
--    supabase/migrations/20260702000014_testing_center.sql
-- 4. Learner-scoped checkpoint RPC (after checkpoint_gating)
--    supabase/migrations/20260530100001_lms_checkpoint_certificate_rpc.sql
--
-- Quick verify after apply:
--   SELECT tablename FROM pg_tables WHERE schemaname = 'public'
--     AND tablename IN ('checkpoint_scores', 'step_submissions', 'two_factor_auth');
--   SELECT proname FROM pg_proc WHERE proname = 'record_checkpoint_attempt';
-- =============================================================================

-- Paste each migration file body below OR run files one-by-one from the repo.
-- This stub intentionally does not concatenate SQL to avoid duplicate DDL on re-apply.

SELECT 'Run migration files from supabase/migrations/ in the order listed in the header.' AS instruction;
