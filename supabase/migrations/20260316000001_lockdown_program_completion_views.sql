-- 20260316000001_lockdown_program_completion_views.sql
-- Purpose:
-- Hardens internal completion-engine views flagged by Supabase Advisor.
-- Keeps internal computation intact while preventing direct client access.
-- Intended for LMS / compliance systems where these views are backend-only.
--
-- Safety verified before applying:
--   - No client-side code queries either view directly.
--   - completion-evaluator.ts calls check_program_completion() via
--     createAdminClient (service_role) — never touches views from browser.
--   - Both functions are SECURITY DEFINER — they run as the function owner,
--     so revoking view access from authenticated has no effect on them.
--   - check_program_completion and mark_program_completed already grant
--     EXECUTE only to service_role in the original migration.

BEGIN;

-- ── 1. Revoke direct client access to both views ─────────────────────────────

REVOKE ALL ON public.program_completion_candidates FROM public;
REVOKE ALL ON public.program_completion_candidates FROM anon;
REVOKE ALL ON public.program_completion_candidates FROM authenticated;

REVOKE ALL ON public.program_course_activity FROM public;
REVOKE ALL ON public.program_course_activity FROM anon;
REVOKE ALL ON public.program_course_activity FROM authenticated;

-- ── 2. Grant backend-only access ─────────────────────────────────────────────

GRANT SELECT ON public.program_completion_candidates TO service_role;
GRANT SELECT ON public.program_course_activity TO service_role;

-- ── 3. Document intent for auditors and future reviewers ─────────────────────

COMMENT ON VIEW public.program_completion_candidates IS
'Internal backend-only completion evaluation view. Direct client access prohibited. '
'Readable only by service_role or privileged database roles. '
'Consumed exclusively by check_program_completion() (SECURITY DEFINER).';

COMMENT ON VIEW public.program_course_activity IS
'Internal backend-only activity aggregation view used for program completion logic. '
'Direct client access prohibited. Readable only by service_role or privileged database roles. '
'Consumed by program_completion_candidates and check_program_completion().';

-- ── 4. Belt-and-suspenders: lock completion functions to backend-only ─────────
-- Both functions are already SECURITY DEFINER and only grant EXECUTE to
-- service_role in the original migration. These revokes make that explicit
-- and prevent any future grant from accidentally re-opening client access.

REVOKE ALL ON FUNCTION public.check_program_completion(UUID, UUID) FROM public;
REVOKE ALL ON FUNCTION public.check_program_completion(UUID, UUID) FROM anon;
REVOKE ALL ON FUNCTION public.check_program_completion(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_program_completion(UUID, UUID) TO service_role;

REVOKE ALL ON FUNCTION public.mark_program_completed(UUID) FROM public;
REVOKE ALL ON FUNCTION public.mark_program_completed(UUID) FROM anon;
REVOKE ALL ON FUNCTION public.mark_program_completed(UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.mark_program_completed(UUID) TO service_role;

-- ── 5. Confirm schema usage remains standard ──────────────────────────────────

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

COMMIT;
