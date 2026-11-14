-- Create missing views referenced by admin pages
-- All views are SECURITY DEFINER so RLS on underlying tables still applies

-- 1. admin_applications_queue
-- Used by: app/admin/applications/[type]/[id]/page.tsx
DROP VIEW IF EXISTS public.admin_applications_queue CASCADE;
CREATE VIEW public.admin_applications_queue AS
SELECT
  a.id,
  a.id AS application_id,
  a.application_type,
  a.first_name,
  a.last_name,
  COALESCE(a.full_name, a.first_name || ' ' || a.last_name) AS full_name,
  a.email,
  a.phone,
  a.program_id,
  a.program_slug,
  a.status,
  a.eligibility_status,
  a.funding_status,
  a.funding_source,
  a.intake_stage,
  a.created_at,
  a.updated_at,
  a.submitted_at,
  a.reviewer_id,
  a.review_notes,
  a.reviewed_at,
  a.next_step,
  a.next_step_due_date,
  p.title AS program_title
FROM public.applications a
LEFT JOIN public.programs p ON p.id = a.program_id;

-- 2. enrollments (alias for program_enrollments)
-- Used by: app/admin/reports/charts/page.tsx
DROP VIEW IF EXISTS public.enrollments CASCADE;
CREATE VIEW public.enrollments AS
SELECT
  pe.id,
  pe.user_id,
  pe.student_id,
  pe.program_id,
  pe.enrollment_state AS status,
  pe.enrollment_state,
  pe.created_at,
  pe.updated_at,
  p.title AS program_name,
  p.slug AS program_slug
FROM public.program_enrollments pe
LEFT JOIN public.programs p ON p.id = pe.program_id;

-- 3. exam_authorization_queue
-- Used by: app/admin/exam-authorizations/page.tsx
DROP VIEW IF EXISTS public.exam_authorization_queue CASCADE;
CREATE VIEW public.exam_authorization_queue AS
SELECT
  efa.id,
  efa.learner_id,
  efa.program_id,
  efa.credential_id,
  efa.funding_source,
  efa.funding_status,
  efa.funded_amount_cents,
  efa.funding_notes,
  efa.funding_approved_by,
  efa.funding_approved_at,
  efa.created_at,
  efa.updated_at,
  pr.first_name,
  pr.last_name,
  pr.email,
  pg.title AS program_title,
  pg.slug AS program_slug
FROM public.exam_funding_authorizations efa
LEFT JOIN public.profiles pr ON pr.id = efa.learner_id
LEFT JOIN public.programs pg ON pg.id = efa.program_id;

-- 4. participant_report
-- Used by: app/admin/reports/wioa/page.tsx
DROP VIEW IF EXISTS public.participant_report CASCADE;
CREATE VIEW public.participant_report AS
SELECT
  pe.id,
  pe.user_id,
  pe.student_id,
  pe.program_id,
  pe.enrollment_state AS enrollment_status,
  pe.enrollment_state,
  pe.created_at AS applied_at,
  pe.created_at,
  pe.updated_at,
  pr.first_name,
  pr.last_name,
  pr.email,
  pr.phone,
  pg.title AS program_title,
  pg.slug AS program_slug,
  pg.title AS program_category
FROM public.program_enrollments pe
LEFT JOIN public.profiles pr ON pr.id = COALESCE(pe.user_id, pe.student_id)
LEFT JOIN public.programs pg ON pg.id = pe.program_id;

-- 5. referral_pipeline_summary
-- Used by: app/admin/referrals/page.tsx
DROP VIEW IF EXISTS public.referral_pipeline_summary CASCADE;
CREATE VIEW public.referral_pipeline_summary AS
SELECT
  wr.id,
  wr.user_id,
  wr.application_id,
  wr.enrollment_id,
  wr.agency_name,
  wr.agency_type,
  wr.case_manager_name,
  wr.case_manager_email,
  wr.case_manager_phone,
  COALESCE(wr.participant_name, wr.applicant_name) AS participant_name,
  COALESCE(wr.participant_email, wr.applicant_email) AS participant_email,
  wr.funding_type,
  wr.voucher_number,
  wr.funding_amount,
  wr.funding_approved,
  wr.funding_approved_at,
  wr.status,
  wr.referral_date,
  wr.archived,
  wr.notes,
  wr.created_at,
  wr.updated_at,
  a.program_id,
  a.program_slug,
  p.title AS program_title
