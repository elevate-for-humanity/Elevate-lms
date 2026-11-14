-- =============================================================================
-- program_credentials seed + completion_rules seed
--
-- Maps each program to the credentials it delivers, with exam fee, payer
-- default, and passing score. Also seeds completion_rules so the lifecycle
-- state machine knows what "done" means for each program.
--
-- Idempotent: ON CONFLICT DO UPDATE on all inserts.
-- Depends on: credentials table (migration 20260322000002)
--             programs table (slugs from 20260201000005 + 20260220190000)
-- =============================================================================

-- =============================================================================
-- 1. Ensure program_credentials has the columns added in migration 000001
-- =============================================================================

ALTER TABLE public.program_credentials
  ADD COLUMN IF NOT EXISTS exam_fee_payer TEXT
    CHECK (exam_fee_payer IN ('self_pay','elevate','grant','employer','partner','scholarship'))
    DEFAULT 'self_pay',
  ADD COLUMN IF NOT EXISTS exam_fee_cents INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS passing_score  INTEGER DEFAULT 70,
  ADD COLUMN IF NOT EXISTS is_primary     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS notes          TEXT;

-- =============================================================================
-- 2. Seed program_credentials
--
-- Uses a CTE to resolve program UUIDs from slugs so this migration is
-- portable across environments (dev, staging, prod) without hard-coded UUIDs.
--
-- Credential UUIDs are deterministic from migration 20260322000002.
-- =============================================================================

WITH prog AS (
  SELECT id, slug FROM public.programs
  WHERE slug IN (
    'hvac-technician',
    'cna-cert',
    'medical-assistant',
    'phlebotomy-technician',
    'barber-apprenticeship',
    'cosmetology-apprenticeship',
    'nail-technician',
    'cdl-training',
    'peer-recovery-specialist-jri',
    'drug-alcohol-specimen-collector',
    'cybersecurity',
    'tax-preparation'
  )
)
INSERT INTO public.program_credentials
  (program_id, credential_id, is_primary, exam_fee_payer, exam_fee_cents, passing_score, notes)
VALUES

-- ── HVAC Technician ───────────────────────────────────────────────────────────
-- Primary: EPA 608 Universal — Elevate proctors on-site, covers fee
((SELECT id FROM prog WHERE slug='hvac-technician'),
 'd37ae8a2-9297-44d1-83db-fa7ef375b796', true,  'elevate', 2000, 70,
 'EPA 608 Universal proctored on-site at Elevate. Fee covered by program.'),

-- OSHA 10 — included in program cost, no separate exam fee
((SELECT id FROM prog WHERE slug='hvac-technician'),
 '00000000-0000-0000-0000-000000000102', false, 'elevate', 0, NULL,
 'OSHA 10-Hour completion card. No separate exam — attendance-based.'),

-- NCRC — ACT WorkKeys, learner self-pay unless grant-funded
((SELECT id FROM prog WHERE slug='hvac-technician'),
 '3e4683f2-a977-4193-99d7-7b8d15270116', false, 'self_pay', 3500, 3,
 'ACT WorkKeys NCRC. Minimum Silver level (score 3) required.'),

-- ── CNA ───────────────────────────────────────────────────────────────────────
-- Primary: Indiana CNA — state exam via Prometric, Elevate covers fee for WRG/JRI learners
((SELECT id FROM prog WHERE slug='cna-cert'),
 '00000000-0000-0000-0000-000000000107', true,  'elevate', 12500, 70,
 'Indiana State CNA exam via Prometric. Fee covered for WRG/JRI-funded learners.'),

-- OSHA 10 included
((SELECT id FROM prog WHERE slug='cna-cert'),
 '00000000-0000-0000-0000-000000000102', false, 'elevate', 0, NULL,
 'OSHA 10-Hour completion card. Attendance-based.'),

-- ── Medical Assistant ─────────────────────────────────────────────────────────
-- Primary: NCCT Medical Assistant — self-pay unless employer-sponsored
((SELECT id FROM prog WHERE slug='medical-assistant'),
 '00000000-0000-0000-0000-000000000111', true,  'self_pay', 17500, 70,
 'NCCT NCMA exam. Learner self-pay unless employer or grant covers.'),

