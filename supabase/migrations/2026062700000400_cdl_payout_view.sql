-- CDL enrollment control view (admin-only)
-- Joins enrollment + payout + provider ref + student info.
-- Accessible only to service_role — never exposed via public API.

DROP VIEW IF EXISTS public.v_cdl_enrollment_control CASCADE;

CREATE VIEW public.v_cdl_enrollment_control AS
SELECT
  pe.id                       AS enrollment_id,
  pe.user_id,
  pe.program_slug,
  pe.status                   AS enrollment_status,
  pe.funding_source,
  pe.payout_status,
  pe.payout_amount,
  pe.payout_due_date,
  pe.payout_paid_date,
  pe.training_start_date,
  pe.training_end_date,
  pe.provider_notified_at,
  pe.provider_notified_by,
  p.internal_provider_ref,
  pr.full_name                AS student_name,
  pr.email                    AS student_email,
  pr.phone                    AS student_phone,
  -- Placement data from applications (source of truth for outcomes)
  a.placement_employer,
  a.placement_job_title,
  a.placement_hourly_wage,
  a.placed_at
FROM public.program_enrollments pe
JOIN public.programs p ON p.slug = pe.program_slug
LEFT JOIN public.profiles pr ON pr.id = pe.user_id
LEFT JOIN public.applications a ON a.user_id = pe.user_id
  AND a.program_interest = 'cdl-training'
WHERE pe.program_slug = 'cdl-training';

-- Restrict to service_role only — internal_provider_ref must never reach public clients
REVOKE ALL ON public.v_cdl_enrollment_control FROM anon, authenticated;
GRANT SELECT ON public.v_cdl_enrollment_control TO service_role;
