-- Allow authenticated learners to load only their own onboarding checklist.
-- The previous authenticated SELECT policy used USING (true), which was overly broad,
-- while the table itself had no authenticated SELECT grant.

DROP POLICY IF EXISTS auth_read_student_onboarding
  ON public.student_onboarding;

DROP POLICY IF EXISTS users_read_own_student_onboarding
  ON public.student_onboarding;

CREATE POLICY users_read_own_student_onboarding
  ON public.student_onboarding
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = student_id);

GRANT SELECT ON TABLE public.student_onboarding TO authenticated;
