-- Migration: 20260503000016_bookkeeping_program_seed.sql
--
-- Seeds the Bookkeeping & QuickBooks program into the DB-driven LMS engine.
-- Idempotent — safe to re-run. Uses ON CONFLICT DO NOTHING throughout.
--
-- The final exam and practice exam are wired to Certiport QB-ONLINE via
-- partner_exam_code. The lesson page reads this column and redirects to
-- /certiport-exam?exam=QB-ONLINE when the learner reaches those steps.
--
-- After applying:
--   1. Verify: SELECT count(*) FROM curriculum_lessons WHERE course_id = 'b0000000-0000-0000-0000-000000000002';
--   2. Publish: UPDATE programs SET published = true WHERE slug = 'bookkeeping';

-- Add partner_exam_code to curriculum_lessons if not already present.
-- Stores the Certiport exam code (e.g. 'QB-ONLINE') for lessons that
-- launch an external proctored exam instead of the internal quiz player.
ALTER TABLE public.curriculum_lessons
  ADD COLUMN IF NOT EXISTS partner_exam_code TEXT;

-- ── UUIDs ────────────────────────────────────────────────────────────────────
-- Program:  bk-program-0000-0000-000000000001
-- Course:   bk-course-0000-0000-000000000001
-- Modules:  bk-mod-0001 through bk-mod-0005

DO $$
DECLARE
  v_program_id  UUID := 'bd503ebf-d8e1-4c79-9efe-a72c001589b4';
  v_course_id   UUID := 'db7aac84-e261-4cee-aa6b-57a465e07a9c';
  v_mod1        UUID := 'a3aad168-afed-433d-a31e-e156c334faf6';
  v_mod2        UUID := '6dc910b3-8a90-4407-8ebc-9e50c9c44874';
  v_mod3        UUID := '4a029bea-b080-4c62-8595-9661ac1c77ce';
  v_mod4        UUID := '985055a2-160a-4a1f-9f13-1667234e95b9';
  v_mod5        UUID := '488e866e-d89c-42b0-971d-bb7705bc133c';
BEGIN

-- Program and course already exist in the live DB.
-- program_id = bd503ebf-d8e1-4c79-9efe-a72c001589b4 (slug: bookkeeping)
-- course_id  = db7aac84-e261-4cee-aa6b-57a465e07a9c (slug: bookkeeping-quickbooks)
-- Skipping INSERT — seeding modules and lessons only.

-- ── Modules ──────────────────────────────────────────────────────────────────
INSERT INTO public.modules (id, course_id, program_id, title, slug, order_index)
VALUES
  (v_mod1, v_course_id, v_program_id, 'Bookkeeping Fundamentals',                  'bk-fundamentals',               1),
  (v_mod2, v_course_id, v_program_id, 'QuickBooks Online Foundations',             'bk-quickbooks-foundations',     2),
  (v_mod3, v_course_id, v_program_id, 'Transactions, Invoicing & Reconciliation',  'bk-transactions-reconciliation',3),
  (v_mod4, v_course_id, v_program_id, 'Financial Reporting & Payroll',             'bk-reporting-payroll',          4),
  (v_mod5, v_course_id, v_program_id, 'Certification Prep & Career Readiness',     'bk-certification-prep',         5)
ON CONFLICT (id) DO NOTHING;

-- ── Module 1 Lessons ─────────────────────────────────────────────────────────
INSERT INTO public.curriculum_lessons (
  id, course_id, module_id, program_id, lesson_title, lesson_slug,
  step_type, module_order, lesson_order, status, passing_score, created_at, updated_at
) VALUES
  (gen_random_uuid(), v_course_id, v_mod1, v_program_id, 'Introduction to Bookkeeping and Accounting',       'bk-intro-to-bookkeeping',           'lesson',     1, 1, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod1, v_program_id, 'The Accounting Equation: Assets, Liabilities, Equity', 'bk-accounting-equation',        'lesson',     1, 2, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod1, v_program_id, 'Double-Entry Bookkeeping Principles',              'bk-double-entry-principles',        'lesson',     1, 3, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod1, v_program_id, 'Debits and Credits in Practice',                   'bk-debits-and-credits',             'lesson',     1, 4, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod1, v_program_id, 'Chart of Accounts Setup and Structure',            'bk-chart-of-accounts',              'lesson',     1, 5, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod1, v_program_id, 'Journal Entries and the General Ledger',           'bk-journal-entries-general-ledger', 'lesson',     1, 6, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod1, v_program_id, 'Accrual vs. Cash Basis Accounting',                'bk-accrual-vs-cash-basis',          'lesson',     1, 7, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod1, v_program_id, 'Module 1 Checkpoint Quiz',                         'bk-fundamentals-checkpoint',        'checkpoint', 1, 8, 'published', 70,   NOW(), NOW())
