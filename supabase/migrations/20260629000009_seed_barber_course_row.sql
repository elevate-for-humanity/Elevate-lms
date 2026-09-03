-- Ensure the canonical barber apprenticeship course row exists.
--
-- All barber migrations reference course ID 3fb5ce19-1cde-434c-a8c6-f138d7d7aa17.
-- This row represents the LMS Related Technical Instruction course only.
-- Registered completion requires 144 RTI hours plus 2,000 OJL hours tracked separately.
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
  'Prestige Elevation Barber Curriculum — 144 hours of Related Technical Instruction (RTI) delivered through the LMS as part of the registered Barber Apprenticeship. Apprentices must separately complete 2,000 approved hours of supervised On-the-Job Learning (OJL) at an approved host shop, along with required competencies and completion documentation.',
  'published',
  true,
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE
  SET
    title       = EXCLUDED.title,
    slug        = EXCLUDED.slug,
    description = EXCLUDED.description,
    status      = 'published',
    is_active   = true,
    updated_at  = now()
  WHERE public.courses.status = 'archived';

-- Verify:
-- SELECT id, title, slug, description, status FROM public.courses WHERE id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
