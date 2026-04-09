-- Migration: 20260408000001
--
-- Backfills course_id on program_enrollments for barber and HVAC programs.
-- All existing enrollments have course_id = NULL because runBarberPostPayment()
-- and the HVAC enrollment pipeline never set it. Students paid but had no
-- LMS course linked to their enrollment.
--
-- Also publishes the barber course (was stuck in draft).
--
-- Apply in Supabase Dashboard → SQL Editor.

-- 1. Publish the barber course (was draft)
UPDATE public.courses
SET status = 'published'
WHERE id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND slug = 'barber-apprenticeship';

-- 2. Backfill course_id for all barber enrollments
UPDATE public.program_enrollments
SET course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
WHERE program_slug = 'barber-apprenticeship'
  AND course_id IS NULL;

-- 3. Backfill course_id for all HVAC enrollments
UPDATE public.program_enrollments
SET course_id = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0'
WHERE program_slug IN ('hvac-technician', 'hvac', 'hvac-epa-608')
  AND course_id IS NULL;

-- Verify
SELECT
  program_slug,
  course_id,
  COUNT(*) AS enrollments
FROM public.program_enrollments
WHERE program_slug IN ('barber-apprenticeship', 'hvac-technician', 'hvac', 'hvac-epa-608')
GROUP BY program_slug, course_id
ORDER BY program_slug;
