-- 20260313000001_lockdown_program_completion_views.sql
-- Purpose:
-- Hardens internal completion-engine views flagged by Supabase Advisor.
-- Keeps internal computation intact while preventing direct client access.
-- Intended for LMS / compliance systems where these views are backend-only.
--
-- Dependency chain (verified 2025-03):
--   check_program_completion()  SECURITY DEFINER → reads program_completion_candidates
--   mark_program_completed()    SECURITY DEFINER → writes program_enrollments only
-- Both functions run as their definer, not the calling role.
-- Revoking authenticated/anon access to the views does NOT break these functions.
--
-- Client-side audit (verified 2025-03):
--   No .from('program_completion_candidates') or .from('program_course_activity')
--   anywhere in app/, components/, lib/, or hooks/.
--   Both views are accessed exclusively via check_program_completion RPC
--   using the admin/service-role client in lib/lms/completion-evaluator.ts.

begin;

-- 1. Revoke direct client access to both views
revoke all on public.program_completion_candidates from public;
revoke all on public.program_completion_candidates from anon;
revoke all on public.program_completion_candidates from authenticated;

revoke all on public.program_course_activity from public;
revoke all on public.program_course_activity from anon;
revoke all on public.program_course_activity from authenticated;

-- 2. Grant backend-only access via service_role
grant select on public.program_completion_candidates to service_role;
grant select on public.program_course_activity to service_role;

-- 3. Document intent for auditors and future developers
comment on view public.program_completion_candidates is
'Internal backend-only completion evaluation view. Direct client access prohibited. Readable only by service_role or privileged database roles.';

comment on view public.program_course_activity is
'Internal backend-only activity aggregation view used for program completion logic. Direct client access prohibited. Readable only by service_role or privileged database roles.';

-- 4. Lock completion functions to backend use only.
--    Both are SECURITY DEFINER and called only from server-side admin client.
revoke all on function public.check_program_completion(uuid, uuid) from public;
revoke all on function public.check_program_completion(uuid, uuid) from anon;
revoke all on function public.check_program_completion(uuid, uuid) from authenticated;
grant execute on function public.check_program_completion(uuid, uuid) to service_role;

revoke all on function public.mark_program_completed(uuid) from public;
revoke all on function public.mark_program_completed(uuid) from anon;
revoke all on function public.mark_program_completed(uuid) from authenticated;
grant execute on function public.mark_program_completed(uuid) to service_role;

-- 5. Belt-and-suspenders: confirm schema usage remains standard
grant usage on schema public to anon, authenticated, service_role;

commit;