-- OSHA 10 included
((SELECT id FROM prog WHERE slug='medical-assistant'),
 '00000000-0000-0000-0000-000000000102', false, 'elevate', 0, NULL,
 'OSHA 10-Hour completion card. Attendance-based.'),

-- ── Phlebotomy ────────────────────────────────────────────────────────────────
-- Primary: NCCT Phlebotomy
((SELECT id FROM prog WHERE slug='phlebotomy-technician'),
 '00000000-0000-0000-0000-000000000112', true,  'self_pay', 12500, 70,
 'NCCT NPT exam. Learner self-pay unless employer or grant covers.'),

-- ── Barber Apprenticeship ─────────────────────────────────────────────────────
-- Primary: Indiana Barber License — state board exam, learner pays
((SELECT id FROM prog WHERE slug='barber-apprenticeship'),
 '00000000-0000-0000-0000-000000000104', true,  'self_pay', 7500, 70,
 'Indiana PLA barber state board exam. Learner pays exam fee.'),

-- OSHA 10 included
((SELECT id FROM prog WHERE slug='barber-apprenticeship'),
 '00000000-0000-0000-0000-000000000102', false, 'elevate', 0, NULL,
 'OSHA 10-Hour completion card. Attendance-based.'),

-- NCRC optional
((SELECT id FROM prog WHERE slug='barber-apprenticeship'),
 '3e4683f2-a977-4193-99d7-7b8d15270116', false, 'self_pay', 3500, 3,
 'ACT WorkKeys NCRC. Optional for apprenticeship track.'),

-- ── Cosmetology Apprenticeship ────────────────────────────────────────────────
-- Primary: Indiana Cosmetology License
((SELECT id FROM prog WHERE slug='cosmetology-apprenticeship'),
 '00000000-0000-0000-0000-000000000105', true,  'self_pay', 7500, 70,
 'Indiana PLA cosmetology state board exam. Learner pays exam fee.'),

-- OSHA 10 included
((SELECT id FROM prog WHERE slug='cosmetology-apprenticeship'),
 '00000000-0000-0000-0000-000000000102', false, 'elevate', 0, NULL,
 'OSHA 10-Hour completion card. Attendance-based.'),

-- ── Nail Technician ───────────────────────────────────────────────────────────
-- Primary: Indiana Nail Technician License
((SELECT id FROM prog WHERE slug='nail-technician'),
 '00000000-0000-0000-0000-000000000106', true,  'self_pay', 7500, 70,
 'Indiana PLA nail technician state board exam. Learner pays exam fee.'),

-- ── CDL Class A ───────────────────────────────────────────────────────────────
-- Primary: CDL Class A — Indiana BMV, Elevate covers for DOL apprenticeship learners
((SELECT id FROM prog WHERE slug='cdl-training'),
 '00000000-0000-0000-0000-000000000108', true,  'elevate', 0, 80,
 'Indiana BMV CDL Class A. Fee covered for DOL apprenticeship learners. 80% passing score.'),

-- ── Peer Recovery Specialist ──────────────────────────────────────────────────
-- Primary: Indiana PRS — ICAADA exam, Elevate covers for JRI learners
((SELECT id FROM prog WHERE slug='peer-recovery-specialist-jri'),
 '00000000-0000-0000-0000-000000000109', true,  'elevate', 7500, 70,
 'ICAADA Peer Recovery Specialist exam. Fee covered for JRI-funded learners.'),

-- ── DOT Specimen Collector ────────────────────────────────────────────────────
-- Primary: DOT Collector Certification — Elevate covers (short program, low fee)
((SELECT id FROM prog WHERE slug='drug-alcohol-specimen-collector'),
 '00000000-0000-0000-0000-000000000110', true,  'elevate', 0, 70,
 'DOT 49 CFR Part 40 collector certification. Attendance + practical assessment.'),

-- ── Cybersecurity ─────────────────────────────────────────────────────────────
-- Primary: CompTIA Security+ — self-pay, significant exam fee
((SELECT id FROM prog WHERE slug='cybersecurity'),
 '00000000-0000-0000-0000-000000000113', true,  'self_pay', 40200, 75,
 'CompTIA Security+ SY0-701. $402 exam voucher. Learner self-pay unless employer/grant.'),

