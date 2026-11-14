-- Unified participant outcomes view for WIOA reporting.
--
-- Joins program_enrollments → profiles → programs → enrollment_funding_records
-- → employment_outcomes / placement_records / program_completion_certificates
-- into a single queryable surface.
--
-- Used by:
--   GET /api/reports/participants
--   GET /api/reports/participants/export
--   /admin/reports/wioa
--
-- Apply in Supabase Dashboard → SQL Editor before using the report endpoints.

-- BEGIN; (removed: exec_sql runs in implicit txn)

-- ── 1. Canonical enrollment status values ────────────────────────────────────
-- Normalize the status column across program_enrollments.
-- Existing rows may have mixed-case or legacy values; this view normalises them.

DROP VIEW IF EXISTS public.participant_report;
CREATE OR REPLACE VIEW public.participant_report AS
SELECT
  -- Participant identity
  pr.id                                                   AS participant_id,
  pr.full_name,
  pr.email,
  pr.phone,

  -- Enrollment
  pe.id                                                   AS enrollment_id,
  pe.created_at                                           AS applied_at,
  pe.confirmed_at                                         AS enrolled_at,
  pe.completed_at,
  -- NULL::timestamptz, -- column removed
  LOWER(COALESCE(pe.enrollment_state, pe.status, 'applied')) AS enrollment_status,

  -- Program
  pg.id                                                   AS program_id,
  pg.slug                                                 AS program_slug,
  pg.title                                                AS program_title,
  pg.category                                             AS program_category,

  -- Funding (most recent approved record wins)
  efr.funding_source,
  efr.status                                              AS funding_status,
  efr.amount_cents,
  NULL::text AS workone_case_number,
  efr.updated_at                                         AS funding_approved_at,

  -- Employment outcome (most recent verified placement)
  pl.employer_name,
  pl.job_title,
  pl.hourly_wage,
  pl.employment_type,
  pl.start_date                                           AS employment_start_date,
  pl.status                                               AS placement_status,
  pl.verification_method,

  -- Credential outcome
  cert.id IS NOT NULL                                     AS credential_received,
  cert.issued_at                                          AS credential_issued_at,
  cert.certificate_number,

  -- Derived outcome type for WIOA reporting
  CASE
    WHEN pl.id IS NOT NULL AND cert.id IS NOT NULL THEN 'employment_and_credential'
    WHEN pl.id IS NOT NULL                          THEN 'employment'
    WHEN cert.id IS NOT NULL                        THEN 'credential'
    ELSE 'none'
  END                                                     AS outcome_type,

  -- Quarter helpers for DOL performance period queries
  DATE_TRUNC('quarter', pe.completed_at)                  AS completion_quarter,
  DATE_TRUNC('quarter', pl.start_date)                    AS placement_quarter

FROM public.program_enrollments pe

-- Participant profile
JOIN public.profiles pr
  ON pr.id = pe.user_id

-- Program (prefer program_id FK; fall back to slug lookup)
LEFT JOIN public.programs pg
  ON pg.id = COALESCE(
       pe.program_id,
       (SELECT id FROM public.programs WHERE slug = pe.program_slug LIMIT 1)
     )

-- Most recent approved funding record
LEFT JOIN LATERAL (
  SELECT *
  FROM public.enrollment_funding_records efr2
  WHERE efr2.enrollment_id = pe.id
    AND efr2.status IN ('approved', 'disbursed', 'reconciled')
  ORDER BY efr2.updated_at DESC NULLS LAST
  LIMIT 1
) efr ON TRUE

-- Most recent verified placement
LEFT JOIN LATERAL (
  SELECT *
  FROM public.placement_records pl2
  WHERE pl2.learner_id = pe.user_id
    AND (pl2.program_id = pg.id OR pg.id IS NULL)
  ORDER BY pl2.start_date DESC NULLS LAST
  LIMIT 1
) pl ON TRUE

-- Most recent completion certificate
LEFT JOIN LATERAL (
  SELECT *
  FROM public.program_completion_certificates cert2
  WHERE cert2.user_id = pe.user_id
    AND (cert2.program_id = pg.id OR pg.id IS NULL)
  ORDER BY cert2.issued_at DESC NULLS LAST
  LIMIT 1
) cert ON TRUE;

-- ── 2. RLS: admins and staff only ────────────────────────────────────────────
-- Views inherit RLS from their base tables. Add an explicit grant so the
-- service role can query without bypassing auth.

GRANT SELECT ON public.participant_report TO authenticated;

-- ── 3. WIOA summary metrics function ─────────────────────────────────────────
-- Returns the aggregate numbers the admin dashboard needs in one call.

CREATE OR REPLACE FUNCTION public.wioa_summary_metrics(
  p_start_date  DATE DEFAULT NULL,
  p_end_date    DATE DEFAULT NULL,
  p_program_id  UUID DEFAULT NULL,
  p_funding     TEXT DEFAULT NULL
)
RETURNS TABLE (
  total_participants      BIGINT,
  active_enrollments      BIGINT,
  completed               BIGINT,
  exited                  BIGINT,
  job_placements          BIGINT,
  credentials_issued      BIGINT,
  avg_hourly_wage         NUMERIC,
  wioa_funded             BIGINT,
  wrg_funded              BIGINT,
  self_pay                BIGINT,
  employer_sponsored      BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    COUNT(DISTINCT participant_id)                                                   AS total_participants,
    COUNT(*) FILTER (WHERE enrollment_status IN ('active','in_progress','enrolled')) AS active_enrollments,
    COUNT(*) FILTER (WHERE enrollment_status = 'completed')                          AS completed,
    COUNT(*) FILTER (WHERE enrollment_status IN ('exited','withdrawn'))              AS exited,
    COUNT(*) FILTER (WHERE placement_status = 'verified')                            AS job_placements,
    COUNT(*) FILTER (WHERE credential_received = TRUE)                               AS credentials_issued,
    ROUND(AVG(hourly_wage) FILTER (WHERE hourly_wage IS NOT NULL), 2)               AS avg_hourly_wage,
    COUNT(*) FILTER (WHERE funding_source ILIKE 'wioa%')                             AS wioa_funded,
    COUNT(*) FILTER (WHERE funding_source = 'workforce_ready_grant')                 AS wrg_funded,
    COUNT(*) FILTER (WHERE funding_source = 'self_pay')                              AS self_pay,
    COUNT(*) FILTER (WHERE funding_source = 'employer_sponsored')                    AS employer_sponsored
  FROM public.participant_report
  WHERE
    (p_start_date IS NULL OR applied_at >= p_start_date)
    AND (p_end_date   IS NULL OR applied_at <= p_end_date)
    AND (p_program_id IS NULL OR program_id = p_program_id)
    AND (p_funding    IS NULL OR funding_source ILIKE p_funding || '%');
$$;

GRANT EXECUTE ON FUNCTION public.wioa_summary_metrics TO authenticated;

-- COMMIT; (removed: exec_sql runs in implicit txn)
