-- Prevent missing-only Course Builder refreshes from inserting a second module at an occupied order_index.
CREATE OR REPLACE FUNCTION public.publish_course_package_atomic(p_program_id uuid, p_course_slug text, p_course_title text, p_mode text, p_modules jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_course_id uuid;
  v_module jsonb;
  v_lesson jsonb;
  v_module_id uuid;
  v_lesson_id uuid;
  v_module_count integer := 0;
  v_lesson_count integer := 0;
  v_skipped_count integer := 0;
  v_lesson_type text;
BEGIN
  IF p_mode NOT IN ('replace', 'missing-only', 'refresh') THEN
    RAISE EXCEPTION 'Unsupported course publish mode: %', p_mode;
  END IF;
  IF nullif(trim(p_course_slug), '') IS NULL THEN
    RAISE EXCEPTION 'course_slug is required';
  END IF;
  IF jsonb_typeof(coalesce(p_modules, '[]'::jsonb)) <> 'array' THEN
    RAISE EXCEPTION 'modules payload must be a JSON array';
  END IF;

  SELECT id INTO v_course_id
  FROM public.courses
  WHERE slug = p_course_slug
  FOR UPDATE;

  IF v_course_id IS NULL THEN
    INSERT INTO public.courses (slug, title, program_id, status, is_active)
    VALUES (p_course_slug, p_course_title, p_program_id, 'draft'::course_status, false)
    RETURNING id INTO v_course_id;
  ELSE
    UPDATE public.courses
    SET title = p_course_title,
        program_id = coalesce(p_program_id, program_id),
        status = 'draft'::course_status,
        is_active = false,
        updated_at = now()
    WHERE id = v_course_id;
  END IF;

  IF p_mode = 'replace' THEN
    DELETE FROM public.course_lessons WHERE course_id = v_course_id;
    DELETE FROM public.course_modules WHERE course_id = v_course_id;
  END IF;

  FOR v_module IN
    SELECT value FROM jsonb_array_elements(coalesce(p_modules, '[]'::jsonb))
  LOOP
    v_module_id := NULL;
    IF p_mode IN ('missing-only', 'refresh') THEN
      SELECT id INTO v_module_id
      FROM public.course_modules
      WHERE course_id = v_course_id
        AND (
          slug = v_module->>'slug'
          OR order_index = coalesce((v_module->>'order_index')::integer, v_module_count + 1)
        )
      ORDER BY CASE WHEN slug = v_module->>'slug' THEN 0 ELSE 1 END, id
      LIMIT 1;
    END IF;

    IF v_module_id IS NULL THEN
      INSERT INTO public.course_modules (
        course_id, slug, title, description, order_index, is_published,
        domain_key, target_hours, is_required, is_draft
      ) VALUES (
        v_course_id,
        v_module->>'slug',
        v_module->>'title',
        nullif(v_module->>'description', ''),
        coalesce((v_module->>'order_index')::integer, v_module_count + 1),
        false,
        nullif(v_module->>'domain_key', ''),
        CASE WHEN nullif(v_module->>'target_hours', '') IS NOT NULL
          THEN (v_module->>'target_hours')::numeric ELSE NULL END,
        coalesce((v_module->>'is_required')::boolean, true),
        true
      ) RETURNING id INTO v_module_id;
    ELSE
      UPDATE public.course_modules
      SET slug = v_module->>'slug',
          title = v_module->>'title',
          description = nullif(v_module->>'description', ''),
          order_index = coalesce((v_module->>'order_index')::integer, order_index),
          domain_key = nullif(v_module->>'domain_key', ''),
          target_hours = CASE WHEN nullif(v_module->>'target_hours', '') IS NOT NULL
            THEN (v_module->>'target_hours')::numeric ELSE target_hours END,
          is_required = coalesce((v_module->>'is_required')::boolean, is_required),
          is_published = false,
          is_draft = true,
          updated_at = now()
      WHERE id = v_module_id;
    END IF;

    v_module_count := v_module_count + 1;

    FOR v_lesson IN
      SELECT value FROM jsonb_array_elements(coalesce(v_module->'lessons', '[]'::jsonb))
    LOOP
      v_lesson_id := NULL;
      v_lesson_type := coalesce(nullif(v_lesson->>'lesson_type', ''), 'lesson');

      IF p_mode IN ('missing-only', 'refresh') THEN
        SELECT id INTO v_lesson_id
        FROM public.course_lessons
        WHERE course_id = v_course_id AND slug = v_lesson->>'slug'
        ORDER BY id
        LIMIT 1;
      END IF;

      IF p_mode = 'missing-only' AND v_lesson_id IS NOT NULL THEN
        v_skipped_count := v_skipped_count + 1;
        CONTINUE;
      END IF;

      IF p_mode = 'refresh' AND v_lesson_id IS NOT NULL THEN
        UPDATE public.course_lessons
        SET module_id = v_module_id,
            title = v_lesson->>'title',
            lesson_type = v_lesson_type::lesson_type,
            order_index = coalesce((v_lesson->>'order_index')::integer, order_index),
            scenario_prompt = nullif(v_lesson->>'objective', ''),
            content = coalesce(v_lesson->'content', content),
            content_json = coalesce(v_lesson->'content_json', '{}'::jsonb),
            rendered_html = nullif(v_lesson->>'rendered_html', ''),
            quiz_questions = v_lesson->'quiz_questions',
            passing_score = CASE WHEN nullif(v_lesson->>'passing_score', '') IS NOT NULL
              THEN (v_lesson->>'passing_score')::integer ELSE NULL END,
            activities = v_lesson->'activities',
            duration_minutes = CASE WHEN nullif(v_lesson->>'duration_minutes', '') IS NOT NULL
              THEN (v_lesson->>'duration_minutes')::integer ELSE duration_minutes END,
            video_config = v_lesson->'video_config',
            learning_objectives = v_lesson->'learning_objectives',
            competency_checks = v_lesson->'competency_checks',
            instructor_notes = nullif(v_lesson->>'instructor_notes', ''),
            practical_required = coalesce((v_lesson->>'practical_required')::boolean, false),
            required_artifacts = CASE WHEN v_lesson ? 'required_artifacts'
              THEN array(SELECT jsonb_array_elements_text(v_lesson->'required_artifacts'))
              ELSE '{}'::text[] END,
            unlock_rule = v_lesson->'unlock_rule',
            partner_exam_code = nullif(v_lesson->>'partner_exam_code', ''),
            domain_key = nullif(v_lesson->>'domain_key', ''),
            hour_category = nullif(v_lesson->>'hour_category', ''),
            evidence_type = nullif(v_lesson->>'evidence_type', ''),
            delivery_method = nullif(v_lesson->>'delivery_method', ''),
            requires_instructor_signoff = coalesce((v_lesson->>'requires_instructor_signoff')::boolean, false),
            instructor_requirement = v_lesson->'instructor_requirement',
            minimum_seat_time_minutes = CASE WHEN nullif(v_lesson->>'minimum_seat_time_minutes', '') IS NOT NULL
              THEN (v_lesson->>'minimum_seat_time_minutes')::integer ELSE NULL END,
            fieldwork_eligible = coalesce((v_lesson->>'fieldwork_eligible')::boolean, false),
            is_required = coalesce((v_lesson->>'is_required')::boolean, true),
            ai_generated = coalesce((v_lesson->>'ai_generated')::boolean, false),
            approved = coalesce((v_lesson->>'approved')::boolean, false),
            compliance_profile_key = nullif(v_lesson->>'compliance_profile_key', ''),
            script_text = nullif(v_lesson->>'script_text', ''),
            script = nullif(v_lesson->>'script', ''),
            bullet_points = coalesce(v_lesson->'bullet_points', '[]'::jsonb),
            scene_data = v_lesson->'scene_data',
            generation_status = coalesce(nullif(v_lesson->>'generation_status', ''), 'generated'),
            last_generated_at = CASE WHEN nullif(v_lesson->>'last_generated_at', '') IS NOT NULL
              THEN (v_lesson->>'last_generated_at')::timestamptz ELSE now() END,
            status = 'draft',
            is_published = false,
            updated_at = now()
        WHERE id = v_lesson_id;
      ELSE
        INSERT INTO public.course_lessons (
          course_id, module_id, slug, title, lesson_type, order_index,
          scenario_prompt, content, content_json, rendered_html,
          quiz_questions, passing_score, activities, duration_minutes,
          video_url, video_config, learning_objectives, competency_checks,
          instructor_notes, practical_required, required_artifacts, unlock_rule,
          partner_exam_code, domain_key, hour_category, evidence_type,
          delivery_method, requires_instructor_signoff, instructor_requirement,
          minimum_seat_time_minutes, fieldwork_eligible, is_required,
          ai_generated, approved, compliance_profile_key, script_text, script,
          bullet_points, scene_data, generation_status, last_generated_at,
          status, is_published
        ) VALUES (
          v_course_id,
          v_module_id,
          v_lesson->>'slug',
          v_lesson->>'title',
          v_lesson_type::lesson_type,
          coalesce((v_lesson->>'order_index')::integer, v_lesson_count + 1),
          nullif(v_lesson->>'objective', ''),
          v_lesson->'content',
          coalesce(v_lesson->'content_json', '{}'::jsonb),
          nullif(v_lesson->>'rendered_html', ''),
          v_lesson->'quiz_questions',
          CASE WHEN nullif(v_lesson->>'passing_score', '') IS NOT NULL
            THEN (v_lesson->>'passing_score')::integer ELSE NULL END,
          v_lesson->'activities',
          CASE WHEN nullif(v_lesson->>'duration_minutes', '') IS NOT NULL
            THEN (v_lesson->>'duration_minutes')::integer ELSE NULL END,
          nullif(v_lesson->>'video_url', ''),
          v_lesson->'video_config',
          v_lesson->'learning_objectives',
          v_lesson->'competency_checks',
          nullif(v_lesson->>'instructor_notes', ''),
          coalesce((v_lesson->>'practical_required')::boolean, false),
          CASE WHEN v_lesson ? 'required_artifacts'
            THEN array(SELECT jsonb_array_elements_text(v_lesson->'required_artifacts'))
            ELSE '{}'::text[] END,
          v_lesson->'unlock_rule',
          nullif(v_lesson->>'partner_exam_code', ''),
          nullif(v_lesson->>'domain_key', ''),
          nullif(v_lesson->>'hour_category', ''),
          nullif(v_lesson->>'evidence_type', ''),
          nullif(v_lesson->>'delivery_method', ''),
          coalesce((v_lesson->>'requires_instructor_signoff')::boolean, false),
          v_lesson->'instructor_requirement',
          CASE WHEN nullif(v_lesson->>'minimum_seat_time_minutes', '') IS NOT NULL
            THEN (v_lesson->>'minimum_seat_time_minutes')::integer ELSE NULL END,
          coalesce((v_lesson->>'fieldwork_eligible')::boolean, false),
          coalesce((v_lesson->>'is_required')::boolean, true),
          coalesce((v_lesson->>'ai_generated')::boolean, false),
          coalesce((v_lesson->>'approved')::boolean, false),
          nullif(v_lesson->>'compliance_profile_key', ''),
          nullif(v_lesson->>'script_text', ''),
          nullif(v_lesson->>'script', ''),
          coalesce(v_lesson->'bullet_points', '[]'::jsonb),
          v_lesson->'scene_data',
          coalesce(nullif(v_lesson->>'generation_status', ''), 'generated'),
          CASE WHEN nullif(v_lesson->>'last_generated_at', '') IS NOT NULL
            THEN (v_lesson->>'last_generated_at')::timestamptz ELSE now() END,
          'draft',
          false
        ) RETURNING id INTO v_lesson_id;
      END IF;

      -- assessment_questions is the canonical assessment bank. Keep the legacy
      -- course_lessons.quiz_questions projection synchronized atomically.
      IF v_lesson_id IS NOT NULL AND v_lesson_type IN ('checkpoint', 'quiz', 'exam') THEN
        DELETE FROM public.assessment_questions WHERE lesson_id = v_lesson_id;

        IF jsonb_typeof(coalesce(v_lesson->'quiz_questions', '[]'::jsonb)) = 'array' THEN
          INSERT INTO public.assessment_questions (
            lesson_id, question_type, prompt, choices, correct_answer,
            explanation, competency_key, difficulty, domain_key, sort_order
          )
          SELECT
            v_lesson_id,
            'multiple_choice',
            coalesce(q.value->>'question', q.value->>'prompt'),
            coalesce(q.value->'options', '[]'::jsonb),
            coalesce(q.value->'correct', q.value->'correctAnswer'),
            nullif(q.value->>'explanation', ''),
            null,
            'medium',
            nullif(v_lesson->>'domain_key', ''),
            (q.ordinality - 1)::integer
          FROM jsonb_array_elements(coalesce(v_lesson->'quiz_questions', '[]'::jsonb))
               WITH ORDINALITY AS q(value, ordinality)
          WHERE coalesce(q.value->>'question', q.value->>'prompt') IS NOT NULL;
        END IF;
      END IF;

      v_lesson_count := v_lesson_count + 1;
    END LOOP;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'course_id', v_course_id,
    'module_count', v_module_count,
    'lesson_count', v_lesson_count,
    'skipped_count', v_skipped_count
  );
END;
$function$

