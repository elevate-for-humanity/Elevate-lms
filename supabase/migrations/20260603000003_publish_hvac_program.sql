-- Ensure the HVAC Technician program row exists and is published.
--
-- The program page at /programs/hvac-technician calls getPublishedProgramBySlug
-- which requires published = true and is_active = true. Without this the page
-- returns 404 even though the course content (curriculum_lessons, modules) is live.
--
-- Safe to re-run: uses INSERT ... ON CONFLICT DO UPDATE.

INSERT INTO public.programs (
  id,
  slug,
  title,
  short_description,
  description,
  published,
  is_active,
  status,
  delivery_model,
  display_order,
  created_at,
  updated_at
)
VALUES (
  '4226f7f6-fbc1-44b5-83e8-b12ea149e4c7',
  'hvac-technician',
  'HVAC Technician',
  'Earn your EPA 608 certification and enter the HVAC trade in weeks.',
  'Hands-on HVAC training covering refrigerant handling, system diagnostics, and EPA 608 certification. WIOA and Workforce Ready Grant eligible.',
  true,
  true,
  'published',
  'hybrid',
  1,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  published     = true,
  is_active     = true,
  status        = 'published',
  short_description = COALESCE(NULLIF(programs.short_description, ''), EXCLUDED.short_description),
  updated_at    = now();

-- Also ensure the slug index can find it
UPDATE public.programs
SET
  published  = true,
  is_active  = true,
  status     = 'published',
  updated_at = now()
WHERE slug = 'hvac-technician'
  AND (published = false OR is_active = false OR status != 'published');
