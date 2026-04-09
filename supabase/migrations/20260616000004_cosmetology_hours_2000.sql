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

-- training_courses.total_hours does not exist in the live schema — skipped.
