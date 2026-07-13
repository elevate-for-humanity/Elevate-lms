-- Ensure the canonical barber apprenticeship course row exists.
--
-- All barber migrations reference course ID 3fb5ce19-1cde-434c-a8c6-f138d7d7aa17
-- but no migration ever inserted it. The admin course builder returns 404 because
-- the courses table query returns null for this ID.
--
-- Safe to re-run: INSERT ... ON CONFLICT DO NOTHING.

INSERT INTO public.courses (
  id,
  title,
  slug,
  description,
  status,
  is_active,
  created_at,
  updated_at
)
VALUES (
  '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17',
  'Prestige Elevation Barber Curriculum',
  'barber-apprenticeship',
  'Prestige Elevation Barber Curriculum — 500 hours RTI + 1,500 hours OJT. Indiana DOL barber apprenticeship pathway.',
  'published',
  true,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE
  SET
    title      = EXCLUDED.title,
    slug       = EXCLUDED.slug,
    status     = 'published',
    is_active  = true,
    updated_at = now()
  WHERE public.courses.status = 'archived';

-- Verify:
-- SELECT id, title, slug, status FROM public.courses WHERE id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
