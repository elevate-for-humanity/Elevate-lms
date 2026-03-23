-- Migration: 20260503000019_fix_exam_codes_and_add_icbp.sql
--
-- Idempotent. Safe to replay.
-- Fixes exam codes, adds ICBP exam + equity lesson, removes MOS Excel.
-- Course: db7aac84-e261-4cee-aa6b-57a465e07a9c (bookkeeping-quickbooks)
--
-- Strategy for reordering under unique constraints on (course_id, order_index)
-- and (module_id, order_index): drop both, reorder, re-add.
-- All inserts use ON CONFLICT DO NOTHING. All renames check old slug exists first.
-- Constraint recreation uses IF NOT EXISTS equivalent (DROP IF EXISTS + re-add).

-- Drop unique constraints/indexes that block reordering
ALTER TABLE public.course_lessons
  DROP CONSTRAINT IF EXISTS course_lessons_course_id_order_index_key;
ALTER TABLE public.course_lessons
  DROP CONSTRAINT IF EXISTS course_lessons_course_id_slug_key;
DROP INDEX IF EXISTS public.course_lessons_module_id_order_idx;

DO $$
DECLARE
  v_mod1 UUID;
  v_mod5 UUID;
BEGIN

-- ── Module 1: insert equity lesson between journal entries and accrual ────────

SELECT module_id INTO v_mod1
FROM public.course_lessons
WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
  AND slug = 'bk-journal-entries-general-ledger';

-- Shift accrual (1006→1007) and checkpoint (1007→1008) only if equity not yet present
IF NOT EXISTS (
  SELECT 1 FROM public.course_lessons
  WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
    AND slug = 'bk-equity-owners-equity'
) THEN
  UPDATE public.course_lessons SET order_index = 1008
  WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
    AND slug = 'bk-fundamentals-checkpoint';

  UPDATE public.course_lessons SET order_index = 1007
  WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
    AND slug = 'bk-accrual-vs-cash-basis';

  INSERT INTO public.course_lessons
    (course_id, module_id, slug, title, lesson_type, order_index,
     is_required, is_published, status, content)
  VALUES (
    'db7aac84-e261-4cee-aa6b-57a465e07a9c', v_mod1,
    'bk-equity-owners-equity',
    'Equity, Owner''s Equity, and Retained Earnings',
    'lesson', 1006, true, true, 'published',
    '{"body":"Covers equity accounts, owner''s equity, and retained earnings — core ICBP exam topics."}'::jsonb
  );
END IF;

-- ── Module 5: get module_id ───────────────────────────────────────────────────

-- Prefer renamed slug; fall back to old slug if rename hasn't happened yet
SELECT module_id INTO v_mod5
FROM public.course_lessons
WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
  AND slug IN ('bk-qbocu-exam-overview', 'bk-qbo-exam-overview')
LIMIT 1;

-- ── Module 5: rename slugs (only if old slug still exists) ───────────────────

UPDATE public.course_lessons
SET slug = 'bk-qbocu-exam-overview',
    title = 'QuickBooks Online Certified User (QBOCU) Exam Overview'
WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
  AND slug = 'bk-qbo-exam-overview';

UPDATE public.course_lessons
SET slug = 'bk-practice-exam-qbocu',
    title = 'Practice Exam: QBOCU Simulation'
WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
  AND slug = 'bk-practice-exam-simulation';

UPDATE public.course_lessons
SET slug = 'bk-qbocu-certification-exam',
    title = 'QuickBooks Online Certified User Exam',
    partner_exam_code = 'QBOCU'
WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
  AND slug = 'bk-final-certification-exam';

-- ── Module 5: remove MOS Excel (idempotent — DELETE WHERE is safe if absent) ─

DELETE FROM public.course_lessons
WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
  AND slug = 'bk-mos-excel-for-accounting';

-- ── Module 5: reorder remaining rows to final positions ──────────────────────
-- Target layout:
--   5000 bk-qbocu-exam-overview
--   5001 bk-icbp-exam-overview      (new)
--   5003 bk-exam-objectives-domains
--   5004 bk-practice-exam-qbocu
--   5005 bk-reviewing-weak-areas
--   5006 bk-career-pathways-bookkeeping
--   5007 bk-practice-exam-icbp      (new)
--   5009 bk-qbocu-certification-exam
--   5010 bk-icbp-certification-exam (new)

UPDATE public.course_lessons SET order_index = 5003
WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
  AND slug = 'bk-exam-objectives-domains';

UPDATE public.course_lessons SET order_index = 5004
WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
  AND slug = 'bk-practice-exam-qbocu';

UPDATE public.course_lessons SET order_index = 5005
WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
  AND slug = 'bk-reviewing-weak-areas';

UPDATE public.course_lessons SET order_index = 5006
WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
  AND slug = 'bk-career-pathways-bookkeeping';

UPDATE public.course_lessons SET order_index = 5009
WHERE course_id = 'db7aac84-e261-4cee-aa6b-57a465e07a9c'
  AND slug = 'bk-qbocu-certification-exam';

-- ── Module 5: insert new rows (ON CONFLICT DO NOTHING = idempotent) ──────────

INSERT INTO public.course_lessons
  (course_id, module_id, slug, title, lesson_type, order_index,
   is_required, is_published, status, content)
VALUES (
  'db7aac84-e261-4cee-aa6b-57a465e07a9c', v_mod5,
  'bk-icbp-exam-overview',
  'Intuit Certified Bookkeeping Professional (ICBP) Exam Overview',
  'lesson', 5001, true, true, 'published',
  '{"body":"Overview of the ICBP exam: domains, question format, passing score, and Certiport registration."}'::jsonb
) ON CONFLICT DO NOTHING;

INSERT INTO public.course_lessons
  (course_id, module_id, slug, title, lesson_type, order_index,
   is_required, is_published, status, content)
VALUES (
  'db7aac84-e261-4cee-aa6b-57a465e07a9c', v_mod5,
  'bk-practice-exam-icbp',
  'Practice Exam: ICBP Simulation',
  'exam', 5007, true, true, 'published',
  '{"body":"Full-length ICBP practice exam covering accounting basics, assets, liabilities, equity, and reconciliation."}'::jsonb
) ON CONFLICT DO NOTHING;

INSERT INTO public.course_lessons
  (course_id, module_id, slug, title, lesson_type, order_index,
   passing_score, is_required, is_published, status, partner_exam_code, content)
VALUES (
  'db7aac84-e261-4cee-aa6b-57a465e07a9c', v_mod5,
  'bk-icbp-certification-exam',
  'Intuit Certified Bookkeeping Professional Exam',
  'exam', 5010, 70, true, true, 'published', 'ICBP',
  '{"body":"Certiport proctored exam. A voucher will be issued to your registered email before exam day."}'::jsonb
) ON CONFLICT DO NOTHING;

END $$;

-- Re-add unique constraints (safe: data is already unique at this point)
ALTER TABLE public.course_lessons
  ADD CONSTRAINT course_lessons_course_id_order_index_key
  UNIQUE (course_id, order_index);

ALTER TABLE public.course_lessons
  ADD CONSTRAINT course_lessons_course_id_slug_key
  UNIQUE (course_id, slug);

CREATE UNIQUE INDEX course_lessons_module_id_order_idx
  ON public.course_lessons (module_id, order_index);
