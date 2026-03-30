-- Phase 3: Add delivery model columns to programs table.
--
-- The live DB already has: id, slug, title, name, status, is_active, published,
-- description, excerpt, code, created_at, short_description, display_order.
--
-- This migration adds the columns needed for DB-driven CTA routing and
-- delivery model classification. All additions use IF NOT EXISTS / safe defaults.
--
-- DO NOT recreate the programs table — it has 449 active code references and
-- live FK relations to program_enrollments, training_courses, modules, etc.

-- ── 1. Add delivery classification columns to programs ────────────────────────

ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS delivery_model       TEXT,
  ADD COLUMN IF NOT EXISTS enrollment_type      TEXT
    CHECK (enrollment_type IN ('internal', 'external', 'waitlist')),
  ADD COLUMN IF NOT EXISTS external_enrollment_url TEXT,
  ADD COLUMN IF NOT EXISTS has_lms_course       BOOLEAN DEFAULT FALSE;

-- ── 2. Create program_funding table ──────────────────────────────────────────
-- Stores verified funding options per program (wioa, wrg, self_pay, etc.)
-- Replaces the scattered fundingStatement text fields with queryable rows.

CREATE TABLE IF NOT EXISTS public.program_funding (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id  UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('wioa', 'wrg', 'self_pay', 'employer_paid', 'unknown')),
  label       TEXT,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
  UNIQUE (program_id, type)
);

-- Index for fast per-program lookups
CREATE INDEX IF NOT EXISTS idx_program_funding_program_id
  ON public.program_funding(program_id);

-- ── 3. Backfill delivery_model from existing data ────────────────────────────
-- programs that already have a slug matching our 11 active programs
-- get their delivery_model set from the classification we established in Phase 2.
-- enrollment_type defaults to 'internal' for all existing programs (safe default).

UPDATE public.programs
SET
  delivery_model  = CASE slug
    WHEN 'hvac-technician'           THEN 'hybrid'
    WHEN 'bookkeeping'               THEN 'internal'
    WHEN 'peer-recovery-specialist'  THEN 'hybrid'
    WHEN 'medical-assistant'         THEN 'hybrid'
    WHEN 'barber-apprenticeship'     THEN 'hybrid'
    WHEN 'cosmetology-apprenticeship' THEN 'hybrid'
    WHEN 'cna'                       THEN 'internal'
    WHEN 'cdl-training'              THEN 'internal'
    WHEN 'cpr-first-aid'             THEN 'partner'
    WHEN 'business'                  THEN 'hybrid'
    WHEN 'phlebotomy'                THEN 'internal'
    ELSE delivery_model  -- leave existing value if already set
  END,
  enrollment_type = COALESCE(enrollment_type, 'internal'),
  has_lms_course  = CASE slug
    WHEN 'hvac-technician'  THEN TRUE
    WHEN 'bookkeeping'      THEN TRUE
    ELSE has_lms_course
  END
WHERE slug IN (
  'hvac-technician', 'bookkeeping', 'peer-recovery-specialist',
  'medical-assistant', 'barber-apprenticeship', 'cosmetology-apprenticeship',
  'cna', 'cdl-training', 'cpr-first-aid', 'business', 'phlebotomy'
);

-- ── 4. Backfill program_funding for the 11 active programs ───────────────────
-- Only insert if the program row exists (safe — uses subquery).
-- Uses ON CONFLICT DO NOTHING to be idempotent.

INSERT INTO public.program_funding (program_id, type, label, is_active)
SELECT p.id, f.type, f.label, TRUE
FROM public.programs p
JOIN (VALUES
  ('hvac-technician',            'wioa',         'WIOA Eligible'),
  ('hvac-technician',            'wrg',          'Workforce Ready Grant'),
  ('hvac-technician',            'self_pay',     'Self-Pay Available'),
  ('bookkeeping',                'self_pay',     'Self-Pay Available'),
  ('peer-recovery-specialist',   'wioa',         'WIOA Eligible'),
  ('peer-recovery-specialist',   'self_pay',     'Self-Pay Available'),
  ('medical-assistant',          'wioa',         'WIOA Eligible'),
  ('medical-assistant',          'self_pay',     'Self-Pay Available'),
  ('barber-apprenticeship',      'employer_paid','Employer-Sponsored'),
  ('barber-apprenticeship',      'wioa',         'WIOA Eligible'),
  ('barber-apprenticeship',      'self_pay',     'Self-Pay Available'),
  ('cosmetology-apprenticeship', 'employer_paid','Employer-Sponsored'),
  ('cosmetology-apprenticeship', 'wioa',         'WIOA Eligible'),
  ('cna',                        'self_pay',     'Self-Pay Available'),
  ('cdl-training',               'wioa',         'WIOA Eligible'),
  ('cdl-training',               'self_pay',     'Self-Pay Available'),
  ('cpr-first-aid',              'self_pay',     'Self-Pay Available'),
  ('business',                   'wioa',         'WIOA Eligible'),
  ('business',                   'self_pay',     'Self-Pay Available'),
  ('phlebotomy',                 'self_pay',     'Self-Pay Available')
) AS f(slug, type, label) ON p.slug = f.slug
ON CONFLICT (program_id, type) DO NOTHING;

-- ── 5. Verify ────────────────────────────────────────────────────────────────
-- Run this after applying to confirm the migration landed correctly:
--
-- SELECT slug, delivery_model, enrollment_type, has_lms_course
-- FROM public.programs
-- WHERE slug IN (
--   'hvac-technician','bookkeeping','peer-recovery-specialist','medical-assistant',
--   'barber-apprenticeship','cosmetology-apprenticeship','cna','cdl-training',
--   'cpr-first-aid','business','phlebotomy'
-- )
-- ORDER BY slug;
--
-- SELECT p.slug, pf.type, pf.label
-- FROM public.program_funding pf
-- JOIN public.programs p ON p.id = pf.program_id
-- ORDER BY p.slug, pf.type;
