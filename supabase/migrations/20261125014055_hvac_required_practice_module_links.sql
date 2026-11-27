-- Preserve the four existing published EPA practice tests and all their scores.
-- Their stale Module 10 relationship hid them from the consolidated course map.
-- Keep the final practice tests after the instructional sequence by linking to
-- the published final consolidated module, not earlier Core/Type modules.
-- Resolve module identity by the verified canonical course and module title;
-- never create another lesson, assessment, enrollment, or completion record.
DO $migration$
DECLARE
  target_course uuid;
  target_module uuid;
  target_lesson uuid;
  prior_module uuid;
  mapping record;
BEGIN
  -- Fresh installations can legitimately have no authored HVAC course yet.
  IF NOT EXISTS (SELECT 1 FROM public.courses WHERE slug = 'epa608-replacement-20261019') THEN
    RETURN;
  END IF;
  SELECT id INTO STRICT target_course
  FROM public.courses
  WHERE slug = 'epa608-replacement-20261019'
    AND status = 'published' AND is_active = true;

  FOR mapping IN
    SELECT * FROM (VALUES
      ('hvac-required-practice-core', 'Practical Skills and Career Support'),
      ('hvac-required-practice-type-i', 'Practical Skills and Career Support'),
      ('hvac-required-practice-type-ii', 'Practical Skills and Career Support'),
      ('hvac-required-practice-type-iii', 'Practical Skills and Career Support')
    ) AS targets(lesson_slug, module_title)
  LOOP
    SELECT id INTO STRICT target_module
    FROM public.course_modules
    WHERE course_id = target_course AND title = mapping.module_title
      AND is_published = true;

    SELECT id, module_id INTO STRICT target_lesson, prior_module
    FROM public.course_lessons
    WHERE course_id = target_course AND slug = mapping.lesson_slug
      AND is_published = true AND lesson_type = 'quiz';

    IF prior_module IS DISTINCT FROM target_module THEN
      IF NOT EXISTS (
        SELECT 1 FROM public.course_modules
        WHERE id = prior_module AND course_id = target_course
          AND title = 'Module 10: Career Readiness & Program Completion'
          AND is_published = false
      ) THEN
        RAISE EXCEPTION 'HVAC practice module changed unexpectedly for %', mapping.lesson_slug;
      END IF;

      UPDATE public.course_lessons
      SET module_id = target_module
      WHERE id = target_lesson AND course_id = target_course
        AND module_id = prior_module;
      IF NOT FOUND THEN
        RAISE EXCEPTION 'HVAC practice module changed concurrently for %', mapping.lesson_slug;
      END IF;
    END IF;
  END LOOP;
END
$migration$;
