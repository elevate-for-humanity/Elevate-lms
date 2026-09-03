-- Progressive module release
--
-- Adds available_from (timestamptz) to course_modules.
-- When NULL → module is immediately available to enrolled students.
-- When set → module is hidden until that timestamp (UTC).
--
-- The LMS course page and lesson page both check this before rendering a module.
-- Admins bypass the gate (existing isAdminUser check).
--
-- Strategy for barber: release Module 1 now, schedule remaining modules
-- as content is completed. Set via admin UI or direct SQL update.

-- ── Schema ────────────────────────────────────────────────────────────────────
ALTER TABLE public.course_modules
  ADD COLUMN IF NOT EXISTS available_from timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS is_draft       boolean     NOT NULL DEFAULT false;

COMMENT ON COLUMN public.course_modules.available_from IS
  'When set, the module is hidden from students until this UTC timestamp. '
  'NULL = immediately available. Admins always see all modules.';

COMMENT ON COLUMN public.course_modules.is_draft IS
  'When true, the module is hidden from students regardless of available_from. '
  'Used during content authoring. Set to false when the module is ready to release.';

-- ── Barber Module 1: release immediately ─────────────────────────────────────
-- Module 1 (Infection Control & Safety) is the only fully complete module.
-- Set is_draft = false and available_from = NULL so it is visible now.
-- All other modules remain is_draft = true until content is complete.

UPDATE public.course_modules
SET
  is_draft       = false,
  available_from = NULL,
  updated_at     = now()
WHERE course_id   = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND order_index = (
    SELECT MIN(order_index)
    FROM public.course_modules
    WHERE course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  );

-- All other barber modules: mark as draft until explicitly released
UPDATE public.course_modules
SET
  is_draft   = true,
  updated_at = now()
WHERE course_id   = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND order_index > (
    SELECT MIN(order_index)
    FROM public.course_modules
    WHERE course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  );

-- ── View: module_release_status ───────────────────────────────────────────────
-- Quick visibility into which modules are live vs draft vs scheduled.
CREATE OR REPLACE VIEW public.module_release_status AS
SELECT
  cm.id,
  cm.course_id,
  c.title        AS course_title,
  cm.title       AS module_title,
  cm.order_index,
  cm.is_draft,
  cm.available_from,
  CASE
    WHEN cm.is_draft                                    THEN 'draft'
    WHEN cm.available_from IS NULL                      THEN 'live'
    WHEN cm.available_from <= now()                     THEN 'live'
    ELSE 'scheduled'
  END            AS release_status,
  (
    SELECT COUNT(*)
    FROM public.course_lessons cl
    WHERE cl.module_id = cm.id
  )              AS lesson_count,
  (
    SELECT COUNT(*)
    FROM public.course_lessons cl
    WHERE cl.module_id = cm.id
      AND cl.video_url IS NOT NULL
      AND cl.content   IS NOT NULL
  )              AS complete_lesson_count
FROM public.course_modules cm
JOIN public.courses c ON c.id = cm.course_id
ORDER BY cm.course_id, cm.order_index;

COMMENT ON VIEW public.module_release_status IS
  'Release state for all course modules. '
  'Use to track which modules are live, scheduled, or still in draft.';

-- ── How to release a module ───────────────────────────────────────────────────
-- Release immediately:
--   UPDATE course_modules SET is_draft = false, available_from = NULL
--   WHERE course_id = '3fb5ce19-...' AND order_index = 2;
--
-- Schedule for future release:
--   UPDATE course_modules SET is_draft = false, available_from = '2026-07-01 00:00:00+00'
--   WHERE course_id = '3fb5ce19-...' AND order_index = 2;
--
-- Check status:
--   SELECT * FROM public.module_release_status
--   WHERE course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
