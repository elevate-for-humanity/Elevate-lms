-- Seed a courses row for every active program that lacks one.
--
-- The admin course builder routes to /admin/course-builder/[courseId] which
-- queries the courses table. Programs that have pages and enrollments but no
-- courses row return 404 in the builder.
--
-- This migration inserts a courses row for each program using the program's
-- own id as the program_id FK. Safe to re-run: ON CONFLICT (slug) DO NOTHING.
--
-- After applying, verify with:
--   SELECT p.slug, c.id, c.status
--   FROM public.programs p
--   LEFT JOIN public.courses c ON c.slug = p.slug
--   WHERE p.published = true AND p.is_active = true
--   ORDER BY p.slug;

INSERT INTO public.courses (
  program_id,
  slug,
  title,
  short_description,
  description,
  status,
  is_active,
  published_at,
  created_at,
  updated_at
)
SELECT
  p.id,
  p.slug,
  p.title,
  COALESCE(p.short_description, p.title),
  COALESCE(p.description, p.title),
  'published'::public.course_status,
  true,
  now(),
  now(),
  now()
FROM public.programs p
WHERE
  p.published    = true
  AND p.is_active = true
  AND COALESCE(p.status, '') != 'archived'
  AND NOT EXISTS (
    SELECT 1 FROM public.courses c WHERE c.slug = p.slug
  );

-- Also ensure the barber canonical ID row is linked to its program
UPDATE public.courses c
SET
  program_id = p.id,
  updated_at = now()
FROM public.programs p
WHERE p.slug = 'barber-apprenticeship'
  AND c.id   = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND c.program_id IS NULL;

-- Verification query (run manually after applying):
-- SELECT p.slug, p.title, c.id AS course_id, c.status
-- FROM public.programs p
-- LEFT JOIN public.courses c ON c.slug = p.slug
-- WHERE p.published = true AND p.is_active = true
-- ORDER BY p.slug;
