-- Correct cosmetology apprenticeship hours from 1500 to 2000.
-- Indiana DOL Registered Apprenticeship requires 2,000 hours, same as barber.
-- Previous migrations used the cosmetology school track number (1,500) in error.

-- Update programs table
UPDATE public.programs
SET
  total_hours = 2000,
  description = REPLACE(description, '1,500 hours', '2,000 hours')
WHERE slug = 'cosmetology-apprenticeship';

-- Update credential completion requirement
UPDATE public.completion_requirements
SET
  value = '2000',
  notes = 'Indiana DOL Registered Apprenticeship requires 2,000 clock hours for cosmetology licensure.'
WHERE
  program_id = (SELECT id FROM public.programs WHERE slug = 'cosmetology-apprenticeship')
  AND requirement_type = 'min_hours';

-- Update lms_lessons / course hours if stored on the course record
UPDATE public.training_courses
SET total_hours = 2000
WHERE program_id = (SELECT id FROM public.programs WHERE slug = 'cosmetology-apprenticeship')
  AND total_hours = 1500;