ON CONFLICT (program_id, lesson_slug) DO NOTHING;

-- ── Module 2 Lessons ─────────────────────────────────────────────────────────
INSERT INTO public.curriculum_lessons (
  id, course_id, module_id, program_id, lesson_title, lesson_slug,
  step_type, module_order, lesson_order, status, passing_score, created_at, updated_at
) VALUES
  (gen_random_uuid(), v_course_id, v_mod2, v_program_id, 'Introduction to QuickBooks Online',            'bk-intro-to-qbo',               'lesson',     2, 1, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod2, v_program_id, 'Setting Up a Company File',                    'bk-company-file-setup',         'lesson',     2, 2, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod2, v_program_id, 'Customizing the Chart of Accounts in QBO',    'bk-qbo-chart-of-accounts',      'lesson',     2, 3, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod2, v_program_id, 'Adding Customers and Vendors',                 'bk-customers-and-vendors',      'lesson',     2, 4, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod2, v_program_id, 'Setting Opening Balances',                     'bk-opening-balances',           'lesson',     2, 5, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod2, v_program_id, 'Navigating the QBO Dashboard',                 'bk-qbo-dashboard-navigation',   'lesson',     2, 6, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod2, v_program_id, 'User Roles and Permissions',                   'bk-user-roles-permissions',     'lesson',     2, 7, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod2, v_program_id, 'Module 2 Checkpoint Quiz',                     'bk-qbo-foundations-checkpoint', 'checkpoint', 2, 8, 'published', 70,   NOW(), NOW())
ON CONFLICT (program_id, lesson_slug) DO NOTHING;

-- ── Module 3 Lessons ─────────────────────────────────────────────────────────
INSERT INTO public.curriculum_lessons (
  id, course_id, module_id, program_id, lesson_title, lesson_slug,
  step_type, module_order, lesson_order, status, passing_score, created_at, updated_at
) VALUES
  (gen_random_uuid(), v_course_id, v_mod3, v_program_id, 'Recording Sales and Income',                   'bk-recording-sales-income',        'lesson',     3, 1, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod3, v_program_id, 'Creating and Sending Invoices',                'bk-creating-invoices',             'lesson',     3, 2, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod3, v_program_id, 'Receiving and Applying Payments',              'bk-receiving-payments',            'lesson',     3, 3, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod3, v_program_id, 'Recording Expenses and Bills',                 'bk-recording-expenses-bills',      'lesson',     3, 4, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod3, v_program_id, 'Paying Bills and Managing Accounts Payable',   'bk-paying-bills-accounts-payable', 'lesson',     3, 5, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod3, v_program_id, 'Connecting Bank Feeds',                        'bk-connecting-bank-feeds',         'lesson',     3, 6, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod3, v_program_id, 'Categorizing Transactions',                    'bk-categorizing-transactions',     'lesson',     3, 7, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod3, v_program_id, 'Bank Reconciliation Step by Step',             'bk-bank-reconciliation',           'lesson',     3, 8, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod3, v_program_id, 'Module 3 Checkpoint Quiz',                     'bk-transactions-checkpoint',       'checkpoint', 3, 9, 'published', 70,   NOW(), NOW())
ON CONFLICT (program_id, lesson_slug) DO NOTHING;

