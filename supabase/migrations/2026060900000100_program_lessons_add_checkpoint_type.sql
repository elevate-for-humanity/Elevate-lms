-- Add 'checkpoint' to program_lessons.lesson_type CHECK constraint.
-- The builder route was mapping checkpoint → lesson as a workaround; this removes that need.

ALTER TABLE public.program_lessons
  DROP CONSTRAINT IF EXISTS program_lessons_lesson_type_check;

ALTER TABLE public.program_lessons
  ADD CONSTRAINT program_lessons_lesson_type_check
  CHECK (lesson_type IN ('lesson', 'quiz', 'lab', 'exam', 'orientation', 'checkpoint', 'assignment'));
