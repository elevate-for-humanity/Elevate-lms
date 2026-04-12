-- Backfill program_id on applications that were submitted before the
-- broken .or() ilike fix (commit a4eab78). Every application submitted
-- through /api/apply or /api/apply/simple before that fix has program_id = null
-- because the PostgREST .or() syntax was malformed and always returned null.
--
-- Mapping derived from live DB audit 2026-04-12:
--   23 applications with program_id = null
--   Matchable by program_interest text → programs.id
--   Unmatchable (no program): Employer Partnership, not-sure, Other,
--     Not specified, Program Holder — left as null (no program to link)

-- ── HVAC Technician (4226f7f6-fbc1-44b5-83e8-b12ea149e4c7) ──────────────────
-- Covers: "HVAC Technician", "HVAC", "hvac-technician"
UPDATE public.applications
SET program_id = '4226f7f6-fbc1-44b5-83e8-b12ea149e4c7'
WHERE program_id IS NULL
  AND lower(trim(program_interest)) IN (
    'hvac technician', 'hvac', 'hvac-technician',
    'hvac tech', 'hvac technician program'
  );

-- ── Barber Apprenticeship (5ff21fcb-1968-41fd-99d3-37d69a31bd5c) ─────────────
UPDATE public.applications
SET program_id = '5ff21fcb-1968-41fd-99d3-37d69a31bd5c'
WHERE program_id IS NULL
  AND lower(trim(program_interest)) IN (
    'barber apprenticeship', 'barber', 'barbering'
  );

-- ── Electrical Apprenticeship (421b0486-778d-4298-93df-8c645f5b4836) ─────────
UPDATE public.applications
SET program_id = '421b0486-778d-4298-93df-8c645f5b4836'
WHERE program_id IS NULL
  AND lower(trim(program_interest)) IN (
    'electrical', 'electrical apprenticeship'
  );

-- ── Home Health Aide (d8f45366-1838-4539-ae32-7bc985773772) ──────────────────
UPDATE public.applications
SET program_id = 'd8f45366-1838-4539-ae32-7bc985773772'
WHERE program_id IS NULL
  AND lower(trim(program_interest)) IN (
    'home health aide', 'home health'
  );

-- ── Entrepreneurship / Small Business (c6cf8528-bd11-4901-a785-bce3ee921988) ─
UPDATE public.applications
SET program_id = 'c6cf8528-bd11-4901-a785-bce3ee921988'
WHERE program_id IS NULL
  AND lower(trim(program_interest)) IN (
    'entrepreneurship', 'entrepreneurship small business',
    'entrepreneurship / small business'
  );

-- ── Bookkeeping / Accounting (bd503ebf-d8e1-4c79-9efe-a72c001589b4) ──────────
UPDATE public.applications
SET program_id = 'bd503ebf-d8e1-4c79-9efe-a72c001589b4'
WHERE program_id IS NULL
  AND lower(trim(program_interest)) IN (
    'accounting', 'bookkeeping'
  );

-- ── Verify results ────────────────────────────────────────────────────────────
-- Run this after applying to confirm:
--
-- SELECT program_interest, program_id IS NOT NULL AS linked, COUNT(*)
-- FROM public.applications
-- WHERE program_interest IN (
--   'HVAC Technician','HVAC','hvac-technician',
--   'Barber Apprenticeship','electrical',
--   'Home Health Aide','Entrepreneurship','Accounting'
-- )
-- GROUP BY program_interest, linked
-- ORDER BY program_interest;
--
-- Remaining null program_ids after this migration (intentional — no program to link):
--   "Employer Partnership" — employer applications, not student programs
--   "not-sure" / "Not specified" / "Other" — no program selected
--   "Program Holder" — program holder applications, not student programs
