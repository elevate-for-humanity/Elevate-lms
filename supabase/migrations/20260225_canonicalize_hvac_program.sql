-- Canonicalize HVAC program: one active slug, training_courses points to it.
--
-- Problem: three programs rows for HVAC with different IDs.
--   4226f7f6 (slug: hvac-technician) — canonical, matches application slug resolution
--   e5a053ca (slug: hvac-2024)       — training_courses pointed here (wrong)
--   7e7d355f (slug: hvac)            — unused
--
-- The application form resolves "HVAC Technician" → slug "hvac-technician" → 4226f7f6.
-- But training_courses.program_id was e5a053ca. Auto-enrollment queried by program_id
-- and found zero courses, so students got program_enrollments but no training_enrollments
-- and could not access lessons.

BEGIN;

-- Repoint HVAC Technician course to canonical program
UPDATE training_courses
SET program_id = '4226f7f6-fbc1-44b5-83e8-b12ea149e4c7'
WHERE id = 'f0593164-55be-5867-98e7-8a86770a8dd0'
  AND program_id = 'e5a053ca-7c85-4e82-9ea4-18d38d8e3548';

-- Repoint any applications that referenced the old program
UPDATE applications
SET program_id = '4226f7f6-fbc1-44b5-83e8-b12ea149e4c7'
WHERE program_id = 'e5a053ca-7c85-4e82-9ea4-18d38d8e3548';

-- Deactivate duplicate HVAC programs (kept for historical reference)
UPDATE programs SET is_active = false
WHERE id IN ('e5a053ca-7c85-4e82-9ea4-18d38d8e3548', '7e7d355f-5090-4fb1-a4a0-f88e1e977d83');

COMMIT;
