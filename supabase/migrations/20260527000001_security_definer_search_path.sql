-- Security hardening: SECURITY DEFINER functions missing search_path
--
-- Risk: without a fixed search_path, a SECURITY DEFINER function can be
-- exploited via search_path injection — an attacker creates a shadow object
-- in a schema that appears before public, causing the function to call
-- attacker-controlled code with elevated privileges.
--
-- Fix: set search_path = public on all affected functions.
-- Additionally revoke anon EXECUTE on functions that have no legitimate
-- public/unauthenticated use case.
--
-- Applied: manually via Supabase Dashboard SQL Editor.

-- ── 1. Fix search_path on all 34 affected SECURITY DEFINER functions ─────────

ALTER FUNCTION public._tmp_get_triggers()
  SET search_path = public;

ALTER FUNCTION public.approve_application_and_grant_access_atomic(uuid, uuid, text)
  SET search_path = public;

ALTER FUNCTION public.approve_barber_practical(uuid, uuid)
  SET search_path = public;

ALTER FUNCTION public.archive_stale_applications(integer)
  SET search_path = public;

ALTER FUNCTION public.audit_enrollment_insert()
  SET search_path = public;

ALTER FUNCTION public.audit_trigger_fn()
  SET search_path = public;

ALTER FUNCTION public.auto_create_exam_authorization()
  SET search_path = public;

ALTER FUNCTION public.block_direct_enrollment_insert()
  SET search_path = public;

ALTER FUNCTION public.can_publish_course(uuid)
  SET search_path = public;

ALTER FUNCTION public.check_application_access_readiness(uuid)
  SET search_path = public;

ALTER FUNCTION public.cleanup_expired_ai_memory()
  SET search_path = public;

ALTER FUNCTION public.decrement_slot_booked_count(uuid)
  SET search_path = public;

ALTER FUNCTION public.devstudio_append_log(uuid, text[])
  SET search_path = public;

ALTER FUNCTION public.enforce_course_content_before_publish()
  SET search_path = public;

ALTER FUNCTION public.enroll_application(uuid, uuid)
  SET search_path = public;

ALTER FUNCTION public.enroll_application(uuid, uuid, text)
  SET search_path = public;

ALTER FUNCTION public.escalate_funding_verification_sla()
  SET search_path = public;

ALTER FUNCTION public.escalate_overdue_funding_verifications()
  SET search_path = public;

ALTER FUNCTION public.evaluate_exam_readiness(uuid, uuid)
  SET search_path = public;

ALTER FUNCTION public.get_revenue_all_time()
  SET search_path = public;

ALTER FUNCTION public.get_revenue_last_month()
  SET search_path = public;

ALTER FUNCTION public.increment_slot_booked_count(uuid)
  SET search_path = public;

ALTER FUNCTION public.is_admin_role()
  SET search_path = public;

ALTER FUNCTION public.is_program_completion_eligible(uuid, uuid)
  SET search_path = public;

ALTER FUNCTION public.maybe_issue_certificate_after_checkpoint_score()
  SET search_path = public;

ALTER FUNCTION public.maybe_issue_certificate_after_lesson_progress()
  SET search_path = public;

ALTER FUNCTION public.my_tenant_id()
  SET search_path = public;

ALTER FUNCTION public.revoke_application_access_atomic(uuid, uuid, text)
  SET search_path = public;

ALTER FUNCTION public.rpc_enroll_student(uuid, uuid, text, text, jsonb)
  SET search_path = public;

ALTER FUNCTION public.snapshot_course_version(uuid, uuid, text)
  SET search_path = public;

ALTER FUNCTION public.sync_progress_to_hour_entries()
  SET search_path = public;

ALTER FUNCTION public.upsert_stripe_session(text, text, text, integer, text, timestamptz, text, text, text, text, text, jsonb)
  SET search_path = public;

ALTER FUNCTION public.wioa_summary_metrics(date, date, uuid, text)
  SET search_path = public;

-- submit_program_holder_application — non-anon, fix search_path only
ALTER FUNCTION public.submit_program_holder_application(text, text, text, text, text, uuid, text, text, text, text, text, text, text)
  SET search_path = public;


