-- Creates program_catalog_index view used by /programs/catalog and /api/catalog.
-- Previously missing from live DB, causing those routes to 500.

CREATE OR REPLACE VIEW public.program_catalog_index AS
SELECT
  p.id,
  p.slug,
  p.title,
  p.description,
  p.excerpt,
  p.image_url,
  p.estimated_weeks,
  p.credential_name,
  p.funding_tags,
  p.wioa_approved,
  p.published,
  p.is_active,
  p.status,
  p.featured,
  'program'::text AS source_type
FROM public.programs p
WHERE p.published = true
  AND p.is_active = true
  AND p.status != 'archived'

UNION ALL

SELECT
  tc.id,
  tc.slug,
  tc.title,
  tc.description,
  tc.summary        AS excerpt,
  NULL::text        AS image_url,
  NULL::integer     AS estimated_weeks,
  NULL::text        AS credential_name,
  NULL::text[]      AS funding_tags,
  false             AS wioa_approved,
  tc.is_published   AS published,
  tc.is_active,
  tc.status,
  false             AS featured,
  'course'::text    AS source_type
FROM public.training_courses tc
WHERE tc.is_published = true
  AND tc.is_active   = true
  AND tc.status      = 'published';

GRANT SELECT ON public.program_catalog_index TO authenticated, anon, service_role;
