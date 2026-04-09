-- Lesson publish gate
--
-- Creates a view that surfaces unpublishable lessons — those missing content,
-- video_url, or quiz_questions (for quiz/checkpoint/exam types).
-- Used by the admin dashboard and the course publish health check.
--
-- Does NOT add a hard constraint on course_lessons — the application layer
-- (publish route health check) is the enforcement point. The view is for
-- visibility and reporting.

CREATE OR REPLACE VIEW public.lesson_publish_blockers AS
SELECT
  cl.id          AS lesson_id,
  cl.slug,
  cl.title,
  cl.lesson_type,
  cl.course_id,
  cm.title       AS module_title,
  c.title        AS course_title,
  ARRAY_REMOVE(ARRAY[
    CASE WHEN cl.content IS NULL OR cl.content = '' THEN 'no_content' END,
    -- Assessments (checkpoint/quiz/exam) are quiz-only — video not required
    CASE WHEN cl.lesson_type NOT IN ('quiz', 'checkpoint', 'exam')
          AND (cl.video_url IS NULL OR cl.video_url = '')
         THEN 'no_video' END,
    -- Assessments must have quiz_questions
    CASE WHEN cl.lesson_type IN ('quiz', 'checkpoint', 'exam')
          AND (cl.quiz_questions IS NULL OR jsonb_array_length(cl.quiz_questions) = 0)
         THEN 'no_quiz_questions' END
  ], NULL) AS blocking_reasons
FROM public.course_lessons cl
JOIN public.course_modules cm ON cm.id = cl.module_id
JOIN public.courses         c  ON c.id  = cl.course_id
WHERE cl.is_published = true
  AND (
    cl.content IS NULL OR cl.content = ''
    OR (
      cl.lesson_type NOT IN ('quiz', 'checkpoint', 'exam')
      AND (cl.video_url IS NULL OR cl.video_url = '')
    )
    OR (
      cl.lesson_type IN ('quiz', 'checkpoint', 'exam')
      AND (cl.quiz_questions IS NULL OR jsonb_array_length(cl.quiz_questions) = 0)
    )
  );

COMMENT ON VIEW public.lesson_publish_blockers IS
  'Published lessons that are missing content, video_url, or quiz_questions. '
  'Used by the admin course health check and publish gate.';
