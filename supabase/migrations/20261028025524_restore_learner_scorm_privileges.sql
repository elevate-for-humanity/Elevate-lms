-- Restore Data API privileges required by the learner SCORM player.
-- Existing owner policies continue to restrict saved progress to auth.uid().
-- Learners cannot modify packages, delete progress, or access other learners.
ALTER TABLE public.scorm_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scorm_enrollments ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON TABLE public.scorm_packages TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.scorm_enrollments TO authenticated;
