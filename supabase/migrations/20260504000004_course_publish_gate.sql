-- ============================================================
-- COURSE PUBLISH GATE
--
-- Prevents a course from being marked published (status='published'
-- or is_active=true) when it has zero course_lessons rows with
-- non-empty content.
--
-- This enforces the readiness contract at the DB level so the
-- application layer cannot accidentally publish empty courses
-- regardless of how the update is issued (API, admin UI, direct SQL).
--
-- Trigger fires BEFORE UPDATE on courses.
-- Only checks when status or is_active is changing to a published state.
-- Courses already published before this migration are not re-checked
-- (the trigger only fires on UPDATE, not on existing rows).
--
-- Apply via Supabase Dashboard SQL Editor.
-- ============================================================

CREATE OR REPLACE FUNCTION public.enforce_course_publish_readiness()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_content_count INTEGER;
  v_becoming_published BOOLEAN;
BEGIN
  -- Only act when transitioning INTO a published/active state
  v_becoming_published := (
    (NEW.status = 'published' AND (OLD.status IS DISTINCT FROM 'published'))
    OR
    (NEW.is_active = true AND (OLD.is_active IS DISTINCT FROM true))
  );

  IF NOT v_becoming_published THEN
    RETURN NEW;
  END IF;

  -- Count lessons with real content (non-null, non-empty JSONB object)
  SELECT COUNT(*) INTO v_content_count
  FROM public.course_lessons cl
  WHERE cl.course_id = NEW.id
    AND cl.content IS NOT NULL
    AND cl.content <> '{}'::jsonb
    AND cl.content::text <> 'null'
    AND LENGTH(TRIM(cl.content::text)) > 2; -- '""' is 2 chars, any real content is longer

  IF v_content_count = 0 THEN
    RAISE EXCEPTION
      'PUBLISH_BLOCKED: course % (%) has no authored lesson content. '
      'Run promote_to_course_lessons(''%'') after authoring script_text, then retry.',
      NEW.id,
      COALESCE(NEW.title, NEW.slug, 'unknown'),
      COALESCE(NEW.slug, NEW.id::text);
  END IF;

  RETURN NEW;
END $$;

-- Drop existing trigger if present (idempotent)
DROP TRIGGER IF EXISTS trg_enforce_course_publish_readiness ON public.courses;

CREATE TRIGGER trg_enforce_course_publish_readiness
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_course_publish_readiness();

COMMENT ON FUNCTION public.enforce_course_publish_readiness() IS
  'Blocks publishing a course that has zero authored lesson content. '
  'Fires on UPDATE when status transitions to published or is_active transitions to true.';
