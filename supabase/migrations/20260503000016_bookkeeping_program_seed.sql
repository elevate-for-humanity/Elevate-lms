-- Migration: 20260503000016_bookkeeping_program_seed.sql
--
-- NOTE: Original version of this migration wrote bookkeeping lessons to
-- curriculum_lessons. That was incorrect — curriculum_lessons is not read
-- by lms_lessons. The live bookkeeping course lessons were seeded directly
-- into course_lessons (course_id = db7aac84-e261-4cee-aa6b-57a465e07a9c)
-- via the admin API and migration 20260503000019.
--
-- This file is retained as a no-op placeholder so migration numbering stays
-- consistent. Do not re-run the original content.

SELECT 'bookkeeping_program_seed: no-op placeholder — lessons live in course_lessons' AS status;