-- ── 2. Revoke PUBLIC EXECUTE and re-grant to appropriate roles ───────────────
-- Supabase auto-grants EXECUTE to PUBLIC on all functions in public schema.
-- REVOKE FROM anon is insufficient — must REVOKE FROM PUBLIC, then re-grant
-- to authenticated/service_role as appropriate.

-- Second overload of approve_application_and_grant_access_atomic
ALTER FUNCTION public.approve_application_and_grant_access_atomic(uuid, text)
  SET search_path = public;

-- ── 2a. Revoke PUBLIC EXECUTE ─────────────────────────────────────────────────
-- These are admin/internal operations that should never be callable by
-- unauthenticated users. RLS alone is not sufficient when SECURITY DEFINER
-- bypasses row-level policies.

-- Admin/internal — service_role only
REVOKE EXECUTE ON FUNCTION public.archive_stale_applications(integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.escalate_funding_verification_sla() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.escalate_overdue_funding_verifications() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.devstudio_append_log(uuid, text[]) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.snapshot_course_version(uuid, uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_ai_memory() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_revenue_all_time() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_revenue_last_month() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public._tmp_get_triggers() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.maybe_issue_certificate_after_checkpoint_score() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.maybe_issue_certificate_after_lesson_progress() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.sync_progress_to_hour_entries() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.auto_create_exam_authorization() FROM PUBLIC;

-- Enrollment/application — authenticated + service_role
REVOKE EXECUTE ON FUNCTION public.enroll_application(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enroll_application(uuid, uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rpc_enroll_student(uuid, uuid, text, text, jsonb) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.approve_application_and_grant_access_atomic(uuid, uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.approve_application_and_grant_access_atomic(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.revoke_application_access_atomic(uuid, uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.approve_barber_practical(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.check_application_access_readiness(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.evaluate_exam_readiness(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_program_completion_eligible(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.wioa_summary_metrics(date, date, uuid, text) FROM PUBLIC;

-- Payment
REVOKE EXECUTE ON FUNCTION public.upsert_stripe_session(text, text, text, integer, text, timestamptz, text, text, text, text, text, jsonb) FROM PUBLIC;

-- Course/content
REVOKE EXECUTE ON FUNCTION public.can_publish_course(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.enforce_course_content_before_publish() FROM PUBLIC;

-- Slot management
REVOKE EXECUTE ON FUNCTION public.increment_slot_booked_count(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.decrement_slot_booked_count(uuid) FROM PUBLIC;

-- ── 2b. Re-grant to appropriate roles ────────────────────────────────────────

-- Authenticated users + service_role (user-callable RPCs)
GRANT EXECUTE ON FUNCTION public.enroll_application(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.enroll_application(uuid, uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_enroll_student(uuid, uuid, text, text, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.approve_application_and_grant_access_atomic(uuid, uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.approve_application_and_grant_access_atomic(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.revoke_application_access_atomic(uuid, uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.approve_barber_practical(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_application_access_readiness(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.evaluate_exam_readiness(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_program_completion_eligible(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.upsert_stripe_session(text, text, text, integer, text, timestamptz, text, text, text, text, text, jsonb) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_publish_course(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.increment_slot_booked_count(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.decrement_slot_booked_count(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.wioa_summary_metrics(date, date, uuid, text) TO authenticated, service_role;

-- Service_role only (admin/internal/cron)
GRANT EXECUTE ON FUNCTION public.archive_stale_applications(integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.escalate_funding_verification_sla() TO service_role;
GRANT EXECUTE ON FUNCTION public.escalate_overdue_funding_verifications() TO service_role;
GRANT EXECUTE ON FUNCTION public.devstudio_append_log(uuid, text[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.snapshot_course_version(uuid, uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_ai_memory() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_revenue_all_time() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_revenue_last_month() TO service_role;
GRANT EXECUTE ON FUNCTION public.maybe_issue_certificate_after_checkpoint_score() TO service_role;
GRANT EXECUTE ON FUNCTION public.maybe_issue_certificate_after_lesson_progress() TO service_role;
GRANT EXECUTE ON FUNCTION public.sync_progress_to_hour_entries() TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_create_exam_authorization() TO service_role;

-- Keep PUBLIC access on (used by RLS policies — must be callable by all roles):
--   is_admin_role()
--   my_tenant_id()
--   audit_trigger_fn(), audit_enrollment_insert(), block_direct_enrollment_insert() — DB triggers
