-- One historical student application can have a program_enrollment row that is
-- not active (for example payment_required) while the application itself says
-- approved. The approval guard now prevents recurrence. Move any such unfunded
-- historical rows back to the canonical review state without granting access.

UPDATE public.applications a
SET
  status = 'under_review',
  updated_at = now()
WHERE a.type = 'student'
  AND a.status = 'approved'
  AND COALESCE(a.funding_verified, false) = false
  AND COALESCE(a.has_workone_approval, false) = false
  AND NOT EXISTS (
    SELECT 1
    FROM public.program_enrollments pe
    WHERE pe.program_id = a.program_id
      AND COALESCE(pe.user_id, pe.student_id) = a.user_id
      AND COALESCE(pe.enrollment_state, pe.status) IN ('active', 'completed')
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.stripe_sessions_staging ss
    WHERE ss.application_id::text = a.id::text
      AND ss.payment_status = 'paid'
  );
