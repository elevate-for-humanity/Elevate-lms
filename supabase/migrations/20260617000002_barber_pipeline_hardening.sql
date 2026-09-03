-- Barber pipeline hardening
--
-- 1. Backfill any remaining NULL course_id on barber program_enrollments
-- 2. Archive duplicate barber courses (any courses row that is NOT the canonical one)
-- 3. Add check constraint: barber enrollments must have course_id set
--
-- Canonical barber course: 3fb5ce19-1cde-434c-a8c6-f138d7d7aa17
-- Run in Supabase Dashboard → SQL Editor. Verify step 4 returns 0 before deploying.

-- ── Step 1: Backfill NULL course_id ──────────────────────────────────────────
UPDATE public.program_enrollments
SET
  course_id  = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17',
  updated_at = now()
WHERE program_slug = 'barber-apprenticeship'
  AND course_id IS NULL;

-- ── Step 2: Archive duplicate barber courses ──────────────────────────────────
-- Any courses row with slug 'barber-apprenticeship' that is not the canonical ID
-- is set to status='archived' so it no longer appears in queries.
UPDATE public.courses
SET
  status     = 'archived',
  updated_at = now()
WHERE slug = 'barber-apprenticeship'
  AND id   <> '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND status <> 'archived';

-- ── Step 3: Ensure canonical course is published ──────────────────────────────
UPDATE public.courses
SET
  status     = 'published',
  updated_at = now()
WHERE id = '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17'
  AND status <> 'published';

-- ── Step 4: Verification queries (run these manually after applying) ──────────
-- Must return 0:
--   SELECT COUNT(*) FROM public.program_enrollments
--   WHERE program_slug = 'barber-apprenticeship' AND course_id IS NULL;
--
-- Must return exactly 1 row with status='published':
--   SELECT id, slug, status FROM public.courses
--   WHERE slug = 'barber-apprenticeship' AND status = 'published';
--
-- Must return 0 rows:
--   SELECT id, slug, status FROM public.courses
--   WHERE slug = 'barber-apprenticeship' AND status <> 'archived'
--     AND id <> '3fb5ce19-1cde-434c-a8c6-f138d7d7aa17';
