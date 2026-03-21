-- Migration: course content publish gate
--
-- Adds a DB-level function that blocks publishing a course if any of its
-- curriculum_lessons rows have null/empty script_text, or if any
-- checkpoint/quiz/exam lessons have no quiz_questions.
--
-- Also adds a check constraint on curriculum_lessons so script_text cannot
-- be set to an empty string (NULL is still allowed during authoring, but
-- the publish gate catches it before the course goes live).
--
-- Apply in Supabase Dashboard → SQL Editor before marking courses ready.

-- ── 1. Content completeness check function ───────────────────────────────────

CREATE OR REPLACE FUNCTION public.can_publish_course(p_course_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_empty_content_count  INTEGER;
  v_missing_quiz_count   INTEGER;
  v_total_lessons        INTEGER;
BEGIN
  -- Count lessons with null or short script_text
  SELECT COUNT(*)
    INTO v_empty_content_count
    FROM public.curriculum_lessons
   WHERE course_id = p_course_id
     AND status   = 'published'
     AND (script_text IS NULL OR LENGTH(TRIM(script_text)) < 50);

  -- Count assessment lessons missing quiz_questions
  SELECT COUNT(*)
    INTO v_missing_quiz_count
    FROM public.curriculum_lessons
   WHERE course_id  = p_course_id
     AND status     = 'published'
     AND step_type  IN ('checkpoint', 'quiz', 'exam')
     AND (quiz_questions IS NULL OR jsonb_array_length(quiz_questions) = 0);

  -- Must have at least one lesson
  SELECT COUNT(*)
    INTO v_total_lessons
    FROM public.curriculum_lessons
   WHERE course_id = p_course_id
     AND status   = 'published';

  RETURN (
    v_total_lessons        > 0  AND
    v_empty_content_count  = 0  AND
    v_missing_quiz_count   = 0
  );
END;
$$;

-- ── 2. Publish gate trigger function ─────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.enforce_course_content_before_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_empty_count   INTEGER;
  v_missing_quiz  INTEGER;
BEGIN
  -- Only fire when status is being set to 'published'
  IF NEW.status = 'published' AND (OLD.status IS DISTINCT FROM 'published') THEN

    SELECT COUNT(*)
      INTO v_empty_count
      FROM public.curriculum_lessons
     WHERE course_id = NEW.id
       AND status    = 'published'
       AND (script_text IS NULL OR LENGTH(TRIM(script_text)) < 50);

    IF v_empty_count > 0 THEN
      RAISE EXCEPTION
        'Course publish blocked: % lesson(s) have empty or missing script_text. '
        'Populate all lesson content before publishing.',
        v_empty_count;
    END IF;

    SELECT COUNT(*)
      INTO v_missing_quiz
      FROM public.curriculum_lessons
     WHERE course_id = NEW.id
       AND status    = 'published'
       AND step_type IN ('checkpoint', 'quiz', 'exam')
       AND (quiz_questions IS NULL OR jsonb_array_length(quiz_questions) = 0);

    IF v_missing_quiz > 0 THEN
      RAISE EXCEPTION
        'Course publish blocked: % assessment lesson(s) (checkpoint/quiz/exam) have no quiz_questions. '
        'Add quiz data before publishing.',
        v_missing_quiz;
    END IF;

  END IF;

  RETURN NEW;
END;
$$;

-- ── 3. Attach trigger to training_courses ────────────────────────────────────

DROP TRIGGER IF EXISTS enforce_course_content_before_publish
  ON public.training_courses;

CREATE TRIGGER enforce_course_content_before_publish
  BEFORE UPDATE OF status
  ON public.training_courses
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_course_content_before_publish();

-- Also attach to courses table (new canonical table)
DROP TRIGGER IF EXISTS enforce_course_content_before_publish
  ON public.courses;

CREATE TRIGGER enforce_course_content_before_publish
  BEFORE UPDATE OF status
  ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_course_content_before_publish();

-- ── 4. Check constraint: no empty string script_text ─────────────────────────
-- NULL is allowed during authoring. Empty string is not.

ALTER TABLE public.curriculum_lessons
  DROP CONSTRAINT IF EXISTS curriculum_lessons_script_text_not_empty;

ALTER TABLE public.curriculum_lessons
  ADD CONSTRAINT curriculum_lessons_script_text_not_empty
  CHECK (script_text IS NULL OR LENGTH(TRIM(script_text)) >= 1);

-- ── Verify ────────────────────────────────────────────────────────────────────
-- SELECT public.can_publish_course('<course-uuid>');
-- Returns TRUE only when all published lessons have content + assessments have quizzes.
