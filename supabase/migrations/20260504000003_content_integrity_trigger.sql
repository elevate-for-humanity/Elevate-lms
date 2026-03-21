-- ============================================================
-- CONTENT INTEGRITY TRIGGER
--
-- Prevents null or empty ({}) content from being written into
-- course_lessons for published, active courses.
--
-- Scoped to published courses only — draft/shell courses are
-- not blocked, allowing content to be authored before publish.
--
-- Fires on INSERT and UPDATE. Hard-fails with a named exception.
-- Applied after promote_to_course_lessons() is deployed.
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_content_not_empty()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_course_status TEXT;
  v_course_active BOOLEAN;
BEGIN
  SELECT status, is_active INTO v_course_status, v_course_active
  FROM public.courses WHERE id = NEW.course_id;

  IF v_course_status = 'published' AND v_course_active = true THEN
    IF NEW.content IS NULL OR NEW.content = '{}'::jsonb THEN
      RAISE EXCEPTION
        'CONTENT_INTEGRITY_VIOLATION: course_lesson % (%) in published course % has null or empty content',
        NEW.id, NEW.slug, NEW.course_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_content_not_empty ON public.course_lessons;

CREATE TRIGGER trg_enforce_content_not_empty
  BEFORE INSERT OR UPDATE ON public.course_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_content_not_empty();
