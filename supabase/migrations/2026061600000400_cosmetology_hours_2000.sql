-- Correct cosmetology apprenticeship hours from 1500 to 2000.
-- Indiana DOL Registered Apprenticeship requires 2,000 hours, same as barber.
-- Previous migrations used the cosmetology school track number (1,500) in error.

-- Update programs table
UPDATE public.programs
SET
  total_hours = 2000,
  description = REPLACE(description, '1,500 hours', '2,000 hours')
WHERE slug = 'cosmetology-apprenticeship';

-- completion_requirements does not exist in the live schema — skipped.

-- Update training_courses (column is duration_hours, not total_hours)
UPDATE public.training_courses
SET duration_hours = 2000
WHERE program_id = (SELECT id FROM public.programs WHERE slug = 'cosmetology-apprenticeship')
  AND duration_hours = 1500;
