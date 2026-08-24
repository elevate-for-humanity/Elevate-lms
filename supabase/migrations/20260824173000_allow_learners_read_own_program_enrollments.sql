-- Keep learner-owned reads available while requiring MFA for privileged writes.
DROP POLICY IF EXISTS require_privileged_aal2 ON public.program_enrollments;
DROP POLICY IF EXISTS program_enrollments_owner_read ON public.program_enrollments;
CREATE POLICY program_enrollments_owner_read
ON public.program_enrollments
FOR SELECT
TO authenticated
USING (auth.uid() = COALESCE(user_id, student_id));

DROP POLICY IF EXISTS require_privileged_aal2_insert ON public.program_enrollments;
CREATE POLICY require_privileged_aal2_insert
AS RESTRICTIVE ON public.program_enrollments
FOR INSERT TO authenticated
WITH CHECK ((auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS require_privileged_aal2_update ON public.program_enrollments;
CREATE POLICY require_privileged_aal2_update
AS RESTRICTIVE ON public.program_enrollments
FOR UPDATE TO authenticated
USING ((auth.jwt() ->> 'aal') = 'aal2')
WITH CHECK ((auth.jwt() ->> 'aal') = 'aal2');

DROP POLICY IF EXISTS require_privileged_aal2_delete ON public.program_enrollments;
CREATE POLICY require_privileged_aal2_delete
AS RESTRICTIVE ON public.program_enrollments
FOR DELETE TO authenticated
USING ((auth.jwt() ->> 'aal') = 'aal2');
