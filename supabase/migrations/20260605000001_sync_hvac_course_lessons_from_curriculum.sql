-- Migration: 20260605000001
--
-- Syncs HVAC course_lessons from curriculum_lessons.
-- Copies quiz_questions, passing_score, video_url, and lesson_type
-- for all 95 hvac-lesson-* rows.
--
-- Applied via REST API on 2026-06-05. Run this in Supabase Dashboard
-- SQL Editor if course_lessons ever needs to be rebuilt from scratch.

UPDATE course_lessons cl
SET
  video_url      = cur.video_file,
  quiz_questions = COALESCE(cl.quiz_questions, cur.quiz_questions),
  passing_score  = CASE
                     WHEN (cl.passing_score IS NULL OR cl.passing_score = 0)
                          AND cur.passing_score > 0
                     THEN cur.passing_score
                     ELSE cl.passing_score
                   END,
  lesson_type    = COALESCE(cur.step_type, cl.lesson_type),
  updated_at     = now()
FROM curriculum_lessons cur
WHERE cl.slug = cur.lesson_slug
  AND cl.slug LIKE 'hvac-lesson-%';
