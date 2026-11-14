-- Access control DB function
-- Called by lib/lms/access-control.ts assertLessonAccess()
-- Returns: true = accessible, false = locked, null = lesson not found

CREATE OR REPLACE FUNCTION public.can_access_lesson(
  p_user_id   UUID,
  p_lesson_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_module_id  UUID;
  v_course_id  UUID;
BEGIN
  -- Resolve module and course for this lesson
  SELECT module_id, course_id
  INTO v_module_id, v_course_id
  FROM public.course_lessons
  WHERE id = p_lesson_id;

  -- Lesson not found → return NULL (caller maps to 404)
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  -- No module assignment → lesson is always accessible (standalone lesson)
  IF v_module_id IS NULL THEN
    RETURN true;
  END IF;

  -- Delegate to module unlock check
  RETURN public.check_module_unlock(p_user_id, v_course_id, v_module_id);
END;
$$;

-- training_courses → courses data migration
-- Copies any training_courses rows not yet in courses (slug-based dedup).
-- Run once after applying 20260402000006_canonical_curriculum.sql.
-- Safe to re-run (ON CONFLICT DO NOTHING).

INSERT INTO public.courses (
  legacy_course_id,
  slug,
  title,
  short_description,
  description,
  status,
  is_active,
  published_at,
  created_at,
  updated_at
)
SELECT
  tc.id,
  tc.slug,
  COALESCE(tc.title, tc.course_name, tc.slug),
  tc.summary,
  tc.description,
  CASE
    WHEN tc.is_published = true AND tc.is_active = true THEN 'published'::public.course_status
    WHEN tc.status = 'archived'                         THEN 'archived'::public.course_status
    ELSE 'draft'::public.course_status
  END,
  COALESCE(tc.is_active, false),
  CASE WHEN tc.is_published = true THEN tc.updated_at ELSE NULL END,
  tc.created_at,
  tc.updated_at
FROM public.training_courses tc
WHERE NOT EXISTS (
  SELECT 1 FROM public.courses c WHERE c.slug = tc.slug
)
  AND tc.slug IS NOT NULL
  AND tc.slug != '';
