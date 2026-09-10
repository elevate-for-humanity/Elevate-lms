ALTER TABLE public.program_enrollments DROP CONSTRAINT IF EXISTS program_enrollments_employer_id_fkey;
ALTER TABLE public.program_enrollments ADD CONSTRAINT program_enrollments_employer_id_fkey FOREIGN KEY (employer_id) REFERENCES public.employers(id) ON DELETE SET NULL;
ALTER TABLE public.apprentice_notifications DROP CONSTRAINT IF EXISTS apprentice_notifications_apprenticeship_id_fkey;
ALTER TABLE public.apprentice_notifications ADD CONSTRAINT apprentice_notifications_apprenticeship_id_fkey FOREIGN KEY (apprenticeship_id) REFERENCES public.program_enrollments(id) ON DELETE CASCADE;
ALTER TABLE public.ojt_hours_log DROP CONSTRAINT IF EXISTS ojt_hours_log_apprenticeship_id_fkey;
ALTER TABLE public.ojt_hours_log ADD CONSTRAINT ojt_hours_log_apprenticeship_id_fkey FOREIGN KEY (apprenticeship_id) REFERENCES public.program_enrollments(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_apprentice_notifications_enrollment ON public.apprentice_notifications(apprenticeship_id);
CREATE INDEX IF NOT EXISTS idx_ojt_hours_log_enrollment_work_date ON public.ojt_hours_log(apprenticeship_id,work_date);