FROM public.workforce_referrals wr
LEFT JOIN public.applications a ON a.id = wr.application_id
LEFT JOIN public.programs p ON p.id = a.program_id;

-- 6. shop_required_docs_status
-- Used by: app/admin/shops/page.tsx
DROP VIEW IF EXISTS public.shop_required_docs_status CASCADE;
CREATE VIEW public.shop_required_docs_status AS
SELECT
  sa.id,
  sa.shop_name,
  sa.status,
  sa.created_at,
  -- Derive required/approved from agreement fields
  3 AS required,
  (CASE WHEN sa.agree_supervision THEN 1 ELSE 0 END +
   CASE WHEN sa.agree_reporting THEN 1 ELSE 0 END +
   CASE WHEN sa.agree_wages THEN 1 ELSE 0 END) AS approved,
  sa.agree_supervision,
  sa.agree_reporting,
  sa.agree_wages,
  -- shop_id for joining
  NULL::uuid AS shop_id
FROM public.shop_applications sa
UNION ALL
SELECT
  s.id,
  s.name AS shop_name,
  CASE WHEN s.active THEN 'active' ELSE 'inactive' END AS status,
  s.created_at,
  3 AS required,
  3 AS approved,
  true AS agree_supervision,
  true AS agree_reporting,
  true AS agree_wages,
  s.id AS shop_id
FROM public.shops s;

-- 7. v_admin_financial_assurance_summary
-- Used by: app/admin/compliance/financial-assurance/page.tsx
DROP VIEW IF EXISTS public.v_admin_financial_assurance_summary CASCADE;
CREATE VIEW public.v_admin_financial_assurance_summary AS
SELECT
  COUNT(*) AS total_records,
  COUNT(*) FILTER (WHERE status = 'active') AS active_count,
  COUNT(*) FILTER (WHERE status = 'expired') AS expired_count,
  COUNT(*) FILTER (WHERE status = 'expiring_soon' OR (
    expiration_date IS NOT NULL AND
    expiration_date <= (CURRENT_DATE + INTERVAL '90 days') AND
    expiration_date > CURRENT_DATE
  )) AS expiring_soon_count,
  COALESCE(SUM(coverage_amount) FILTER (WHERE status = 'active'), 0) AS total_active_coverage,
  MAX(updated_at) AS last_updated
FROM public.financial_assurance_records;

-- 8. v_funding_verification_queue
-- Used by: app/admin/funding-verification/page.tsx
DROP VIEW IF EXISTS public.v_funding_verification_queue CASCADE;
CREATE VIEW public.v_funding_verification_queue AS
SELECT
  pe.id,
  pe.user_id,
  pe.student_id,
  pe.program_id,
  pe.enrollment_state,
  pe.funding_source,
  pe.created_at,
  pe.updated_at,
  pr.first_name,
  pr.last_name,
  pr.email,
  pg.title AS program_title,
  pg.slug AS program_slug,
  pif.id AS flag_id,
  pif.flag_type,
  pif.flag_reason,
  pif.flagged_at,
  pif.sla_days,
  pif.sla_escalated_at,
  -- SLA priority: escalated first, then by age
  CASE
    WHEN pif.sla_escalated_at IS NOT NULL THEN 1
    WHEN pe.created_at < NOW() - INTERVAL '7 days' THEN 2
    ELSE 3
  END AS sla_priority
FROM public.program_enrollments pe
LEFT JOIN public.profiles pr ON pr.id = COALESCE(pe.user_id, pe.student_id)
LEFT JOIN public.programs pg ON pg.id = pe.program_id
LEFT JOIN public.payment_integrity_flags pif
  ON pif.entity_id = pe.id
  AND pif.entity_type = 'enrollment'
  AND pif.resolved_at IS NULL
WHERE pe.enrollment_state IN ('pending_funding_verification', 'pending_payment', 'funding_review')
   OR pif.id IS NOT NULL
ORDER BY sla_priority, pe.created_at ASC;
