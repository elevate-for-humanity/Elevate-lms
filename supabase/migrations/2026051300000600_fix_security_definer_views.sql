-- Migration: fix_security_definer_views
-- Resolves Supabase security linter ERROR: security_definer_view
--
-- All 6 views below were flagged as SECURITY DEFINER, meaning they execute
-- with the view creator's privileges instead of the querying user's RLS.
-- Fix: set security_invoker = true so RLS of the querying user is enforced.
--
-- Requires PostgreSQL 15+ (Supabase default). No view logic is changed.

ALTER VIEW public.lms_lessons                  SET (security_invoker = true);
ALTER VIEW public.exam_ready_status            SET (security_invoker = true);
ALTER VIEW public.exam_outcome_tracking        SET (security_invoker = true);
ALTER VIEW public.learner_exam_readiness_detail SET (security_invoker = true);
ALTER VIEW public.student_hour_summary         SET (security_invoker = true);
ALTER VIEW public.apprentice_hour_summary      SET (security_invoker = true);
