-- Align LMS course display name and registered-hour description with the canonical Barber Apprenticeship.
-- Safe to re-run. Apply manually in Supabase SQL Editor when replaying historical data fixes.

UPDATE public.courses
SET
  title = 'Prestige Elevation Barber Curriculum',
  description = 'Prestige Elevation Barber Curriculum — 144 hours of Related Technical Instruction (RTI) delivered through the LMS as part of the registered Barber Apprenticeship. Apprentices must separately complete 2,000 approved hours of supervised On-the-Job Learning (OJL) at an approved host shop, along with required competencies and completion documentation.',
  updated_at = now()
WHERE id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';

-- Verify:
-- SELECT id, title, slug, description, status FROM public.courses WHERE id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
