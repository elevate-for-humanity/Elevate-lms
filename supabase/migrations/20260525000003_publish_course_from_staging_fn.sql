-- Atomic course publish function.
--
-- Wraps the entire staging → publish pipeline in a single transaction:
--   1. Validates course exists and is draft
--   2. Publishes all course_lessons (is_published=true, status=published)
--   3. Batch-inserts into curriculum_lessons (skips existing by lesson_order)
--   4. Returns counts
--
-- Called from the route instead of separate PostgREST calls.
-- If any step fails, the entire transaction rolls back — no orphaned rows,
-- no partial publish state.
--
-- Usage from route:
--   const { data, error } = await db.rpc('publish_course_from_staging', {
--     p_course_id: courseId,
--     p_program_id: programId ?? null,
--   });

CREATE OR REPLACE FUNCTION public.publish_course_from_staging(
  p_course_id  UUID,
  p_program_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_course_status   TEXT;
  v_lessons_updated INTEGER;
  v_cl_inserted     INTEGER := 0;
  v_cl_skipped      INTEGER := 0;
  v_lesson          RECORD;
  v_mod             RECORD;
  v_script_text     TEXT;
  v_key_terms       TEXT[];
  v_content         JSONB;
  v_points          TEXT[];
  v_existing_orders INTEGER[];
BEGIN
  -- ── 1. Validate course ────────────────────────────────────────────────────
  SELECT status INTO v_course_status
    FROM public.courses
   WHERE id = p_course_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Course not found: %', p_course_id;
  END IF;

  IF v_course_status != 'draft' THEN
    RAISE EXCEPTION 'Course status=% — only draft courses can be published', v_course_status;
  END IF;

  -- ── 2. Publish course_lessons ─────────────────────────────────────────────
  UPDATE public.course_lessons
     SET is_published = true,
         status       = 'published',
         updated_at   = now()
   WHERE course_id = p_course_id;

  GET DIAGNOSTICS v_lessons_updated = ROW_COUNT;

  IF v_lessons_updated = 0 THEN
    RAISE EXCEPTION 'No course_lessons found for course %', p_course_id;
  END IF;

  -- ── 2b. Flip course status to published ───────────────────────────────────
  UPDATE public.courses
     SET status     = 'published',
         is_active  = true,
         updated_at = now()
   WHERE id = p_course_id;

  -- ── 3. Collect existing curriculum_lessons orders (idempotency) ───────────
  SELECT ARRAY_AGG(lesson_order)
    INTO v_existing_orders
    FROM public.curriculum_lessons
   WHERE course_id = p_course_id;

  v_existing_orders := COALESCE(v_existing_orders, ARRAY[]::INTEGER[]);

  -- ── 4. Insert curriculum_lessons ──────────────────────────────────────────
  FOR v_lesson IN
    SELECT cl.id, cl.module_id, cl.title, cl.slug, cl.lesson_type,
           cl.order_index, cl.passing_score, cl.content
      FROM public.course_lessons cl
     WHERE cl.course_id = p_course_id
       AND cl.lesson_type IN ('lesson', 'checkpoint', 'exam')
     ORDER BY cl.order_index
  LOOP
    -- Skip already-promoted rows
    IF v_lesson.order_index = ANY(v_existing_orders) THEN
      v_cl_skipped := v_cl_skipped + 1;
      CONTINUE;
    END IF;

    -- Resolve module metadata
    SELECT title, order_index INTO v_mod
      FROM public.course_modules
     WHERE id = v_lesson.module_id;

    -- Parse content → script_text + key_terms
    v_content := COALESCE(v_lesson.content::JSONB, '{}'::JSONB);
    v_points  := ARRAY(SELECT jsonb_array_elements_text(v_content->'learning_points'));
    v_script_text := COALESCE(
      CASE WHEN array_length(v_points, 1) > 0
           THEN 'Learning Points:' || chr(10) || array_to_string(
                  ARRAY(SELECT '• ' || p FROM unnest(v_points) p), chr(10))
           ELSE NULL
      END, ''
    );
    IF (v_content->>'scenario') IS NOT NULL AND length(v_content->>'scenario') > 0 THEN
      v_script_text := v_script_text || chr(10) || chr(10) || 'Scenario:' || chr(10) || (v_content->>'scenario');
    END IF;

    v_key_terms := ARRAY(
      SELECT p FROM unnest(v_points) p LIMIT 5
    );

    INSERT INTO public.curriculum_lessons (
      course_id, program_id, lesson_slug, lesson_title, lesson_order,
      module_order, module_title, step_type, passing_score,
      script_text, key_terms, status
    ) VALUES (
      p_course_id,
      p_program_id,
      v_lesson.slug,
      v_lesson.title,
      v_lesson.order_index,
      COALESCE(v_mod.order_index, 0),
      COALESCE(v_mod.title, ''),
      -- Cast through TEXT: course_lessons.lesson_type (lesson_type enum)
      --                  → curriculum_lessons.step_type (step_type_enum)
      v_lesson.lesson_type::TEXT::public.step_type_enum,
      COALESCE(v_lesson.passing_score, 0),
      v_script_text,
      -- key_terms is JSONB in curriculum_lessons, TEXT[] in local variable
      to_jsonb(v_key_terms),
      'draft'
    );

    v_cl_inserted := v_cl_inserted + 1;
  END LOOP;

  RETURN jsonb_build_object(
    'lessons_published',           v_lessons_updated,
    'curriculum_lessons_inserted', v_cl_inserted,
    'curriculum_lessons_skipped',  v_cl_skipped
  );
END;
$$;

-- Grant execute to service role only (called server-side with admin client)
REVOKE EXECUTE ON FUNCTION public.publish_course_from_staging(UUID, UUID) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.publish_course_from_staging(UUID, UUID) TO service_role;

COMMENT ON FUNCTION public.publish_course_from_staging IS
  'Atomically publishes course_lessons and archives to curriculum_lessons in one transaction. '
  'Replaces the multi-step PostgREST approach in the generate-and-publish-course route. '
  'Any failure rolls back all writes — no orphaned rows, no partial publish state.';
