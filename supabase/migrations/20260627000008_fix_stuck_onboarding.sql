-- Fix stuck onboarding for enrolled students
-- These users have active program_enrollments but onboarding_completed=false
-- because they never hit /api/onboarding/complete after enrollment was created.
--
-- Jordan White (Jbwhite888@icloud.com) — active enrollment, payment succeeded, 17d stuck
-- Bryan Long (fabisbabs1988@gmail.com) — active enrollment, 17d stuck
--
-- The other 4 (natataroa, rodybanegas, fletcheraustin98, sallenjohn) have
-- enrollment_status='pending' — they need admin to send onboarding email first,
-- not a direct flag flip. Only flip the ones with enrollment_status='active'.

UPDATE public.profiles
SET
  onboarding_completed = true,
  onboarding_completed_at = now(),
  updated_at = now()
WHERE email IN (
  'Jbwhite888@icloud.com',
  'fabisbabs1988@gmail.com'
)
AND onboarding_completed = false
AND enrollment_status = 'active';

-- Also ensure their program_enrollments reflect active state
UPDATE public.program_enrollments
SET
  enrollment_state = 'active',
  status = 'active',
  updated_at = now()
WHERE user_id IN (
  SELECT id FROM public.profiles
  WHERE email IN ('Jbwhite888@icloud.com', 'fabisbabs1988@gmail.com')
)
AND enrollment_state != 'active';

-- For the 4 with enrollment_status='pending' — update their enrollment to onboarding
-- so the admin dashboard shows them correctly and can send the onboarding email
UPDATE public.program_enrollments
SET
  status = 'onboarding',
  enrollment_state = 'onboarding',
  updated_at = now()
WHERE user_id IN (
  SELECT id FROM public.profiles
  WHERE email IN (
    'natataroa@gmail.com',
    'rodybanegas@yahoo.com',
    'fletcheraustin98@gmail.com',
    'sallenjohn@outlook.com'
  )
)
AND status NOT IN ('active', 'completed', 'revoked');
