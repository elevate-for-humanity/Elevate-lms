-- ============================================================
-- CONTENT SYNC FUNCTIONS
--
-- Provides two DB functions that replace the fragile one-time
-- migration promotion pattern:
--
-- format_script_to_html(input TEXT, p_title TEXT)
--   Converts plain-text script_text to valid HTML.
--   First line (or p_title if supplied) → <h2>
--   Remaining lines → <p> blocks
--   Idempotent — safe to call on already-HTML content.
--
-- promote_to_course_lessons(p_program_slug TEXT)
--   Reads published curriculum_lessons for a program and
--   upserts them into course_lessons with HTML content.
--   Hard-fails on empty script_text (content lessons only).
--   Hard-fails if no matching course_module exists.
--   Detects 0-based vs 1-based module_order automatically.
--   Idempotent — ON CONFLICT (course_id, slug) DO UPDATE.
--
-- Usage:
--   SELECT * FROM promote_to_course_lessons('peer-recovery-specialist-jri');
--   SELECT * FROM promote_to_course_lessons('certified-recovery-specialist');
--   SELECT * FROM promote_to_course_lessons('bookkeeping');
--
-- CRS and Bookkeeping will fail until script_text is authored.
-- That is the correct behavior.
--
-- Apply via Supabase Dashboard SQL Editor.
-- ============================================================

