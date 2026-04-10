-- Barber course production cutover
--
-- Canonical course:  3fb5ce19-1cde-434c-a8c6-f138d7d7aa17  (courses table)
-- Canonical program: 5ff21fcb-1968-41fd-99d3-37d69a31bd5c  (programs table)
-- Bad program_id:    6b6937b2-b90d-42c9-bf0e-d92d517176ba  (apprenticeship_programs — wrong table)
-- Orphan course:     4a8621d2-24e6-4fe5-b3d5-7ac2b9805dbb  (slug: barber, no modules/lessons)
-- Broken enrollment: 7edadcf0-2831-492f-887d-6ba4303d38c9  (course_id = fbc35383, old training_courses row)
--
-- Run in Supabase Dashboard → SQL Editor.
-- Verify each SELECT before the UPDATE that follows it.
-- Apply in order — do not reorder.

-- ── STEP 1: Data integrity ────────────────────────────────────────────────────

-- 1A. Normalize all existing enrollments: program_id → programs.id (not apprenticeship_programs.id)
--     All 12 existing rows have program_id = 6b6937b2 (apprenticeship_programs).
--     enrollment-status route primary lookup is course_id, so these work today,
--     but the program_id fallback path will never match. Fix it permanently.
UPDATE public.program_enrollments pe
SET    program_id = '5ff21fcb-1968-41fd-99d3-37d69a31bd5c'
WHERE  pe.program_id = '6b6937b2-b90d-42c9-bf0e-d92d517176ba';

-- Verify: should return 0 rows after update
-- SELECT id, program_id FROM public.program_enrollments WHERE program_id = '6b6937b2-b90d-42c9-bf0e-d92d517176ba';

-- 1B. Fix the one enrollment pointing at the old training_courses row (fbc35383).
--     That course has no modules or lessons — learner would see an empty course.
UPDATE public.program_enrollments
SET    course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
WHERE  id = '7edadcf0-2831-492f-887d-6ba4303d38c9'
  AND  course_id = 'fbc35383-7408-451f-b299-af3d4ae3ab9c';

-- 1C. Deactivate orphan duplicate course (slug: barber, no modules, no lessons).
UPDATE public.courses
SET    is_active = false
WHERE  id = '4a8621d2-24e6-4fe5-b3d5-7ac2b9805dbb';

-- 1D. Prevent future duplicate slugs on courses.
--     Only add if constraint does not already exist.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_course_slug' AND conrelid = 'public.courses'::regclass
  ) THEN
    ALTER TABLE public.courses ADD CONSTRAINT unique_course_slug UNIQUE (slug);
  END IF;
END $$;

-- ── STEP 2: Enable course visibility ─────────────────────────────────────────

-- 2A. Flip program delivery flags so the learner dashboard surfaces this as LMS.
UPDATE public.programs
SET    has_lms_course = true,
       lms_model      = 'internal'
WHERE  id = '5ff21fcb-1968-41fd-99d3-37d69a31bd5c';
-- delivery_model left as 'external_admin' — constraint only allows external_admin|partner_managed|internal_lms
-- lms_model constraint allows: internal|hybrid (not self_paced|lms)

-- 2B. Publish all 7 draft modules.
--     Course page filters is_draft = false for non-admin users.
--     Only Module 1 is currently visible to learners.
UPDATE public.course_modules
SET    is_draft = false
WHERE  course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND  is_draft  = true;

-- Verify: should return 8 rows all with is_draft = false
-- SELECT title, order_index, is_draft FROM public.course_modules WHERE course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17' ORDER BY order_index;

-- 2C. Publish Module 6 lessons (currently draft — invisible to lms_lessons view).
--     lms_lessons view filters status = 'published'. These 5 return nothing today.
UPDATE public.course_lessons
SET    status       = 'published',
       is_published = true
WHERE  course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND  slug IN (
    'barber-lesson-35',
    'barber-lesson-36',
    'barber-lesson-37',
    'barber-lesson-38',
    'barber-module-6-checkpoint'
  );

-- ── STEP 3: Assign videos to lessons missing video_url ───────────────────────
--
-- All files exist in /public/videos/. Matched by topic:
--   checkpoint-1  → sanitation (module topic)
--   checkpoint-2  → shampoo/scalp (module topic)
--   checkpoint-3  → clipper techniques (module topic)
--   checkpoint-6  → styling (module topic)
--   checkpoint-7  → client experience (professional skills)
--   state-board exam → sanitation (most broadly applicable review video)

UPDATE public.course_lessons
SET    video_url = '/videos/course-barber-sanitation-narrated.mp4'
WHERE  course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND  slug      = 'barber-module-1-checkpoint'
  AND  video_url IS NULL;

UPDATE public.course_lessons
SET    video_url = '/videos/course-barber-shampoo-narrated.mp4'
WHERE  course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND  slug      = 'barber-module-2-checkpoint'
  AND  video_url IS NULL;

UPDATE public.course_lessons
SET    video_url = '/videos/course-barber-clipper-techniques.mp4'
WHERE  course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND  slug      = 'barber-module-3-checkpoint'
  AND  video_url IS NULL;

UPDATE public.course_lessons
SET    video_url = '/videos/course-barber-styling-narrated.mp4'
WHERE  course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND  slug      = 'barber-module-6-checkpoint'
  AND  video_url IS NULL;

UPDATE public.course_lessons
SET    video_url = '/videos/barber-client-experience.mp4'
WHERE  course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND  slug      = 'barber-module-7-checkpoint'
  AND  video_url IS NULL;

UPDATE public.course_lessons
SET    video_url = '/videos/course-barber-sanitation-narrated.mp4'
WHERE  course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND  slug      = 'barber-indiana-state-board-exam'
  AND  video_url IS NULL;

-- ── STEP 4: Harden enrollment writes ─────────────────────────────────────────
--
-- course_id is currently nullable. Every barber enrollment must have it set.
-- Only add NOT NULL if no existing NULL rows remain after step 1.
-- Check first: SELECT COUNT(*) FROM public.program_enrollments WHERE course_id IS NULL;
-- If count = 0, run:
--
-- ALTER TABLE public.program_enrollments ALTER COLUMN course_id SET NOT NULL;
--
-- Skipped here because other programs (non-barber) may legitimately have NULL course_id.
-- Apply manually after confirming scope.

-- ── VERIFICATION QUERIES (run after applying) ─────────────────────────────────
--
-- 1. Enrollment normalization
--    SELECT COUNT(*) FROM public.program_enrollments WHERE program_id = '6b6937b2-b90d-42c9-bf0e-d92d517176ba';
--    → must return 0
--
-- 2. All enrollments on canonical course
--    SELECT id, program_id, course_id, status, user_id FROM public.program_enrollments
--    WHERE course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17' ORDER BY created_at;
--    → all program_id should be 5ff21fcb
--
-- 3. Modules published
--    SELECT title, order_index, is_draft FROM public.course_modules
--    WHERE course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17' ORDER BY order_index;
--    → 8 rows, all is_draft = false
--
-- 4. Lesson count visible to learners
--    SELECT COUNT(*) FROM public.lms_lessons
--    WHERE course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17' AND status = 'published';
--    → should return 50
--
-- 5. No lessons missing video
--    SELECT slug, video_url FROM public.course_lessons
--    WHERE course_id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17' AND video_url IS NULL;
--    → 0 rows
--
-- 6. Program flags
--    SELECT has_lms_course, lms_model, delivery_model FROM public.programs
--    WHERE id = '5ff21fcb-1968-41fd-99d3-37d69a31bd5c';
--    → true, self_paced, lms
