-- Remove catch-all reads that override tenant-scoped policies through OR semantics.
-- Existing holder, learner, staff and Admin policies remain in place.
-- The restrictive privileged-session MFA policies are unchanged.
DROP POLICY IF EXISTS auth_read_program_holders ON public.program_holders;
DROP POLICY IF EXISTS auth_read_program_holder_students ON public.program_holder_students;
