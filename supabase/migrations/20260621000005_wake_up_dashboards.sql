-- Seeding assignments to wake up the Case Manager Dashboard
INSERT INTO public.case_manager_assignments (case_manager_id, learner_id, assigned_at)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'elizabethpowell6262@gmail.com' LIMIT 1),
  id,
  now()
FROM public.profiles
WHERE role = 'student'
LIMIT 10
ON CONFLICT DO NOTHING;

-- Seeding certifications to wake up the Employer Dashboard
UPDATE public.program_enrollments
SET progress_percent = 100, completed_at = now() - interval '2 days'
WHERE user_id IN (SELECT id FROM public.profiles WHERE role = 'student' LIMIT 5);

UPDATE public.profiles
SET is_certified = true
WHERE id IN (SELECT id FROM public.profiles WHERE role = 'student' LIMIT 5);