-- OSHA 10 included
((SELECT id FROM prog WHERE slug='cybersecurity'),
 '00000000-0000-0000-0000-000000000102', false, 'elevate', 0, NULL,
 'OSHA 10-Hour completion card. Attendance-based.'),

-- ── Tax Preparation ───────────────────────────────────────────────────────────
-- Primary: IRS AFSP — Elevate covers (owner is EA, program cost includes CE)
((SELECT id FROM prog WHERE slug='tax-preparation'),
 '00000000-0000-0000-0000-000000000114', true,  'elevate', 0, 70,
 'IRS Annual Filing Season Program. CE hours included in program cost.')

ON CONFLICT (program_id, credential_id) DO UPDATE SET
  is_primary     = EXCLUDED.is_primary,
  exam_fee_payer = EXCLUDED.exam_fee_payer,
  exam_fee_cents = EXCLUDED.exam_fee_cents,
  passing_score  = EXCLUDED.passing_score,
  notes          = EXCLUDED.notes;

-- =============================================================================
-- 3. Seed completion_rules
--
-- Defines what "program complete" means for each program.
-- rule_type options:
--   'min_attendance'   — percentage of sessions attended
--   'min_hours'        — clock hours completed
--   'all_modules'      — all curriculum modules marked complete
--   'primary_credential_passed' — primary credential exam passed
--   'practical_assessment'      — instructor-graded practical
--
-- Unique constraint: (entity_type, entity_id, rule_type) WHERE is_active = true
-- (added in migration 20260322000003)
-- =============================================================================

WITH prog AS (
  SELECT id, slug FROM public.programs
  WHERE slug IN (
    'hvac-technician', 'cna-cert', 'medical-assistant',
    'phlebotomy-technician', 'barber-apprenticeship', 'cosmetology-apprenticeship',
    'nail-technician', 'cdl-training', 'peer-recovery-specialist-jri',
    'drug-alcohol-specimen-collector', 'cybersecurity', 'tax-preparation'
  )
)
INSERT INTO public.completion_rules
  (entity_type, entity_id, rule_type, threshold_value, is_required, is_active, notes)
VALUES

-- HVAC: 80% attendance + all modules + EPA 608 passed
('program', (SELECT id FROM prog WHERE slug='hvac-technician'), 'min_attendance', 80, true, true,
 'Minimum 80% session attendance required for HVAC program completion.'),
('program', (SELECT id FROM prog WHERE slug='hvac-technician'), 'all_modules', NULL, true, true,
 'All 94 HVAC curriculum lessons must be marked complete.'),
('program', (SELECT id FROM prog WHERE slug='hvac-technician'), 'primary_credential_passed', NULL, true, true,
 'EPA 608 Universal exam must be passed before certificate issued.'),

-- CNA: 80% attendance + all modules + state exam passed
('program', (SELECT id FROM prog WHERE slug='cna-cert'), 'min_attendance', 80, true, true,
 'Minimum 80% attendance required per Indiana SDOH CNA program standards.'),
('program', (SELECT id FROM prog WHERE slug='cna-cert'), 'all_modules', NULL, true, true,
 'All CNA curriculum modules must be complete.'),
('program', (SELECT id FROM prog WHERE slug='cna-cert'), 'primary_credential_passed', NULL, true, true,
 'Indiana State CNA exam (Prometric) must be passed.'),

-- Medical Assistant: 80% attendance + all modules + NCCT exam passed
('program', (SELECT id FROM prog WHERE slug='medical-assistant'), 'min_attendance', 80, true, true,
 'Minimum 80% attendance required.'),
('program', (SELECT id FROM prog WHERE slug='medical-assistant'), 'all_modules', NULL, true, true,
 'All Medical Assistant curriculum modules must be complete.'),
('program', (SELECT id FROM prog WHERE slug='medical-assistant'), 'primary_credential_passed', NULL, false, true,
 'NCCT NCMA exam recommended but not required for program certificate.'),

-- Phlebotomy: 80% attendance + all modules + practical
('program', (SELECT id FROM prog WHERE slug='phlebotomy-technician'), 'min_attendance', 80, true, true,
 'Minimum 80% attendance required.'),
