-- Keep the existing uniqueness guarantee for active applications while
-- allowing a new submission after a withdrawal or duplicate disposition.
CREATE UNIQUE INDEX unique_active_applicant_per_program
  ON public.applications (normalized_email, program_id)
  WHERE program_id IS NOT NULL
    AND status NOT IN ('rejected', 'waitlisted', 'withdrawn', 'duplicate');

DROP INDEX public.unique_applicant_per_program;
ALTER INDEX public.unique_active_applicant_per_program RENAME TO unique_applicant_per_program;
