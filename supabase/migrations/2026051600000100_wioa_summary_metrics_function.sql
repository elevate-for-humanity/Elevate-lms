-- Creates the wioa_summary_metrics RPC that was missing from the live DB.
-- The participant_report view (applied in 20260429000003) already exists.
-- This function adds the summary aggregation on top of it.
--
-- Beauty/barbershop/nail/esthetician programs are self-pay only and must
-- never appear in WIOA/WRG metrics. They are excluded here via slug pattern.
--
-- Apply in Supabase Dashboard → SQL Editor.

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
    COUNT(DISTINCT participant_id)                                                  AS total_participants,
    COUNT(*) FILTER (WHERE enrollment_status IN ('active','in_progress','enrolled')) AS active_enrollments,
    COUNT(*) FILTER (WHERE enrollment_status = 'completed')                         AS completed,
    COUNT(*) FILTER (WHERE enrollment_status IN ('exited','withdrawn','revoked'))    AS exited,
    COUNT(*) FILTER (WHERE placement_status  IN ('verified','confirmed'))            AS job_placements,
    COUNT(*) FILTER (WHERE credential_received = TRUE)                              AS credentials_issued,
    ROUND(AVG(hourly_wage) FILTER (WHERE hourly_wage IS NOT NULL), 2)               AS avg_hourly_wage,
    COUNT(*) FILTER (WHERE funding_source ILIKE 'wioa%')                            AS wioa_funded,
    COUNT(*) FILTER (WHERE funding_source ILIKE '%workforce_ready%'
                        OR  funding_source ILIKE '%wrg%')                           AS wrg_funded,
    COUNT(*) FILTER (WHERE funding_source ILIKE '%self_pay%'
                        OR  funding_source ILIKE '%self-pay%')                      AS self_pay,
    COUNT(*) FILTER (WHERE funding_source ILIKE '%employer%')                       AS employer_sponsored
  FROM public.participant_report
  WHERE
    -- Exclude beauty/barbershop — self-pay only, not WIOA/WRG eligible
    program_slug NOT SIMILAR TO '%(barber|cosmet|nail|esthet|beauty|hair-stylist)%'
    AND (p_start_date IS NULL OR applied_at  >= p_start_date)
    AND (p_end_date   IS NULL OR applied_at  <= p_end_date)
    AND (p_program_id IS NULL OR program_id  =  p_program_id)
    AND (p_funding    IS NULL OR funding_source ILIKE p_funding || '%');
$$;

GRANT EXECUTE ON FUNCTION public.wioa_summary_metrics TO authenticated;
