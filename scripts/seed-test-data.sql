-- EFH Test Data Seed
-- Run this once in Supabase SQL Editor to prepare for testing

-- 1️⃣ Seed Test Program (idempotent)
INSERT INTO programs (name, slug, description, state_code, active)
VALUES (
  'Barber Apprenticeship',
  'barber-apprenticeship',
  'DOL Registered Apprenticeship - Indiana State Board Approved. Master the art of barbering with comprehensive 2,000-hour training.',
  'IN',
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  active = EXCLUDED.active;

-- 2️⃣ Seed AI Instructor (Indiana-specific)
INSERT INTO ai_instructors (name, role, specialty, system_prompt, active)
VALUES (
  'Master Barber Coach – EFH',
  'AI Instructor',
  'Barber Apprenticeship',
  'You are a licensed Indiana barber instructor. You follow Indiana PLA rules, DOL RAPIDS standards, and Milady RISE curriculum requirements. You guide apprentices toward Indiana licensure. You are supportive, clear, and compliant with state apprenticeship standards.',
  true
)
ON CONFLICT DO NOTHING;

-- 3️⃣ Indiana state compliance (LOCKED)
INSERT INTO state_compliance (
  state_code,
  state_name,
  required_hours,
  classroom_hours,
  on_the_job_hours,
  exam_required,
  active,
  notes
)
VALUES (
  'IN',
  'Indiana',
  2000,
  300,
  1700,
  true,
  true,
  'Indiana PLA – Barber Apprenticeship'
)
ON CONFLICT (state_code) DO NOTHING;

-- 4️⃣ Verify tenant exists
INSERT INTO tenants (name, slug, active, license_type)
VALUES ('Elevate for Humanity', 'efh-core', true, 'enterprise')
ON CONFLICT (slug) DO NOTHING;

-- Verification queries
SELECT '✅ Programs:' as check, COUNT(*) as count FROM programs WHERE slug = 'barber-apprenticeship';
SELECT '✅ AI Instructors:' as check, COUNT(*) as count FROM ai_instructors WHERE specialty = 'Barber Apprenticeship';
SELECT '✅ State Compliance:' as check, COUNT(*) as count FROM state_compliance WHERE state_code = 'IN';
SELECT '✅ Tenants:' as check, COUNT(*) as count FROM tenants WHERE slug = 'efh-core';
