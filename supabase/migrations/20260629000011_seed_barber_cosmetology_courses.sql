-- Seed comprehensive courses for beauty apprenticeships
-- Indiana State Board aligned curriculum
-- These courses will be visible in the LMS and Host Shop Admin

-- Barber Apprenticeship Course
INSERT INTO public.courses (
  program_id,
  slug,
  title,
  short_description,
  description,
  status,
  is_active,
  category,
  duration_hours,
  passing_score,
  published_at,
  created_at,
  updated_at
)
SELECT 
  p.id,
  'barber-apprenticeship-course',
  'Barber Apprenticeship - Complete Course',
  '2,000-hour DOL registered apprenticeship program',
  'Indiana Barber Apprenticeship covering hair cutting, shaving, chemical services, and state board exam prep. Compliant with DOL registered apprenticeship requirements including 1,500 OJT hours and 500 RTI hours.',
  'published',
  true,
  'Barber Apprenticeship',
  2000,
  80,
  now(),
  now(),
  now()
FROM public.programs p
WHERE p.slug = 'barber-apprenticeship'
  AND NOT EXISTS (SELECT 1 FROM public.courses WHERE slug = 'barber-apprenticeship-course')
ON CONFLICT (slug) DO NOTHING;

-- Cosmetology Apprenticeship Course
INSERT INTO public.courses (
  program_id,
  slug,
  title,
  short_description,
  description,
  status,
  is_active,
  category,
  duration_hours,
  passing_score,
  published_at,
  created_at,
  updated_at
)
SELECT 
  p.id,
  'cosmetology-apprenticeship-course',
  'Cosmetology Apprenticeship - Complete Course',
  '2,000-hour Indiana cosmetology license apprenticeship',
  'Indiana Cosmetology Apprenticeship covering hair, skin, nails, and makeup services. Prepares for Indiana cosmetology license exam with comprehensive theory and practical training.',
  'published',
  true,
  'Cosmetology',
  2000,
  80,
  now(),
  now(),
  now()
FROM public.programs p
WHERE p.slug = 'cosmetology-apprenticeship'
  AND NOT EXISTS (SELECT 1 FROM public.courses WHERE slug = 'cosmetology-apprenticeship-course')
ON CONFLICT (slug) DO NOTHING;

-- Esthetician Apprenticeship Course
INSERT INTO public.courses (
  program_id,
  slug,
  title,
  short_description,
  description,
  status,
  is_active,
  category,
  duration_hours,
  passing_score,
  published_at,
  created_at,
  updated_at
)
SELECT 
  p.id,
  'esthetician-apprenticeship-course',
  'Esthetician Apprenticeship - Complete Course',
  '700-hour Indiana esthetician license apprenticeship',
  'Indiana Esthetician Apprenticeship covering advanced skin care, facials, hair removal, and makeup. Prepares for Indiana esthetician license exam.',
  'published',
  true,
  'Esthetician',
  700,
  80,
  now(),
  now(),
  now()
FROM public.programs p
WHERE p.slug = 'esthetician-apprenticeship'
  AND NOT EXISTS (SELECT 1 FROM public.courses WHERE slug = 'esthetician-apprenticeship-course')
ON CONFLICT (slug) DO NOTHING;

-- Nail Technician Apprenticeship Course
INSERT INTO public.courses (
  program_id,
  slug,
  title,
  short_description,
  description,
  status,
  is_active,
  category,
  duration_hours,
  passing_score,
  published_at,
  created_at,
  updated_at
)
SELECT 
  p.id,
  'nail-technician-apprenticeship-course',
  'Nail Technician Apprenticeship - Complete Course',
  '400-hour Indiana nail technician license apprenticeship',
  'Indiana Nail Technician Apprenticeship covering manicures, pedicures, nail enhancements, and nail art. Prepares for Indiana nail technician license exam.',
  'published',
  true,
  'Nail Technology',
  400,
  80,
  now(),
  now(),
  now()
FROM public.programs p
WHERE p.slug = 'nail-technician-apprenticeship'
  AND NOT EXISTS (SELECT 1 FROM public.courses WHERE slug = 'nail-technician-apprenticeship-course')
ON CONFLICT (slug) DO NOTHING;

-- Verify courses
SELECT slug, title, category, duration_hours, is_active 
FROM public.courses 
WHERE slug LIKE '%apprenticeship-course'
ORDER BY category;
