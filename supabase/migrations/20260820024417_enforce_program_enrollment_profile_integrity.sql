-- Enforce canonical learner identity references for program enrollments.
-- Production was reconciled before this constraint was applied: dangling
-- profile references were audit-logged, revoked, and cleared rather than
-- replaced with fabricated identities.

ALTER TABLE public.program_enrollments
  ADD CONSTRAINT program_enrollments_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;

ALTER TABLE public.program_enrollments
  ADD CONSTRAINT program_enrollments_student_id_profiles_fkey
  FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE RESTRICT;
