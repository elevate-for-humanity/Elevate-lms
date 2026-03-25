-- Add unique constraints on curriculum_lessons scoped to course_id.
--
-- The existing UNIQUE(program_id, lesson_slug) constraint provides no protection
-- when program_id is NULL (Postgres treats NULL != NULL in unique indexes).
-- These constraints ensure idempotent promotion regardless of program linkage.

ALTER TABLE public.curriculum_lessons
  ADD CONSTRAINT curriculum_lessons_course_id_lesson_order_key
    UNIQUE (course_id, lesson_order);

ALTER TABLE public.curriculum_lessons
  ADD CONSTRAINT curriculum_lessons_course_id_lesson_slug_key
    UNIQUE (course_id, lesson_slug);
