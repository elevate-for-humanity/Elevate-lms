-- Merge duplicate bookkeeping courses into single canonical course.
--
-- Two courses existed for program bd503ebf (Bookkeeping):
--   db7aac84 - "Bookkeeping & QuickBooks Certified User" (Jan 2026, exam lessons mistyped as lesson)
--   566e2ef7 - "Intuit QuickBooks Online Certified User + Intuit Certified Bookkeeping Professional" (Apr 2026, correct types)
--
-- Both had identical 5-module / 43-lesson structure. Zero lesson_progress rows on either.
-- Kept 566e2ef7 (more complete, correct lesson_type on exams).
-- Migrated 9 curriculum_lessons from old course to keeper, then deleted old course.

-- Migrate curriculum_lessons to keeper course
UPDATE public.curriculum_lessons
SET course_id = '566e2ef7-6861-4736-9807-b4ff868fc908'
WHERE program_id = 'bd503ebf-d8e1-4c79-9efe-a72c001589b4'
  AND course_id  = 'db7aac84-e261-4cee-aa6b-57a465e07a9c';

-- Delete old course content
DELETE FROM public.course_lessons
WHERE module_id IN (
  SELECT id FROM public.course_modules
  WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
);

DELETE FROM public.course_modules
WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c';

DELETE FROM public.courses
WHERE id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c';
