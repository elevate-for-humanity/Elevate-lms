-- Unified participant outcomes view for WIOA reporting (v2).
--
-- Replaces 20260429000001 — column names corrected against live schema.
-- enrollment_funding_records: no approved_at, no workone_case_number
-- placement_records: learner_id (not user_id), no enrollment_id FK
-- program_completion_certificates: user_id, issued_at
-- program_enrollments: confirmed_at, enrollment_confirmed_at, revoked_at
--
-- Used by:
--   GET /api/reports/participants
--   GET /api/reports/participants/export
--   /admin/reports/wioa

-- BEGIN; (removed: exec_sql runs in implicit txn)

DROP VIEW IF EXISTS public.participant_report CASCADE;

CREATE OR REPLACE VIEW public.participant_report AS
SELECT
  -- Participant identity
  pe.user_id                                                AS participant_id,
  COALESCE(pr.full_name, pe.full_name)                      AS full_name,
  COALESCE(pr.email,     pe.email)                          AS email,
  COALESCE(pr.phone,     pe.phone)                          AS phone,

  -- Enrollment
  pe.id                                                     AS enrollment_id,
  pe.created_at                                             AS applied_at,
  COALESCE(pe.confirmed_at, pe.enrollment_confirmed_at)     AS enrolled_at,
  pe.completed_at,
  pe.revoked_at                                             AS exited_at,
  LOWER(COALESCE(pe.enrollment_state, pe.status, 'applied')) AS enrollment_status,

  -- Program
  pg.id                                                     AS program_id,
  pg.slug                                                   AS program_slug,
  pg.title                                                  AS program_title,
  pg.category                                               AS program_category,

  -- Funding
  COALESCE(efr.funding_source, pe.funding_source, pe.funding_pathway) AS funding_source,
  efr.status                                                AS funding_status,
  efr.amount_cents,
  pe.funding_verified,

  -- Employment outcome
  pl.employer_name,
  pl.job_title,
  pl.hourly_wage,
  pl.employment_type,
  pl.start_date                                             AS employment_start_date,
  pl.status                                                 AS placement_status,
  pl.verification_method,

  -- Credential outcome
  cert.id IS NOT NULL                                       AS credential_received,
  cert.issued_at                                            AS credential_issued_at,
  cert.certificate_number,

  -- Derived outcome type
  CASE
    WHEN pl.id IS NOT NULL AND cert.id IS NOT NULL THEN 'employment_and_credential'
    WHEN pl.id IS NOT NULL                          THEN 'employment'
    WHEN cert.id IS NOT NULL                        THEN 'credential'
    ELSE 'none'
  END                                                       AS outcome_type,

  -- Quarter helpers
  DATE_TRUNC('quarter', pe.completed_at)                    AS completion_quarter,
  DATE_TRUNC('quarter', pl.start_date)                      AS placement_quarter

FROM public.program_enrollments pe

LEFT JOIN public.profiles pr
  ON pr.id = pe.user_id

LEFT JOIN public.programs pg
  ON pg.id = COALESCE(
       pe.program_id,
       (SELECT id FROM public.programs WHERE slug = pe.program_slug LIMIT 1)
     )

LEFT JOIN LATERAL (
  SELECT *
  FROM public.enrollment_funding_records efr2
  WHERE efr2.enrollment_id = pe.id
  ORDER BY efr2.created_at DESC NULLS LAST
  LIMIT 1
) efr ON TRUE

LEFT JOIN LATERAL (
  SELECT *
  FROM public.placement_records pl2
  WHERE pl2.learner_id = pe.user_id
    AND (pl2.program_id = pg.id OR pg.id IS NULL)
  ORDER BY pl2.start_date DESC NULLS LAST
  LIMIT 1
) pl ON TRUE

LEFT JOIN LATERAL (
  SELECT *
  FROM public.program_completion_certificates cert2
  WHERE cert2.user_id = pe.user_id
    AND (cert2.program_id = pg.id OR pg.id IS NULL)
  ORDER BY cert2.issued_at DESC NULLS LAST
  LIMIT 1
) cert ON TRUE;

GRANT SELECT ON public.participant_report TO authenticated;

-- ── WIOA summary metrics ──────────────────────────────────────────────────────

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
    COUNT(DISTINCT participant_id)                                                    AS total_participants,
    COUNT(*) FILTER (WHERE enrollment_status IN ('active','in_progress','enrolled'))  AS active_enrollments,
    COUNT(*) FILTER (WHERE enrollment_status = 'completed')                           AS completed,
    COUNT(*) FILTER (WHERE enrollment_status IN ('exited','withdrawn','revoked'))     AS exited,
    COUNT(*) FILTER (WHERE placement_status IN ('verified','confirmed'))              AS job_placements,
    COUNT(*) FILTER (WHERE credential_received = TRUE)                                AS credentials_issued,
    ROUND(AVG(hourly_wage) FILTER (WHERE hourly_wage IS NOT NULL), 2)                AS avg_hourly_wage,
    COUNT(*) FILTER (WHERE funding_source ILIKE 'wioa%')                              AS wioa_funded,
    COUNT(*) FILTER (WHERE funding_source ILIKE '%workforce_ready%'
                        OR funding_source ILIKE '%wrg%')                              AS wrg_funded,
    COUNT(*) FILTER (WHERE funding_source ILIKE '%self_pay%'
                        OR funding_source ILIKE '%self-pay%')                         AS self_pay,
    COUNT(*) FILTER (WHERE funding_source ILIKE '%employer%')                         AS employer_sponsored
  FROM public.participant_report
  WHERE
    (p_start_date IS NULL OR applied_at >= p_start_date)
    AND (p_end_date   IS NULL OR applied_at <= p_end_date)
    AND (p_program_id IS NULL OR program_id = p_program_id)
    AND (p_funding    IS NULL OR funding_source ILIKE p_funding || '%');
$$;

GRANT EXECUTE ON FUNCTION public.wioa_summary_metrics TO authenticated;

-- COMMIT; (removed: exec_sql runs in implicit txn)
