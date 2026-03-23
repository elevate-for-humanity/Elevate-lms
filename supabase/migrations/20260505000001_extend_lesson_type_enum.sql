-- Extend the lesson_type enum to include all canonical LessonType values.
--
-- Current enum (from probe): lesson, quiz, checkpoint, lab, assignment, exam, certification
-- Adding: reading, video, simulation, practicum, externship, clinical, observation,
--         final_exam, capstone
--
-- 'reading' is the canonical replacement for 'lesson' (new code uses 'reading').
-- 'final_exam' replaces 'exam' (legacy value retained for backward compat).
-- All existing rows using old values remain valid — no data migration needed.
--
-- Apply in Supabase Dashboard → SQL Editor before deploying code that writes
-- any of the new lesson_type values.

ALTER TYPE public.lesson_type ADD VALUE IF NOT EXISTS 'reading';
ALTER TYPE public.lesson_type ADD VALUE IF NOT EXISTS 'video';
ALTER TYPE public.lesson_type ADD VALUE IF NOT EXISTS 'simulation';
ALTER TYPE public.lesson_type ADD VALUE IF NOT EXISTS 'practicum';
ALTER TYPE public.lesson_type ADD VALUE IF NOT EXISTS 'externship';
ALTER TYPE public.lesson_type ADD VALUE IF NOT EXISTS 'clinical';
ALTER TYPE public.lesson_type ADD VALUE IF NOT EXISTS 'observation';
ALTER TYPE public.lesson_type ADD VALUE IF NOT EXISTS 'final_exam';
ALTER TYPE public.lesson_type ADD VALUE IF NOT EXISTS 'capstone';
