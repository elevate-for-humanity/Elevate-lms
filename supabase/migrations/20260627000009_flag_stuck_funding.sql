-- Flag 11 enrollments stuck in pending_funding_verification for >14 days
-- These need admin to either verify funding or contact the student.
-- Sets next_required_action and funding_verification_due_at so the
-- admin dashboard funding queue surfaces them.

UPDATE public.program_enrollments
SET
  next_required_action = 'funding_verification_overdue',
  funding_verification_due_at = now(),
  updated_at = now()
WHERE
  status = 'pending_funding_verification'
  AND created_at < now() - interval '14 days'
  AND (next_required_action IS NULL OR next_required_action != 'funding_verification_overdue');

-- Also update the applications table so the admin queue shows them
UPDATE public.applications
SET
  next_step = 'Funding verification overdue — contact student or WorkOne',
  next_step_due_date = now()::date,
  updated_at = now()
WHERE
  user_id IN (
    SELECT user_id FROM public.program_enrollments
    WHERE status = 'pending_funding_verification'
    AND created_at < now() - interval '14 days'
  )
  AND (next_step IS NULL OR next_step NOT LIKE '%overdue%');
