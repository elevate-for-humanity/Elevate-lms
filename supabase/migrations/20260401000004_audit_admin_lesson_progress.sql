-- =============================================================================
-- Audit trigger: admin-initiated lesson_progress completion changes.
--
-- Fires AFTER INSERT OR UPDATE on lesson_progress when:
--   1) The write is a completion event (completed transitions to true, or
--      completed_at is newly set), AND
--   2) The writer is not the learner themselves:
--        - auth.uid() IS NULL  → service_role / admin client (no JWT)
--        - auth.uid() != NEW.user_id → super_admin writing for another user
--
-- Learner self-writes (auth.uid() = NEW.user_id) are not logged here.
-- Those are the normal path and are implicitly evidenced by lesson_progress
-- rows themselves. Admin overrides are the gap — this closes it.
--
-- Writes to public.audit_logs with:
--   action       = 'admin_lesson_progress_override'
--   actor_id     = auth.uid() (null when service_role)
--   target_type  = 'lesson_progress'
--   target_id    = NEW.id
--   metadata     = full context including learner user_id, old/new state,
--                  lesson/course/module identifiers, and writer role signal
-- =============================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.audit_admin_lesson_progress_override()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_actor_id          uuid;
  v_is_completion     boolean;
  v_is_admin_write    boolean;
  v_old_completed     boolean;
  v_new_completed     boolean;
  v_old_completed_at  timestamptz;
  v_lesson_title      text;
  v_step_type         text;
  v_module_order      integer;
  v_writer_signal     text;
BEGIN
  v_actor_id         := auth.uid();
  v_old_completed    := COALESCE(OLD.completed, false);
  v_new_completed    := COALESCE(NEW.completed, false);
  v_old_completed_at := CASE WHEN TG_OP = 'UPDATE' THEN OLD.completed_at ELSE NULL END;

  -- Only audit completion writes.
  v_is_completion :=
       (TG_OP = 'INSERT' AND (v_new_completed = true OR NEW.completed_at IS NOT NULL))
    OR (TG_OP = 'UPDATE' AND (
           (v_old_completed = false AND v_new_completed = true)
        OR (v_old_completed_at IS NULL AND NEW.completed_at IS NOT NULL)
       ));

  IF NOT v_is_completion THEN
    RETURN NEW;
  END IF;

  -- Only audit when the writer is not the learner.
  --   v_actor_id IS NULL     → service_role (admin client, no JWT)
  --   v_actor_id != user_id  → super_admin writing for another user
  v_is_admin_write :=
       v_actor_id IS NULL
    OR v_actor_id != NEW.user_id;

  IF NOT v_is_admin_write THEN
    RETURN NEW;
  END IF;

  -- Classify the writer for the audit record.
  v_writer_signal := CASE
    WHEN v_actor_id IS NULL THEN 'service_role'
    ELSE 'super_admin_for_other_user'
  END;

  -- Resolve lesson metadata (best-effort — null if lesson not in curriculum_lessons).
  SELECT cl.lesson_title, cl.step_type::text, cl.module_order
  INTO v_lesson_title, v_step_type, v_module_order
  FROM public.curriculum_lessons cl
  WHERE cl.id = NEW.lesson_id;

  INSERT INTO public.audit_logs (
    action,
    actor_id,
    target_type,
    target_id,
    metadata,
    created_at
  ) VALUES (
    'admin_lesson_progress_override',
    v_actor_id,
    'lesson_progress',
    NEW.id::text,
    jsonb_build_object(
      'learner_user_id',  NEW.user_id,
      'lesson_id',        NEW.lesson_id,
      'lesson_title',     v_lesson_title,
      'step_type',        v_step_type,
      'module_order',     v_module_order,
      'course_id',        NEW.course_id,
      'old_completed',    v_old_completed,
      'new_completed',    v_new_completed,
      'old_completed_at', v_old_completed_at,
      'new_completed_at', NEW.completed_at,
      'writer',           v_writer_signal,
      'op',               TG_OP
    ),
    NOW()
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_admin_lesson_progress_override
  ON public.lesson_progress;

CREATE TRIGGER trg_audit_admin_lesson_progress_override
  AFTER INSERT OR UPDATE
  ON public.lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_admin_lesson_progress_override();

COMMIT;
