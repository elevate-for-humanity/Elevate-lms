-- Release Module 1, lock all other barber modules as draft
--
-- Module 1 (Foundations & Safety) is fully complete:
--   6 lessons × 5-part structure + 4–5 quiz questions each
--   1 checkpoint × 10 questions, passing_score = 70
--   All videos assigned
--
-- All other modules remain is_draft = true until content is complete.
-- Release subsequent modules by setting is_draft = false when ready.

DO $$
DECLARE
  cid uuid := '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
  mod1_order int;
BEGIN
  -- Find Module 1's order_index (lowest in the course)
  SELECT MIN(order_index) INTO mod1_order
  FROM public.course_modules
  WHERE course_id = cid;

  -- Release Module 1
  UPDATE public.course_modules
  SET
    is_draft       = false,
    available_from = NULL,
    updated_at     = now()
  WHERE course_id   = cid
    AND order_index = mod1_order;

  -- Lock all other modules
  UPDATE public.course_modules
  SET
    is_draft   = true,
    updated_at = now()
  WHERE course_id   = cid
    AND order_index > mod1_order;

  -- Publish Module 1 lessons
  UPDATE public.course_lessons cl
  SET
    is_published = true,
    updated_at   = now()
  FROM public.course_modules cm
  WHERE cl.module_id  = cm.id
    AND cm.course_id  = cid
    AND cm.order_index = mod1_order;

  -- Ensure course itself is published
  UPDATE public.courses
  SET status = 'published', updated_at = now()
  WHERE id = cid AND status <> 'published';

END $$;

-- Verification:
-- SELECT title, order_index, is_draft, available_from
-- FROM public.course_modules
-- WHERE course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
-- ORDER BY order_index;
--
-- Module 1 → is_draft = false
-- All others → is_draft = true
