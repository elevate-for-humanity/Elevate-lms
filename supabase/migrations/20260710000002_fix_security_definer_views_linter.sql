-- Fix Supabase linter 0010_security_definer_view for participant_report and program_catalog_index.
-- Preserves full WIOA participant_report v2 (20260429000003) — do NOT simplify columns.
-- Idempotent — safe to re-run in Supabase SQL Editor.

-- ── participant_report (v2 + security_invoker) ─────────────────────────────
DROP VIEW IF EXISTS public.participant_report CASCADE;

CREATE VIEW public.participant_report
WITH (security_invoker = true)
AS
SELECT
  pe.user_id                                                AS participant_id,
  COALESCE(pr.full_name, pe.full_name)                      AS full_name,
  COALESCE(pr.email,     pe.email)                          AS email,
  COALESCE(pr.phone,     pe.phone)                          AS phone,
  pe.id                                                     AS enrollment_id,
  pe.created_at                                             AS applied_at,
  COALESCE(pe.confirmed_at, pe.enrollment_confirmed_at)     AS enrolled_at,
  pe.completed_at,
  pe.revoked_at                                             AS exited_at,
  LOWER(COALESCE(pe.enrollment_state, pe.status, 'applied')) AS enrollment_status,
  pg.id                                                     AS program_id,
  pg.slug                                                   AS program_slug,
  pg.title                                                  AS program_title,
  pg.category                                               AS program_category,
  COALESCE(efr.funding_source, pe.funding_source, pe.funding_pathway) AS funding_source,
  efr.status                                                AS funding_status,
  efr.amount_cents,
  pe.funding_verified,
  pl.employer_name,
  pl.job_title,
  pl.hourly_wage,
  pl.employment_type,
  pl.start_date                                             AS employment_start_date,
  pl.status                                                 AS placement_status,
  pl.verification_method,
  cert.id IS NOT NULL                                       AS credential_received,
  cert.issued_at                                            AS credential_issued_at,
  cert.certificate_number,
  CASE
    WHEN pl.id IS NOT NULL AND cert.id IS NOT NULL THEN 'employment_and_credential'
    WHEN pl.id IS NOT NULL                          THEN 'employment'
    WHEN cert.id IS NOT NULL                        THEN 'credential'
    ELSE 'none'
  END                                                       AS outcome_type,
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

GRANT SELECT ON public.participant_report TO authenticated, service_role;

COMMENT ON VIEW public.participant_report IS
  'WIOA participant outcomes v2 — security_invoker=true (caller RLS applies).';

-- ── program_catalog_index (programs-only, matches 20260705000011) ───────────
DROP VIEW IF EXISTS public.program_catalog_index CASCADE;

CREATE VIEW public.program_catalog_index
WITH (security_invoker = true)
AS
SELECT
  p.id                                              AS program_id,
  p.id,
  p.slug,
  p.title,
  COALESCE(NULLIF(btrim(p.partner_name), ''), 'Elevate for Humanity') AS provider_name,
  COALESCE(t.slug, 'elevate')                       AS provider_slug,
  p.category,
  p.category_norm,
  p.description,
  p.excerpt,
  p.image_url,
  p.estimated_weeks                                 AS duration_weeks,
  p.estimated_weeks,
  p.credential_name,
  p.credential_type,
  p.funding_tags,
  COALESCE(p.wioa_approved, p.funding_eligible, false) AS wioa_eligible,
  p.wioa_approved,
  p.published,
  p.is_active,
  p.status,
  p.featured,
  p.state_code                                      AS state,
  p.completion_rate,
  p.placement_rate,
  p.delivery_method                                 AS delivery_mode,
  'program'::text                                   AS source_type,
  p.short_description
FROM public.programs p
LEFT JOIN public.tenants t ON t.id = p.tenant_id
WHERE p.published = true
  AND p.is_active = true
  AND (p.status IS NULL OR p.status <> 'archived');

GRANT SELECT ON public.program_catalog_index TO authenticated, anon, service_role;

COMMENT ON VIEW public.program_catalog_index IS
  'Published programs catalog — security_invoker=true; anon SELECT via GRANT + underlying RLS.';