('program', (SELECT id FROM prog WHERE slug='phlebotomy-technician'), 'all_modules', NULL, true, true,
 'All Phlebotomy curriculum modules must be complete.'),
('program', (SELECT id FROM prog WHERE slug='phlebotomy-technician'), 'practical_assessment', NULL, true, true,
 'Instructor-graded venipuncture practical assessment required.'),

-- Barber: 1500 hours (Indiana PLA requirement) + state exam
('program', (SELECT id FROM prog WHERE slug='barber-apprenticeship'), 'min_hours', 1500, true, true,
 'Indiana PLA requires 1,500 clock hours for barber apprenticeship.'),
('program', (SELECT id FROM prog WHERE slug='barber-apprenticeship'), 'primary_credential_passed', NULL, true, true,
 'Indiana barber state board exam must be passed.'),

-- Cosmetology: 1500 hours + state exam
('program', (SELECT id FROM prog WHERE slug='cosmetology-apprenticeship'), 'min_hours', 1500, true, true,
 'Indiana PLA requires 1,500 clock hours for cosmetology apprenticeship.'),
('program', (SELECT id FROM prog WHERE slug='cosmetology-apprenticeship'), 'primary_credential_passed', NULL, true, true,
 'Indiana cosmetology state board exam must be passed.'),

-- Nail Tech: 450 hours + state exam
('program', (SELECT id FROM prog WHERE slug='nail-technician'), 'min_hours', 450, true, true,
 'Indiana PLA requires 450 clock hours for nail technician apprenticeship.'),
('program', (SELECT id FROM prog WHERE slug='nail-technician'), 'primary_credential_passed', NULL, true, true,
 'Indiana nail technician state board exam must be passed.'),

-- CDL: all modules + skills test (practical)
('program', (SELECT id FROM prog WHERE slug='cdl-training'), 'all_modules', NULL, true, true,
 'All CDL curriculum modules must be complete.'),
('program', (SELECT id FROM prog WHERE slug='cdl-training'), 'practical_assessment', NULL, true, true,
 'Indiana BMV CDL skills test (pre-trip, backing, road) must be passed.'),

-- Peer Recovery: 80% attendance + all modules + ICAADA exam
('program', (SELECT id FROM prog WHERE slug='peer-recovery-specialist-jri'), 'min_attendance', 80, true, true,
 'Minimum 80% attendance required.'),
('program', (SELECT id FROM prog WHERE slug='peer-recovery-specialist-jri'), 'all_modules', NULL, true, true,
 'All PRS curriculum modules must be complete.'),
('program', (SELECT id FROM prog WHERE slug='peer-recovery-specialist-jri'), 'primary_credential_passed', NULL, true, true,
 'ICAADA PRS exam must be passed.'),

-- DOT Collector: all modules + practical (observed collection)
('program', (SELECT id FROM prog WHERE slug='drug-alcohol-specimen-collector'), 'all_modules', NULL, true, true,
 'All DOT collector curriculum modules must be complete.'),
('program', (SELECT id FROM prog WHERE slug='drug-alcohol-specimen-collector'), 'practical_assessment', NULL, true, true,
 'Observed mock collection practical assessment required.'),

-- Cybersecurity: all modules + Security+ exam
('program', (SELECT id FROM prog WHERE slug='cybersecurity'), 'all_modules', NULL, true, true,
 'All cybersecurity curriculum modules must be complete.'),
('program', (SELECT id FROM prog WHERE slug='cybersecurity'), 'primary_credential_passed', NULL, false, true,
 'CompTIA Security+ exam recommended but not required for program certificate.'),

-- Tax Prep: all modules + AFSP CE hours
('program', (SELECT id FROM prog WHERE slug='tax-preparation'), 'all_modules', NULL, true, true,
 'All tax preparation curriculum modules must be complete.'),
('program', (SELECT id FROM prog WHERE slug='tax-preparation'), 'min_hours', 18, true, true,
 'IRS AFSP requires 18 CE hours including 6 hours federal tax law update.')

ON CONFLICT (entity_type, entity_id, rule_type) WHERE is_active = true
DO UPDATE SET
  threshold_value = EXCLUDED.threshold_value,
  is_required     = EXCLUDED.is_required,
  notes           = EXCLUDED.notes;
