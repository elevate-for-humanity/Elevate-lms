-- Program catalog: publish all active programs, sync credential columns, programs-only index view.
-- Safe to re-run. Apply in Supabase Dashboard → SQL Editor (or via deploy pipeline).

-- ── 1. Ensure published catalog rows are visible ─────────────────────────────
UPDATE public.programs
SET
  published  = true,
  is_active  = true,
  updated_at = now()
WHERE
  (published IS DISTINCT FROM true OR is_active IS DISTINCT FROM true)
  AND (status IS NULL OR status <> 'archived');

-- Mirror credential_name into credential_type for UIs that read either column
UPDATE public.programs
SET
  credential_type = credential_name,
  updated_at      = now()
WHERE
  credential_name IS NOT NULL
  AND btrim(credential_name) <> ''
  AND (credential_type IS NULL OR btrim(credential_type) = '');

-- ── 2. program_catalog_index — programs only (no training_courses UNION) ─────
-- Legacy callers expect program_id + wioa_eligible aliases; map from live columns.

DROP VIEW IF EXISTS public.program_catalog_index;

CREATE VIEW public.program_catalog_index AS
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
  'Published programs only. Legacy alias columns (program_id, wioa_eligible, duration_weeks) map to live programs columns.';

-- Post-apply check (expect catalog_view_rows > 0; ~79 after publish-all-active seed):
-- SELECT json_build_object('catalog_view_rows', count(*)) FROM public.program_catalog_index;
