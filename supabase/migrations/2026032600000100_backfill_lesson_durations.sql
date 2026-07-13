-- Backfill duration_minutes for HVAC course lessons.
-- All 60 lessons were seeded without duration values, causing the course page
-- to show "0m" total duration. Standard EPA 608 lesson = 15 min, checkpoint = 20 min.

UPDATE public.course_lessons
SET duration_minutes = CASE
  WHEN lesson_type IN ('checkpoint', 'quiz', 'exam') THEN 20
  ELSE 15
END
WHERE course_id = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0'
  AND duration_minutes IS NULL;

-- Same backfill for curriculum_lessons (source of truth for lms_lessons view)
UPDATE public.curriculum_lessons
SET duration_minutes = CASE
  WHEN step_type IN ('checkpoint', 'quiz', 'exam') THEN 20
  ELSE 15
END
WHERE duration_minutes IS NULL
  AND slug LIKE 'hvac-%';
