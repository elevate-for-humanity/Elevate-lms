-- Aligns courses.status/is_active with a durable Ultimate release without
-- republishing. Only non-archived courses with a released version are touched;
-- an administrator's archive decision is preserved.
WITH latest AS (
  SELECT DISTINCT ON (r.course_id) r.course_id, r.released_at
  FROM public.ultimate_release_versions r WHERE r.status = 'released'
  ORDER BY r.course_id, r.version DESC, r.released_at DESC NULLS LAST
)
UPDATE public.courses c
   SET status = 'published', is_active = true,
       published_at = coalesce(c.published_at, latest.released_at, now())
  FROM latest
 WHERE latest.course_id = c.id
   AND c.status IS DISTINCT FROM 'archived'
   AND (c.status IS DISTINCT FROM 'published' OR c.is_active IS DISTINCT FROM true)
RETURNING c.id AS course_id, c.title, c.status, c.is_active;
