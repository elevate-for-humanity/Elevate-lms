-- Close demonstrated empty-program certificate eligibility; preserve existing progress checks.
CREATE OR REPLACE FUNCTION public.is_program_completion_eligible_internal(p_user_id uuid, p_program_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_use_curriculum     boolean;
  v_missing_content    integer;
  v_missing_pass       integer;
BEGIN
  -- Fail closed: an absent program or an empty/unrecognized requirement set
  -- must never qualify a learner for a program completion certificate.
  IF p_user_id IS NULL OR p_program_id IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.programs WHERE id = p_program_id
  ) THEN RETURN false; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.curriculum_lessons
    WHERE program_id = p_program_id
      AND step_type::text IN ('lesson','lab','assignment','certification','checkpoint','exam')
  ) AND NOT EXISTS (
    SELECT 1 FROM public.course_lessons l
    JOIN public.courses c ON c.id = l.course_id
    WHERE c.program_id = p_program_id
      AND l.lesson_type::text IN ('lesson','lab','assignment','certification','checkpoint','exam')
  ) THEN RETURN false; END IF;

  -- Determine which table owns this program's lessons.
  -- curriculum_lessons has a direct program_id FK.
  -- course_lessons is joined via courses.program_id.
  SELECT EXISTS (
    SELECT 1 FROM public.curriculum_lessons WHERE program_id = p_program_id LIMIT 1
  ) INTO v_use_curriculum;

  IF v_use_curriculum THEN
    -- ── curriculum_lessons path (HVAC + legacy) ──────────────────────────────

    SELECT COUNT(*)
    INTO v_missing_content
    FROM public.curriculum_lessons cl
    WHERE cl.program_id = p_program_id
      AND cl.step_type::text IN ('lesson', 'lab', 'assignment', 'certification')
      AND NOT EXISTS (
        SELECT 1 FROM public.lesson_progress lp
        WHERE lp.user_id   = p_user_id
          AND lp.lesson_id = cl.id
          AND (COALESCE(lp.completed, false) = true OR lp.completed_at IS NOT NULL)
      );

    IF v_missing_content > 0 THEN RETURN false; END IF;

    SELECT COUNT(*)
    INTO v_missing_pass
    FROM public.curriculum_lessons cl
    WHERE cl.program_id = p_program_id
      AND cl.step_type::text IN ('checkpoint', 'exam')
      AND NOT EXISTS (
        SELECT 1 FROM public.checkpoint_scores cs
        WHERE cs.user_id   = p_user_id
          AND cs.lesson_id = cl.id
          AND cs.passed    = true
      );

    IF v_missing_pass > 0 THEN RETURN false; END IF;

  ELSE
    -- ── course_lessons path (blueprint-seeded courses) ────────────────────────

    SELECT COUNT(*)
    INTO v_missing_content
    FROM public.course_lessons col
    JOIN public.courses c ON c.id = col.course_id
    WHERE c.program_id = p_program_id
      AND col.lesson_type::text IN ('lesson', 'lab', 'assignment', 'certification')
      AND NOT EXISTS (
        SELECT 1 FROM public.lesson_progress lp
        WHERE lp.user_id   = p_user_id
          AND lp.lesson_id = col.id
          AND (COALESCE(lp.completed, false) = true OR lp.completed_at IS NOT NULL)
      );

    IF v_missing_content > 0 THEN RETURN false; END IF;

    SELECT COUNT(*)
    INTO v_missing_pass
    FROM public.course_lessons col
    JOIN public.courses c ON c.id = col.course_id
    WHERE c.program_id = p_program_id
      AND col.lesson_type::text IN ('checkpoint', 'exam')
      AND NOT EXISTS (
        SELECT 1 FROM public.checkpoint_scores cs
        WHERE cs.user_id   = p_user_id
          AND cs.lesson_id = col.id
          AND cs.passed    = true
      );

    IF v_missing_pass > 0 THEN RETURN false; END IF;

  END IF;

  RETURN true;
END;
$function$
