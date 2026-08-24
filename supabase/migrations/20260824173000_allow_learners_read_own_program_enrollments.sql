-- Keep learner-owned reads available without weakening the privileged-write
-- policies installed by the platform MFA hardening migrations. Those policies
-- intentionally call security_private.privileged_session_mfa_satisfied(); this
-- migration owns only the learner SELECT policy.
DROP POLICY IF EXISTS program_enrollments_owner_read ON public.program_enrollments;
CREATE POLICY program_enrollments_owner_read
ON public.program_enrollments
FOR SELECT
TO authenticated
USING ((SELECT auth.uid()) = COALESCE(user_id, student_id));
