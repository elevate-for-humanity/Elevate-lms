-- ============================================================
-- Qwik608 EPA Section 608 Certification Prep Course
-- 15 weeks, mapped to QV5210 Vo-Tech Training Course structure
-- Standalone course — also referenced from HVAC program pathway
--
-- Deterministic UUID via namespace a1b2c3d4-e5f6-7890-abcd-300000000001
-- Idempotent (ON CONFLICT DO UPDATE / DELETE + INSERT)
--
-- Run in: Supabase SQL Editor (Dashboard)
-- ============================================================

-- 1. Upsert the EPA 608 course
INSERT INTO training_courses (
  id, course_name, title, description, is_active, category, created_at
) VALUES (
  'b7e30a11-6c4f-5a9e-8d2b-epa608000001',
  'EPA 608 Certification Prep',
  'EPA Section 608 Universal Certification Prep',
  'Complete 15-week EPA Section 608 certification preparation. Covers Core, Type I, Type II, and Type III sections with study kits, practice exams, and proctored certification exam access through EPA-approved certifying organizations (ESCO Institute and Mainstream Engineering). Retest policies vary by certifying organization.',
  true,
  'Certification',
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  course_name = EXCLUDED.course_name,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  category = EXCLUDED.category,
  updated_at = NOW();

-- 2. Clear existing lessons for idempotency
DELETE FROM training_lessons WHERE course_id_uuid = 'b7e30a11-6c4f-5a9e-8d2b-epa608000001';

-- 3. Insert 15-week lesson structure matching QV5210
INSERT INTO training_lessons (
  id, course_id_uuid, lesson_number, order_index, title, content, duration_minutes, is_published, is_required, created_at
) VALUES

  -- ===== CORE SECTION (Weeks 1–7) =====
  ('epa60801-0001-5a9e-8d2b-000000000001', 'b7e30a11-6c4f-5a9e-8d2b-epa608000001', 1, 101,
   'Week 1 — Core: Ozone Depletion & Environmental Regulations',
   '<h2>QV5210 Week 1 — Core Section</h2>
    <h3>Topics Covered</h3>
    <ul>
      <li>The ozone layer and how CFCs/HCFCs cause depletion</li>
      <li>Montreal Protocol and international agreements</li>
      <li>Clean Air Act — Section 608 overview</li>
      <li>Venting prohibition and penalties</li>
      <li>EPA certification types: Universal, Type I, II, III</li>
    </ul>
    <h3>Study Kit Materials</h3>
    <p>Reference manual Chapter 1, practice questions set 1</p>
    <h3>Key Takeaway</h3>
    <p>Federal law requires EPA 608 certification to purchase or handle refrigerants. Intentional venting carries fines up to $44,539 per day per violation.</p>',
   90, true, true, NOW()),

  ('epa60801-0002-5a9e-8d2b-000000000002', 'b7e30a11-6c4f-5a9e-8d2b-epa608000001', 2, 102,
   'Week 2 — Core: Refrigerant Types, Properties & Safety',
   '<h2>QV5210 Week 2 — Core Section</h2>
    <h3>Topics Covered</h3>
    <ul>
      <li>CFC, HCFC, HFC, and HFO refrigerant classifications</li>
      <li>Common refrigerants: R-22, R-410A, R-134a, R-404A, R-407C</li>
      <li>Refrigerant safety: toxicity, flammability, oxygen displacement</li>
      <li>Cylinder color codes and handling procedures</li>
      <li>Refrigerant blends — zeotropic vs azeotropic</li>
    </ul>
    <h3>Study Kit Materials</h3>
    <p>Reference manual Chapter 2, refrigerant identification chart, practice questions set 2</p>',
   90, true, true, NOW()),

  ('epa60801-0003-5a9e-8d2b-000000000003', 'b7e30a11-6c4f-5a9e-8d2b-epa608000001', 3, 103,
   'Week 3 — Core: Pressure-Temperature Relationships & the Refrigeration Cycle',
   '<h2>QV5210 Week 3 — Core Section</h2>
    <h3>Topics Covered</h3>
    <ul>
      <li>The four stages: compression, condensation, expansion, evaporation</li>
      <li>Pressure-temperature (PT) relationship and saturation</li>
      <li>Reading PT charts for common refrigerants</li>
      <li>Gauge pressure vs absolute pressure</li>
      <li>Superheat and subcooling fundamentals</li>
    </ul>
    <h3>Study Kit Materials</h3>
    <p>Reference manual Chapter 3, PT chart card, practice questions set 3</p>',
   90, true, true, NOW()),

  ('epa60801-0004-5a9e-8d2b-000000000004', 'b7e30a11-6c4f-5a9e-8d2b-epa608000001', 4, 104,
   'Week 4 — Core: Recovery, Recycling & Reclamation',
   '<h2>QV5210 Week 4 — Core Section</h2>
    <h3>Topics Covered</h3>
    <ul>
      <li>Definitions: recovery vs recycling vs reclamation</li>
      <li>When each process is required by law</li>
      <li>Recovery equipment certification (UL/ARI)</li>
      <li>Refrigerant sales restrictions and record-keeping</li>
      <li>Proper disposal of refrigerant cylinders</li>
    </ul>
    <h3>Study Kit Materials</h3>
    <p>Reference manual Chapter 4, recovery procedure flowchart, practice questions set 4</p>',
   90, true, true, NOW()),

  ('epa60801-0005-5a9e-8d2b-000000000005', 'b7e30a11-6c4f-5a9e-8d2b-epa608000001', 5, 105,
   'Week 5 — Core: Leak Detection, Repair & Evacuation',
   '<h2>QV5210 Week 5 — Core Section</h2>
    <h3>Topics Covered</h3>
    <ul>
      <li>Leak detection methods: electronic, halide, UV dye, soap bubbles</li>
      <li>Leak repair requirements by system size</li>
      <li>Evacuation procedures and required vacuum levels</li>
      <li>Triple evacuation method</li>
      <li>Dehydration and moisture removal</li>
    </ul>
    <h3>Study Kit Materials</h3>
    <p>Reference manual Chapter 5, evacuation level chart, practice questions set 5</p>',
   90, true, true, NOW()),

  ('epa60801-0006-5a9e-8d2b-000000000006', 'b7e30a11-6c4f-5a9e-8d2b-epa608000001', 6, 106,
   'Week 6 — Core: Shipping, Labeling & Recordkeeping',
   '<h2>QV5210 Week 6 — Core Section</h2>
    <h3>Topics Covered</h3>
    <ul>
      <li>DOT shipping requirements for refrigerant cylinders</li>
      <li>Labeling requirements for recovered refrigerant</li>
      <li>Recordkeeping: what must be documented and for how long</li>
      <li>Technician certification verification requirements</li>
      <li>Reporting requirements for large leaks</li>
    </ul>
    <h3>Study Kit Materials</h3>
    <p>Reference manual Chapter 6, recordkeeping checklist, practice questions set 6</p>',
   90, true, true, NOW()),

  ('epa60801-0007-5a9e-8d2b-000000000007', 'b7e30a11-6c4f-5a9e-8d2b-epa608000001', 7, 107,
   'Week 7 — Core Review & Practice Exam',
   '<h2>QV5210 Week 7 — Core Review</h2>
    <h3>This Week</h3>
    <ul>
      <li>Comprehensive review of Core Sections (Weeks 1–6)</li>
      <li>Full-length Core practice exam (25 questions)</li>
      <li>Review of commonly missed questions</li>
      <li>Study strategies for exam day</li>
    </ul>
    <h3>Practice Exam</h3>
    <p>Complete the 25-question Core practice exam. You need 70% (18 of 25) to pass the actual EPA 608 Core section. Take the practice exam as many times as needed.</p>',
   90, true, true, NOW()),

  -- ===== TYPE I — Small Appliances (Weeks 8–9) =====
  ('epa60801-0008-5a9e-8d2b-000000000008', 'b7e30a11-6c4f-5a9e-8d2b-epa608000001', 8, 201,
   'Week 8a — Type I: Small Appliance Systems',
   '<h2>QV5210 Week 8a — Type I</h2>
    <h3>Topics Covered</h3>
    <ul>
      <li>What qualifies as a small appliance (5 lbs or less of refrigerant)</li>
      <li>Window AC units, PTAC, household refrigerators, freezers</li>
      <li>Vending machines, water coolers, dehumidifiers</li>
      <li>System-dependent recovery equipment</li>
      <li>Type I recovery requirements: 90% (operating) / 80% (non-operating)</li>
    </ul>
    <h3>Study Kit Materials</h3>
    <p>Reference manual Type I section, small appliance identification guide</p>',
   90, true, true, NOW()),

  ('epa60801-0009-5a9e-8d2b-000000000009', 'b7e30a11-6c4f-5a9e-8d2b-epa608000001', 9, 202,
   'Week 8b — Type I: Recovery Procedures & Leak Repair',
   '<h2>QV5210 Week 8b — Type I</h2>
    <h3>Topics Covered</h3>
    <ul>
      <li>Self-contained vs system-dependent recovery for small appliances</li>
      <li>Passive recovery process and timeline</li>
      <li>Leak repair exemptions for small appliances</li>
      <li>Proper disposal procedures</li>
      <li>Type I practice questions</li>
    </ul>
    <h3>Study Kit Materials</h3>
    <p>Type I practice exam, recovery procedure checklist</p>',
   90, true, true, NOW()),

  -- ===== TYPE II — High-Pressure Systems (Weeks 9–11) =====
  ('epa60801-0010-5a9e-8d2b-000000000010', 'b7e30a11-6c4f-5a9e-8d2b-epa608000001', 10, 301,
   'Week 9 — Type II: High-Pressure Systems & Equipment',
   '<h2>QV5210 Week 9 — Type II</h2>
    <h3>Topics Covered</h3>
    <ul>
      <li>High-pressure refrigerants: R-22, R-410A, R-407C, R-134a</li>
      <li>Residential and commercial AC systems</li>
      <li>Heat pumps, chillers, and rooftop units</li>
      <li>Type II recovery equipment requirements</li>
      <li>Required recovery levels by date of manufacture</li>
    </ul>
    <h3>Study Kit Materials</h3>
    <p>Reference manual Type II section, recovery level chart</p>',
   90, true, true, NOW()),

  ('epa60801-0011-5a9e-8d2b-000000000011', 'b7e30a11-6c4f-5a9e-8d2b-epa608000001', 11, 302,
   'Week 10 — Type II: Leak Rates, Repair & Evacuation',
   '<h2>QV5210 Week 10 — Type II</h2>
    <h3>Topics Covered</h3>
    <ul>
      <li>Leak rate calculations for commercial systems</li>
      <li>Mandatory leak repair thresholds (comfort cooling vs commercial refrigeration)</li>
      <li>Evacuation requirements and vacuum levels for high-pressure systems</li>
      <li>When you can use nitrogen for pressurization</li>
      <li>System-specific recovery procedures</li>
    </ul>
    <h3>Study Kit Materials</h3>
    <p>Leak rate calculation worksheet, evacuation level reference card</p>',
   90, true, true, NOW()),

  ('epa60801-0012-5a9e-8d2b-000000000012', 'b7e30a11-6c4f-5a9e-8d2b-epa608000001', 12, 303,
   'Week 11 — Type II: Review & Practice Exam',
   '<h2>QV5210 Week 11 — Type II</h2>
    <h3>This Week</h3>
    <ul>
      <li>Comprehensive review of Type II material (Weeks 9–10)</li>
      <li>Full-length Type II practice exam (25 questions)</li>
      <li>Review of commonly missed questions</li>
      <li>High-pressure system troubleshooting scenarios</li>
    </ul>
    <h3>Practice Exam</h3>
    <p>Complete the 25-question Type II practice exam. You need 70% (18 of 25) to pass. Take it as many times as needed.</p>',
   90, true, true, NOW()),

  -- ===== TYPE III — Low-Pressure Systems (Weeks 12–14) =====
  ('epa60801-0013-5a9e-8d2b-000000000013', 'b7e30a11-6c4f-5a9e-8d2b-epa608000001', 13, 401,
   'Week 12 — Type III: Low-Pressure Systems & Chillers',
   '<h2>QV5210 Week 12 — Type III</h2>
    <h3>Topics Covered</h3>
    <ul>
      <li>Low-pressure refrigerants: R-11, R-123, R-245fa</li>
      <li>Centrifugal chillers and their operation</li>
      <li>Systems that operate below atmospheric pressure</li>
      <li>Purge units and their function</li>
      <li>Type III recovery equipment and procedures</li>
    </ul>
    <h3>Study Kit Materials</h3>
    <p>Reference manual Type III section, chiller system diagram</p>',
   90, true, true, NOW()),

  ('epa60801-0014-5a9e-8d2b-000000000014', 'b7e30a11-6c4f-5a9e-8d2b-epa608000001', 14, 402,
   'Week 13 — Type III: Recovery, Leak Detection & Water Tubes',
   '<h2>QV5210 Week 13 — Type III</h2>
    <h3>Topics Covered</h3>
    <ul>
      <li>Low-pressure recovery requirements and vacuum levels</li>
      <li>Pressurizing low-pressure systems for leak detection</li>
      <li>Hydrostatic tube testing</li>
      <li>Rupture disc and relief valve requirements</li>
      <li>Leak repair requirements for systems with 50+ lbs of refrigerant</li>
    </ul>
    <h3>Study Kit Materials</h3>
    <p>Type III recovery procedure guide, low-pressure system checklist</p>',
   90, true, true, NOW()),

  ('epa60801-0015-5a9e-8d2b-000000000015', 'b7e30a11-6c4f-5a9e-8d2b-epa608000001', 15, 403,
   'Week 14 — Type III: Review & Practice Exam',
   '<h2>QV5210 Week 14 — Type III</h2>
    <h3>This Week</h3>
    <ul>
      <li>Comprehensive review of Type III material (Weeks 12–13)</li>
      <li>Full-length Type III practice exam (25 questions)</li>
      <li>Review of commonly missed questions</li>
      <li>Low-pressure system scenarios</li>
    </ul>
    <h3>Practice Exam</h3>
    <p>Complete the 25-question Type III practice exam. You need 70% (18 of 25) to pass. Take it as many times as needed.</p>',
   90, true, true, NOW()),

  -- ===== WEEK 15 — Universal Review & Certification Exam =====
  ('epa60801-0016-5a9e-8d2b-000000000016', 'b7e30a11-6c4f-5a9e-8d2b-epa608000001', 16, 501,
   'Week 15 — Universal Review & Proctored Certification Exam',
   '<h2>QV5210 Week 15 — Final Review & Exam</h2>
    <h3>Final Review</h3>
    <ul>
      <li>Full Universal review covering Core + Type I + Type II + Type III</li>
      <li>100-question Universal practice exam</li>
      <li>Exam-day procedures and what to expect</li>
    </ul>
    <h3>Proctored Certification Exam</h3>
    <p>Your EPA Section 608 Universal certification exam is administered through our approved testing partner. The exam consists of four sections:</p>
    <ul>
      <li><strong>Core</strong> — 25 questions (must score 70%+)</li>
      <li><strong>Type I</strong> — 25 questions (must score 70%+)</li>
      <li><strong>Type II</strong> — 25 questions (must score 70%+)</li>
      <li><strong>Type III</strong> — 25 questions (must score 70%+)</li>
    </ul>
    <p>Pass all four sections to earn your <strong>EPA 608 Universal Certification</strong>. Online retesting is available at no additional cost if needed.</p>
    <h3>After You Pass</h3>
    <p>Your certification card is issued directly by the testing partner. This certification does not expire and is recognized nationwide.</p>',
   90, true, true, NOW());

-- 4. Update lesson count on the course
UPDATE training_courses
SET lessons_count = 16,
    updated_at = NOW()
WHERE id = 'b7e30a11-6c4f-5a9e-8d2b-epa608000001';
