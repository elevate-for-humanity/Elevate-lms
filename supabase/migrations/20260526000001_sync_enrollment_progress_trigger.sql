-- Trigger: sync program_enrollments.progress_percent on every lesson_progress completion write.
--
-- Motivation: progress_percent is only updated by recordStepCompletion (the engine's
-- lesson-complete path). Quiz submit, course-complete, and submission-approval all write
-- to lesson_progress directly, bypassing the engine and leaving progress_percent stale.
-- This trigger closes all three gaps at the DB level so no application path can miss it.
--
-- Fires: AFTER INSERT OR UPDATE OF completed ON lesson_progress, FOR EACH ROW.
-- Guard: only acts when completed transitions false→true (or is inserted as true).
-- Lookup order: course_id direct match first, then program_id via courses table.

CREATE OR REPLACE FUNCTION public.sync_enrollment_progress_on_lesson_complete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total   int;
  v_done    int;
  v_pct     numeric(5,2);
  v_prog_id uuid;
BEGIN
  -- Only act on false→true transitions (or fresh inserts with completed=true).
  IF NOT (COALESCE(NEW.completed, false) = true AND COALESCE(OLD.completed, false) = false) THEN
    RETURN NEW;
  END IF;

  -- course_id is required to count lessons; skip if absent.
  IF NEW.course_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*) INTO v_total
    FROM course_lessons
    WHERE course_id = NEW.course_id AND is_required = true;

  SELECT COUNT(*) INTO v_done
    FROM lesson_progress
    WHERE user_id = NEW.user_id
      AND course_id = NEW.course_id
      AND completed = true;

  -- Guard against divide-by-zero; treat a course with no required lessons as 0%.
  v_pct := CASE WHEN v_total > 0 THEN ROUND((v_done::numeric / v_total) * 100, 2) ELSE 0 END;

  -- Direct match: enrollment linked by course_id.
  UPDATE program_enrollments
    SET progress_percent = v_pct,
        updated_at       = now()
    WHERE user_id  = NEW.user_id
      AND course_id = NEW.course_id;

  -- Fallback: enrollment linked by program_id when course_id FK is absent.
  IF NOT FOUND THEN
    SELECT program_id INTO v_prog_id
      FROM courses
      WHERE id = NEW.course_id;

    IF v_prog_id IS NOT NULL THEN
      UPDATE program_enrollments
        SET progress_percent = v_pct,
            updated_at       = now()
        WHERE user_id    = NEW.user_id
          AND program_id = v_prog_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Drop and recreate so re-runs are idempotent.
DROP TRIGGER IF EXISTS trg_sync_enrollment_progress ON public.lesson_progress;

CREATE TRIGGER trg_sync_enrollment_progress
  AFTER INSERT OR UPDATE OF completed
  ON public.lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_enrollment_progress_on_lesson_complete();
