-- ENFORCEMENT MIGRATION
-- Canonical source of truth: courses / course_modules / course_lessons
-- Legacy disconnected: training_courses, training_lessons, curriculum_lessons, modules, lms_lessons view
-- lesson_progress stays - references course_lessons.id via lesson_id

-- ── 1. module_completion_rules ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.module_completion_rules (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id                   UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id                   UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  required_previous_module_id UUID REFERENCES public.course_modules(id) ON DELETE SET NULL,
  required_checkpoint_lesson_id UUID REFERENCES public.course_lessons(id) ON DELETE SET NULL,
  minimum_score               INTEGER,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
  UNIQUE(course_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_mcr_course_id  ON public.module_completion_rules(course_id);
CREATE INDEX IF NOT EXISTS idx_mcr_module_id  ON public.module_completion_rules(module_id);

-- ── 2. student_module_progress ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.student_module_progress (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id    UUID NOT NULL REFERENCES public.courses(id)  ON DELETE CASCADE,
  module_id    UUID NOT NULL REFERENCES public.course_modules(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'locked',
               CHECK (status IN ('locked','unlocked','in_progress','completed')),
  unlocked_at  TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
  UNIQUE(user_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_smp_user_id   ON public.student_module_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_smp_course_id ON public.student_module_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_smp_module_id ON public.student_module_progress(module_id);

-- ── 3. Seed HVAC module_completion_rules (each module requires previous) ──────

INSERT INTO public.module_completion_rules (course_id, module_id, required_previous_module_id, minimum_score)
SELECT
  c.id AS course_id,
  cm.id AS module_id,
  prev.id AS required_previous_module_id,
  NULL AS minimum_score
FROM public.courses c
JOIN public.course_modules cm ON cm.course_id = c.id
LEFT JOIN public.course_modules prev
  ON prev.course_id = c.id
  AND COALESCE(prev.order_index, prev."order") =
      COALESCE(cm.order_index, cm."order") - 1
WHERE c.slug = 'hvac-technician'
  AND COALESCE(cm.order_index, cm."order") > 1
ON CONFLICT (course_id, module_id) DO NOTHING;

-- Seed checkpoint rules: each module's checkpoint lesson gates the next module
INSERT INTO public.module_completion_rules (course_id, module_id, required_previous_module_id, required_checkpoint_lesson_id, minimum_score)
SELECT
  c.id,
  next_cm.id,
  cm.id,
  cl.id,
  70
FROM public.courses c
JOIN public.course_modules cm ON cm.course_id = c.id
JOIN public.course_lessons cl
  ON cl.course_id = c.id
  AND cl.lesson_type = 'checkpoint'
  AND cl.order_index / 1000 = COALESCE(cm.order_index, cm."order")
JOIN public.course_modules next_cm
  ON next_cm.course_id = c.id
  AND COALESCE(next_cm.order_index, next_cm."order") =
      COALESCE(cm.order_index, cm."order") + 1
WHERE c.slug = 'hvac-technician'
ON CONFLICT (course_id, module_id) DO UPDATE
  SET required_checkpoint_lesson_id = EXCLUDED.required_checkpoint_lesson_id,
      minimum_score = EXCLUDED.minimum_score;

-- ── 4. Replace lms_lessons view → canonical course_lessons ─────────────────────

DROP VIEW IF EXISTS public.lms_lessons CASCADE;

CREATE OR REPLACE VIEW public.lms_lessons AS
SELECT
  cl.id,
  cl.course_id,
  cl.order_index                          AS lesson_number,
  cl.title,
  (cl.content#>>'{}')                     AS content,
  cl.lesson_type                          AS step_type,
  cl.lesson_type::TEXT                    AS content_type,
  cl.slug                                 AS lesson_slug,
  cl.passing_score,
  cl.quiz_questions,
  cl.module_id,
  cm.title                                AS module_title,
  COALESCE(cm.order_index, cm."order")    AS module_order,
  cl.order_index - (COALESCE(cm.order_index, cm."order") * 1000) AS lesson_order,
  NULL::INTEGER                           AS duration_minutes,
  'canonical'                             AS lesson_source,
  cl.created_at,
  cl.updated_at
FROM public.course_lessons cl
LEFT JOIN public.course_modules cm ON cm.id = cl.module_id;

GRANT SELECT ON public.lms_lessons TO authenticated, anon, service_role;

-- ── 5. RLS on new tables ──────────────────────────────────────────────────────

ALTER TABLE public.module_completion_rules  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_module_progress  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to mcr"
  ON public.module_completion_rules USING (auth.role() = 'service_role');
CREATE POLICY "Authenticated read mcr"
  ON public.module_completion_rules FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role full access to smp"
  ON public.student_module_progress USING (auth.role() = 'service_role');
CREATE POLICY "Users read own module progress"
  ON public.student_module_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users write own module progress"
  ON public.student_module_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own module progress"
  ON public.student_module_progress FOR UPDATE USING (auth.uid() = user_id);

GRANT SELECT ON public.module_completion_rules TO authenticated, anon;
GRANT ALL    ON public.module_completion_rules TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.student_module_progress TO authenticated;
GRANT ALL    ON public.student_module_progress TO service_role;

-- ── 6. module_unlock function — deterministic, no UI override ─────────────────

CREATE OR REPLACE FUNCTION public.check_module_unlock(
  p_user_id  UUID,
  p_course_id UUID,
  p_module_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rule        public.module_completion_rules%ROWTYPE;
  v_prev_status TEXT;
  v_score       INTEGER;
BEGIN
  -- Module 1 (no rule) is always unlocked
  SELECT * INTO v_rule
  FROM public.module_completion_rules
  WHERE course_id = p_course_id AND module_id = p_module_id;

  IF NOT FOUND THEN
    RETURN true;
  END IF;

  -- Check previous module completed
  IF v_rule.required_previous_module_id IS NOT NULL THEN
    SELECT status INTO v_prev_status
    FROM public.student_module_progress
    WHERE user_id = p_user_id AND module_id = v_rule.required_previous_module_id;

    IF v_prev_status IS DISTINCT FROM 'completed' THEN
      RETURN false;
    END IF;
  END IF;

  -- Check checkpoint score if required
  IF v_rule.required_checkpoint_lesson_id IS NOT NULL THEN
    SELECT score INTO v_score
    FROM public.checkpoint_scores
    WHERE user_id = p_user_id
      AND lesson_id = v_rule.required_checkpoint_lesson_id
      AND passed = true
    ORDER BY created_at DESC
    LIMIT 1;

    IF NOT FOUND THEN RETURN false; END IF;

    IF v_rule.minimum_score IS NOT NULL AND v_score < v_rule.minimum_score THEN
      RETURN false;
    END IF;
  END IF;

  RETURN true;
END;
$$;

-- ── 7. lesson_complete trigger → auto-unlock next module ─────────────────────

CREATE OR REPLACE FUNCTION public.on_lesson_complete_check_module_unlock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_module_id   UUID;
  v_course_id   UUID;
  v_next_module UUID;
  v_can_unlock  BOOLEAN;
BEGIN
  IF NEW.completed IS NOT TRUE THEN RETURN NEW; END IF;

  -- Get module for this lesson
  SELECT module_id, course_id INTO v_module_id, v_course_id
  FROM public.course_lessons WHERE id = NEW.lesson_id;

  IF v_module_id IS NULL THEN RETURN NEW; END IF;

  -- Mark module in_progress if not already further along
  INSERT INTO public.student_module_progress (user_id, course_id, module_id, status, unlocked_at)
  VALUES (NEW.user_id, v_course_id, v_module_id, 'in_progress', now())
  ON CONFLICT (user_id, module_id) DO UPDATE
    SET status = CASE
      WHEN student_module_progress.status IN ('locked','unlocked') THEN 'in_progress'
      ELSE student_module_progress.status
    END,
    updated_at = now();

  -- Check if all lessons in this module are complete
  IF NOT EXISTS (
    SELECT 1 FROM public.course_lessons cl
    LEFT JOIN public.lesson_progress lp
      ON lp.lesson_id = cl.id AND lp.user_id = NEW.user_id
    WHERE cl.module_id = v_module_id
      AND cl.is_required = true
      AND (lp.completed IS NOT TRUE)
  ) THEN
    -- Mark module completed
    UPDATE public.student_module_progress
    SET status = 'completed', completed_at = now(), updated_at = now()
    WHERE user_id = NEW.user_id AND module_id = v_module_id;

    -- Log audit event
    PERFORM public.log_audit_event(
      NEW.user_id, 'module', v_module_id, 'module_completed',
      jsonb_build_object('course_id', v_course_id)
    );

    -- Find next module and check if it can unlock
    SELECT cm.id INTO v_next_module
    FROM public.course_modules cm
    JOIN public.courses c ON c.id = cm.course_id
    WHERE c.id = v_course_id
      AND COALESCE(cm.order_index, cm."order") = (
        SELECT COALESCE(order_index, "order") + 1
        FROM public.course_modules
        WHERE id = v_module_id
      );

    IF v_next_module IS NOT NULL THEN
      SELECT public.check_module_unlock(NEW.user_id, v_course_id, v_next_module)
      INTO v_can_unlock;

      IF v_can_unlock THEN
        INSERT INTO public.student_module_progress (user_id, course_id, module_id, status, unlocked_at)
        VALUES (NEW.user_id, v_course_id, v_next_module, 'unlocked', now())
        ON CONFLICT (user_id, module_id) DO UPDATE
          SET status = 'unlocked', unlocked_at = now(), updated_at = now()
          WHERE student_module_progress.status = 'locked';

        PERFORM public.log_audit_event(
          NEW.user_id, 'module', v_next_module, 'module_unlocked',
          jsonb_build_object('course_id', v_course_id, 'unlocked_by_module', v_module_id)
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lesson_complete_unlock ON public.lesson_progress;
CREATE TRIGGER trg_lesson_complete_unlock
  AFTER INSERT OR UPDATE OF completed ON public.lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.on_lesson_complete_check_module_unlock();