-- ------------------------------------------------------------
-- format_script_to_html
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.format_script_to_html(
  input   TEXT,
  p_title TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  lines      TEXT[];
  rest       TEXT;
BEGIN
  IF input IS NULL OR LENGTH(TRIM(input)) = 0 THEN
    RETURN NULL;
  END IF;

  lines := regexp_split_to_array(TRIM(input), E'\\n+');

  IF p_title IS NOT NULL AND TRIM(p_title) <> '' THEN
    -- Title supplied: all lines become paragraph body
    rest := array_to_string(lines, E'\\n');
    rest := regexp_replace(rest, E'\\n+', '</p><p>', 'g');
    RETURN '<h2>' || TRIM(p_title) || '</h2><p>' || rest || '</p>';
  ELSE
    -- No title: first line becomes h2, rest becomes paragraphs
    rest := array_to_string(lines[2:array_length(lines,1)], E'\\n');
    rest := regexp_replace(rest, E'\\n+', '</p><p>', 'g');
    RETURN '<h2>' || TRIM(lines[1]) || '</h2><p>' || rest || '</p>';
  END IF;
END $$;

-- ------------------------------------------------------------
-- promote_to_course_lessons
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.promote_to_course_lessons(p_program_slug TEXT)
RETURNS TABLE(lesson_slug TEXT, action TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
  rec              RECORD;
  v_html           TEXT;
  v_course_id      UUID;
  v_program_id     UUID;
  v_upserted       INTEGER := 0;
  v_module_offset  INTEGER := 0;
  v_min_mod_order  INTEGER;
BEGIN
  -- 1. Resolve program
  SELECT id INTO v_program_id
  FROM public.programs
  WHERE slug = p_program_slug
  LIMIT 1;

  IF v_program_id IS NULL THEN
    RAISE EXCEPTION 'PROMOTE_FAILED: program slug % not found', p_program_slug;
  END IF;

  -- 2. Resolve canonical course
  SELECT id INTO v_course_id
  FROM public.courses
  WHERE program_id = v_program_id
  LIMIT 1;

  IF v_course_id IS NULL THEN
    RAISE EXCEPTION 'PROMOTE_FAILED: no courses row for program %', p_program_slug;
  END IF;

  -- 3. Detect module_order base (0-based vs 1-based)
  -- course_modules.order_index is always 1-based.
  -- curriculum_lessons.module_order may be 0-based or 1-based depending on seed.
  SELECT MIN(module_order) INTO v_min_mod_order
  FROM public.curriculum_lessons
  WHERE program_id = v_program_id AND status = 'published';

  v_module_offset := CASE WHEN v_min_mod_order = 0 THEN 1 ELSE 0 END;

  RAISE NOTICE 'promote_to_course_lessons(%): course_id=% module_offset=%',
    p_program_slug, v_course_id, v_module_offset;

  -- 4. Promote each published curriculum_lesson
  FOR rec IN
    SELECT
      cl.id              AS curriculum_id,
      cl.lesson_slug,
      cl.lesson_title,
      cl.script_text,
      cl.quiz_questions,
      cl.passing_score,
      cl.step_type,
      cl.module_order,
      cl.lesson_order,
      (SELECT cm.id
       FROM public.course_modules cm
       WHERE cm.course_id = v_course_id
         AND cm.order_index = cl.module_order + v_module_offset
       LIMIT 1) AS course_module_id
    FROM public.curriculum_lessons cl
    WHERE cl.program_id = v_program_id
      AND cl.status = 'published'
    ORDER BY cl.module_order, cl.lesson_order
  LOOP
    -- Hard fail on empty script_text for content lessons
    IF rec.step_type NOT IN ('checkpoint', 'exam', 'quiz') THEN
      IF rec.script_text IS NULL OR LENGTH(TRIM(rec.script_text)) = 0 THEN
        RAISE EXCEPTION
          'PROMOTE_FAILED: lesson % (%) has empty script_text — author content before promoting',
          rec.lesson_slug, rec.lesson_title;
      END IF;
    END IF;

    -- Hard fail if no matching course_module
    IF rec.course_module_id IS NULL THEN
      RAISE EXCEPTION
        'PROMOTE_FAILED: lesson % has no matching course_module (module_order=%) for course %',
        rec.lesson_slug, rec.module_order, v_course_id;
    END IF;

    -- Transform plain text to HTML
    v_html := public.format_script_to_html(rec.script_text, rec.lesson_title);

    -- Upsert into course_lessons
    INSERT INTO public.course_lessons (
      id, course_id, module_id, legacy_lesson_id, slug, title,
      content, lesson_type, order_index, passing_score,
      quiz_questions, is_required, created_at, updated_at
    )
    VALUES (
      gen_random_uuid(),
      v_course_id,
      rec.course_module_id,
      rec.curriculum_id,
      rec.lesson_slug,
      rec.lesson_title,
      to_jsonb(v_html),
      CASE rec.step_type
        WHEN 'checkpoint'    THEN 'checkpoint'::public.lesson_type
        WHEN 'exam'          THEN 'exam'::public.lesson_type
        WHEN 'quiz'          THEN 'quiz'::public.lesson_type
        WHEN 'lab'           THEN 'lab'::public.lesson_type
        WHEN 'assignment'    THEN 'assignment'::public.lesson_type
        WHEN 'certification' THEN 'certification'::public.lesson_type
        ELSE 'lesson'::public.lesson_type
      END,
      (rec.module_order * 1000 + rec.lesson_order),
      CASE
        WHEN rec.step_type IN ('checkpoint', 'exam', 'quiz')
          THEN COALESCE(rec.passing_score, 70)
        ELSE 0
      END,
      rec.quiz_questions,
      true,
      now(),
      now()
    )
    ON CONFLICT (course_id, slug) DO UPDATE
    SET
      content        = EXCLUDED.content,
      lesson_type    = EXCLUDED.lesson_type,
      order_index    = EXCLUDED.order_index,
      passing_score  = EXCLUDED.passing_score,
      quiz_questions = EXCLUDED.quiz_questions,
      module_id      = EXCLUDED.module_id,
      updated_at     = now();

    v_upserted := v_upserted + 1;
    RETURN QUERY SELECT rec.lesson_slug::TEXT, 'upserted'::TEXT;
  END LOOP;

  RAISE NOTICE 'promote_to_course_lessons(%): upserted=%', p_program_slug, v_upserted;
END $$;

GRANT EXECUTE ON FUNCTION public.format_script_to_html(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.promote_to_course_lessons(TEXT) TO service_role;