-- ── Module 4 Lessons ─────────────────────────────────────────────────────────
INSERT INTO public.curriculum_lessons (
  id, course_id, module_id, program_id, lesson_title, lesson_slug,
  step_type, module_order, lesson_order, status, passing_score, created_at, updated_at
) VALUES
  (gen_random_uuid(), v_course_id, v_mod4, v_program_id, 'Reading the Profit & Loss Statement',          'bk-profit-loss-statement',          'lesson',     4, 1, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod4, v_program_id, 'Understanding the Balance Sheet',              'bk-balance-sheet',                  'lesson',     4, 2, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod4, v_program_id, 'Cash Flow Statements and Projections',         'bk-cash-flow-statements',           'lesson',     4, 3, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod4, v_program_id, 'Customizing and Exporting Reports',            'bk-customizing-exporting-reports',  'lesson',     4, 4, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod4, v_program_id, 'Payroll Setup in QuickBooks',                  'bk-payroll-setup-qbo',              'lesson',     4, 5, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod4, v_program_id, 'Processing a Payroll Cycle',                   'bk-processing-payroll-cycle',       'lesson',     4, 6, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod4, v_program_id, 'Tax Withholding and Employer Obligations',     'bk-tax-withholding-obligations',    'lesson',     4, 7, 'published', NULL, NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod4, v_program_id, 'Module 4 Checkpoint Quiz',                     'bk-reporting-payroll-checkpoint',   'checkpoint', 4, 8, 'published', 70,   NOW(), NOW())
ON CONFLICT (program_id, lesson_slug) DO NOTHING;

-- ── Module 5 Lessons ─────────────────────────────────────────────────────────
-- Practice exam and final exam use partner_exam_code = 'QB-ONLINE' to launch
-- the Certiport QuickBooks Certified User exam via /certiport-exam.
INSERT INTO public.curriculum_lessons (
  id, course_id, module_id, program_id, lesson_title, lesson_slug,
  step_type, module_order, lesson_order, status, passing_score,
  partner_exam_code, created_at, updated_at
) VALUES
  (gen_random_uuid(), v_course_id, v_mod5, v_program_id, 'QuickBooks Certified User Exam Overview',  'bk-qbo-exam-overview',           'lesson',     5, 1, 'published', NULL, NULL,        NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod5, v_program_id, 'Exam Objectives and Domain Breakdown',     'bk-exam-objectives-domains',     'lesson',     5, 2, 'published', NULL, NULL,        NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod5, v_program_id, 'MOS Excel for Accounting Professionals',   'bk-mos-excel-for-accounting',    'lesson',     5, 3, 'published', NULL, NULL,        NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod5, v_program_id, 'Practice Exam: Certiport Simulation',      'bk-practice-exam-certiport',     'exam',       5, 4, 'published', 70,   'QB-ONLINE', NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod5, v_program_id, 'Reviewing Weak Areas',                     'bk-reviewing-weak-areas',        'lesson',     5, 5, 'published', NULL, NULL,        NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod5, v_program_id, 'Career Pathways in Bookkeeping',           'bk-career-pathways-bookkeeping', 'lesson',     5, 6, 'published', NULL, NULL,        NOW(), NOW()),
  (gen_random_uuid(), v_course_id, v_mod5, v_program_id, 'QuickBooks Certified User — Final Exam',   'bk-final-certification-exam',    'exam',       5, 7, 'published', 80,   'QB-ONLINE', NOW(), NOW())
ON CONFLICT (program_id, lesson_slug) DO NOTHING;

END $$;

-- ── Verification queries (run after applying) ─────────────────────────────────
-- SELECT count(*) FROM public.curriculum_lessons
--   WHERE course_id = 'b0000000-0000-0000-0000-000000000002';
-- Expected: 40
--
-- SELECT step_type, count(*) FROM public.curriculum_lessons
--   WHERE course_id = 'b0000000-0000-0000-0000-000000000002'
--   GROUP BY step_type ORDER BY step_type;
-- Expected: checkpoint=5, exam=2, lesson=33
--
-- SELECT id, slug, title FROM public.programs WHERE slug = 'bookkeeping';
-- After verifying content, run:
--   UPDATE public.programs SET published = true WHERE slug = 'bookkeeping';
