-- Seed HVAC Technician program and course records.
-- Required for the enrollment flow to resolve program_id on application.

-- 1. Insert into programs table (used by enrollment system)
-- Uses only columns confirmed by enroll/auto and enroll/checkout: name, slug, total_cost
INSERT INTO public.programs (
  name,
  slug,
  description,
  category,
  status,
  total_cost,
  duration_weeks,
  total_hours
)
SELECT
  'HVAC Technician',
  'hvac-technician',
  '20-week competency-based HVAC training with 6 industry credentials including EPA 608 Universal, Residential HVAC Certification 1 & 2, OSHA 30, CPR, and Rise Up. Workforce Ready Grant eligible.',
  'Skilled Trades',
  'active',
  5000,
  20,
  600
WHERE NOT EXISTS (
  SELECT 1 FROM public.programs WHERE slug = 'hvac-technician'
);

-- 2. Insert into courses table (used by resolveCourseId in apply flow)
-- The apply action matches on title, so title must contain 'hvac technician'.
INSERT INTO public.courses (
  title,
  description,
  category
)
SELECT
  'HVAC Technician',
  '20-week HVAC technician training program with EPA 608, Residential HVAC Certification 1 & 2, OSHA 30, CPR, and Rise Up credentials. Workforce Ready Grant eligible through Next Level Jobs.',
  'Skilled Trades'
WHERE NOT EXISTS (
  SELECT 1 FROM public.courses WHERE lower(title) = 'hvac technician'
);
