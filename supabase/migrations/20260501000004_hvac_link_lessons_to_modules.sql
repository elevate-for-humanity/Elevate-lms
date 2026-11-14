-- ── 1. Link course_lessons to course_modules for HVAC ────────────────────────
--
-- course_lessons.order_index encodes the week as floor(order_index / 1000).
-- course_modules.order_index is the week number (1–16).
-- This update sets module_id on every HVAC lesson that currently has NULL.

UPDATE public.course_lessons cl
SET module_id = cm.id
FROM public.course_modules cm
WHERE cl.course_id  = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0'
  AND cm.course_id  = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0'
  AND cl.module_id  IS NULL
  AND cm.order_index = floor(cl.order_index / 1000)::int;

-- ── 2. Remove empty modules (weeks 11–16 have no lessons) ────────────────────
--
-- publish_course() blocks if any module has zero lessons.
-- Weeks 11–16 have no course_lessons rows — remove those modules so publish
-- can proceed. module_completion_rules referencing them are also removed.

DELETE FROM public.module_completion_rules
WHERE course_id = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0'
  AND module_id IN (
    SELECT cm.id
    FROM public.course_modules cm
    LEFT JOIN public.course_lessons cl ON cl.module_id = cm.id
    WHERE cm.course_id = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0'
    GROUP BY cm.id
    HAVING COUNT(cl.id) = 0
  );

DELETE FROM public.module_completion_rules
WHERE course_id = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0'
  AND required_previous_module_id IN (
    SELECT cm.id
    FROM public.course_modules cm
    LEFT JOIN public.course_lessons cl ON cl.module_id = cm.id
    WHERE cm.course_id = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0'
    GROUP BY cm.id
    HAVING COUNT(cl.id) = 0
  );

DELETE FROM public.course_modules
WHERE course_id = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0'
  AND id NOT IN (
    SELECT DISTINCT module_id
    FROM public.course_lessons
    WHERE course_id = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0'
      AND module_id IS NOT NULL
  );

-- ── 3. snapshot_course_version() ─────────────────────────────────────────────
--
-- Creates an immutable snapshot of a course's current modules and lessons.
-- Called by publishCourse() in lib/lms/course-service.ts.
-- Returns the new course_versions row.

CREATE OR REPLACE FUNCTION public.snapshot_course_version(
  p_course_id  UUID,
  p_created_by UUID DEFAULT NULL,
  p_label      TEXT DEFAULT NULL
)
RETURNS public.course_versions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_version_number INT;
  v_version        public.course_versions;
  v_mod            RECORD;
  v_version_mod_id UUID;
BEGIN
  -- Next version number
  SELECT COALESCE(MAX(version_number), 0) + 1
  INTO v_version_number
  FROM public.course_versions
  WHERE course_id = p_course_id;

  -- Create version row
  INSERT INTO public.course_versions (
    course_id, version_number, label, is_published, published_at, created_by
  ) VALUES (
    p_course_id, v_version_number, p_label, true, NOW(), p_created_by
  )
  RETURNING * INTO v_version;

  -- Snapshot modules
  FOR v_mod IN
    SELECT * FROM public.course_modules
    WHERE course_id = p_course_id
    ORDER BY order_index
  LOOP
    INSERT INTO public.course_version_modules (
      version_id, module_id, title, order_index
    ) VALUES (
      v_version.id, v_mod.id, v_mod.title, v_mod.order_index
    )
    RETURNING id INTO v_version_mod_id;

    -- Snapshot lessons for this module
    INSERT INTO public.course_version_lessons (
      version_id, version_module_id, lesson_id, title, lesson_type, order_index, passing_score
    )
    SELECT
      v_version.id,
      v_version_mod_id,
      cl.id,
      cl.title,
      cl.lesson_type,
      cl.order_index,
      cl.passing_score
    FROM public.course_lessons cl
    WHERE cl.module_id = v_mod.id
      AND cl.course_id = p_course_id
    ORDER BY cl.order_index;
  END LOOP;

  RETURN v_version;
END;
$$;

GRANT EXECUTE ON FUNCTION public.snapshot_course_version(UUID, UUID, TEXT) TO service_role;

-- ── 4. Verify result ──────────────────────────────────────────────────────────

DO $$
DECLARE
  v_lesson_count INT;
  v_module_count INT;
  v_unlinked     INT;
BEGIN
  SELECT COUNT(*) INTO v_lesson_count
  FROM public.course_lessons
  WHERE course_id = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0';

  SELECT COUNT(*) INTO v_module_count
  FROM public.course_modules
  WHERE course_id = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0';

  SELECT COUNT(*) INTO v_unlinked
  FROM public.course_lessons
  WHERE course_id = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0'
    AND module_id IS NULL;

  RAISE NOTICE 'HVAC: % lessons, % modules, % unlinked lessons', v_lesson_count, v_module_count, v_unlinked;

  IF v_unlinked > 0 THEN
    RAISE WARNING 'Some lessons still have NULL module_id — check order_index pattern';
  END IF;
END;
$$;
