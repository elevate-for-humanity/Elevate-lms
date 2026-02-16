-- ============================================================================
-- BARBER APPRENTICESHIP COMPLETE SEED WITH TRANSFER HOURS SUPPORT
-- ============================================================================
-- Run this after the main LMS schema is in place
-- Includes: Program, Modules, SCORM, JRI, Funding, Transfer Hours tables

BEGIN;

-- ============================================================================
-- PART 1: TRANSFER HOURS TABLES
-- ============================================================================

-- Table to store transfer/previous hours from other schools/states
CREATE TABLE IF NOT EXISTS transfer_hour_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who the student is
  student_id uuid NOT NULL,                -- auth.users.id
  
  -- Where hours came from
  source_state text NOT NULL,              -- 'IN', 'IL', etc.
  source_school_name text NOT NULL,        -- "ABC Barber College"
  source_program_name text,                -- "Barber Training 1500 hours"
  source_license_or_student_id text,       -- optional
  
  -- What type of hours
  hours_theory numeric(8,2) DEFAULT 0,     -- classroom hours
  hours_clinic numeric(8,2) DEFAULT 0,     -- shop/clinic/OJT hours
  hours_other numeric(8,2) DEFAULT 0,      -- misc / lab
  
  -- Documentation
  documentation_url text,                  -- Supabase storage path / URL
  documentation_type text,                 -- transcript, letter, etc.
  
  -- How EFH uses it
  mapped_program_id uuid REFERENCES programs(id) ON DELETE SET NULL,
  mapped_ojt_hours_applied numeric(8,2) DEFAULT 0,
  mapped_related_hours_applied numeric(8,2) DEFAULT 0,
  
  status text NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  reviewed_by text,                        -- EFH staff initials/name
  reviewed_at timestamptz,
  notes text,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS transfer_hour_records_student_idx
  ON transfer_hour_records(student_id);

CREATE INDEX IF NOT EXISTS transfer_hour_records_program_idx
  ON transfer_hour_records(mapped_program_id);

CREATE INDEX IF NOT EXISTS transfer_hour_records_status_idx
  ON transfer_hour_records(status);

-- Add transferred hours tracking to apprenticeship enrollments
ALTER TABLE apprenticeship_enrollments
  ADD COLUMN IF NOT EXISTS transferred_related_instruction_hours numeric(8,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS transferred_ojt_hours numeric(8,2) DEFAULT 0;

-- ============================================================================
-- PART 2: BARBER APPRENTICESHIP PROGRAM
-- ============================================================================

-- Insert Barber Apprenticeship program
INSERT INTO programs (
  slug, name, category, description,
  delivery_mode, is_apprenticeship, is_on_etpl,
  rapids_program_id, rapids_occupation_code, active
)
VALUES (
  'barber-apprenticeship',
  'Barber Apprenticeship',
  'Beauty & Barbering',
  'State of Indiana–approved Barber Apprenticeship program combining classroom instruction, Milady theory, Job Ready Indy employability skills, and supervised shop experience.',
  'hybrid',
  true,
  false,          -- Set to true once ETPL approved
  'IN-XXXXXX',    -- TODO: Replace with your real RAPIDS program ID
  'Barber',       -- TODO: Replace with SOC/ONET code if you have it
  true
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  delivery_mode = EXCLUDED.delivery_mode,
  is_apprenticeship = EXCLUDED.is_apprenticeship;

-- ============================================================================
-- PART 3: JRI BADGE TEMPLATES
-- ============================================================================

INSERT INTO jri_badge_templates (code, name, description)
VALUES
  ('JRI-1-MINDSET', 'Mindset', 'Develop a growth mindset and positive attitude toward work.'),
  ('JRI-2-SELF-MANAGEMENT', 'Self-Management', 'Learn time management, organization, and responsibility.'),
  ('JRI-3-LEARNING-STRATEGIES', 'Learning Strategies', 'Build study and problem-solving strategies.'),
  ('JRI-4-SOCIAL-SKILLS', 'Social Skills', 'Practice teamwork, communication, and conflict resolution.'),
  ('JRI-5-WORKPLACE-SKILLS', 'Workplace Skills', 'Understand professionalism and workplace expectations.'),
  ('JRI-6-CAREER-LAUNCH', 'Career Launch', 'Prepare for job search, interviewing, and employment success.')
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- PART 4: COURSE MODULES FOR BARBER
-- ============================================================================

-- Module 0: JRI soft skills (SCORM)
INSERT INTO course_modules (
  program_id, title, description, order_index,
  content_type, partner_name, required_hours,
  requires_proof, is_required
)
SELECT
  id,
  'Module 0: Job Ready Indy – Employability Skills',
  'Complete the full Job Ready Indy badge series to build core employability skills recognized by Marion County employers.',
  0,
  'scorm',
  'JRI',
  40,
  true,
  true
FROM programs WHERE slug = 'barber-apprenticeship'
ON CONFLICT DO NOTHING;

-- Module 1: Milady Barber Theory (external link)
INSERT INTO course_modules (
  program_id, title, description, order_index,
  content_type, partner_name, external_url, required_hours,
  requires_proof, is_required
)
SELECT
  id,
  'Module 1: Barber Theory – Milady',
  'Milady-based barber theory covering safety, sanitation, hair and scalp, cutting theory, and state-required foundational knowledge.',
  1,
  'external_link',
  'Milady',
  'https://YOUR-MILADY-LINK-HERE',  -- TODO: Replace with real Milady URL
  120,
  true,
  true
FROM programs WHERE slug = 'barber-apprenticeship'
ON CONFLICT DO NOTHING;

-- Module 2: Practical / Shop Experience (OJT)
INSERT INTO course_modules (
  program_id, title, description, order_index,
  content_type, partner_name, required_hours,
  requires_proof, is_required
)
SELECT
  id,
  'Module 2: Practical – Shop & Clinic Hours',
  'Supervised shop and clinic hours performing real services under a licensed barber or instructor, logged toward state hour requirements.',
  2,
  'other',
  'EFH / Partner Shop',
  1500,
  true,
  true
FROM programs WHERE slug = 'barber-apprenticeship'
ON CONFLICT DO NOTHING;

-- Module 3: State Board Prep (SCORM)
INSERT INTO course_modules (
  program_id, title, description, order_index,
  content_type, partner_name, required_hours,
  requires_proof, is_required
)
SELECT
  id,
  'Module 3: State Board Preparation',
  'Targeted preparation for the Indiana State Barber Board theory and practical exams.',
  3,
  'scorm',
  'EFH',
  40,
  true,
  true
FROM programs WHERE slug = 'barber-apprenticeship'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 5: SCORM PACKAGES
-- ============================================================================

-- JRI SCORM Package
INSERT INTO scorm_packages (
  module_id, title, provider, scorm_version,
  storage_path, launch_url, estimated_hours
)
SELECT
  cm.id,
  'Job Ready Indy – SCORM Package',
  'JRI',
  '1.2',
  'scorm/jri/barber/jri-bundle.zip',  -- TODO: Change to your real Supabase path
  '/lms/scorm/player?package=jri-barber',  -- TODO: Your SCORM player route
  40
FROM course_modules cm
JOIN programs p ON cm.program_id = p.id
WHERE p.slug = 'barber-apprenticeship'
  AND cm.title = 'Module 0: Job Ready Indy – Employability Skills'
ON CONFLICT DO NOTHING;

-- State Board Prep SCORM Package
INSERT INTO scorm_packages (
  module_id, title, provider, scorm_version,
  storage_path, launch_url, estimated_hours
)
SELECT
  cm.id,
  'Barber State Board Prep – SCORM',
  'EFH',
  '1.2',
  'scorm/barber/state-board-prep.zip',  -- TODO: Adjust path
  '/lms/scorm/player?package=barber-state-board-prep',
  40
FROM course_modules cm
JOIN programs p ON cm.program_id = p.id
WHERE p.slug = 'barber-apprenticeship'
  AND cm.title = 'Module 3: State Board Preparation'
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PART 6: LINK JRI BADGES TO JRI MODULE
-- ============================================================================

INSERT INTO jri_module_links (module_id, jri_badge_template_id)
SELECT
  cm.id,
  jbt.id
FROM course_modules cm
JOIN programs p ON cm.program_id = p.id
CROSS JOIN jri_badge_templates jbt
WHERE p.slug = 'barber-apprenticeship'
  AND cm.title = 'Module 0: Job Ready Indy – Employability Skills'
  AND jbt.code IN (
    'JRI-1-MINDSET',
    'JRI-2-SELF-MANAGEMENT',
    'JRI-3-LEARNING-STRATEGIES',
    'JRI-4-SOCIAL-SKILLS',
    'JRI-5-WORKPLACE-SKILLS',
    'JRI-6-CAREER-LAUNCH'
  )
ON CONFLICT (module_id, jri_badge_template_id) DO NOTHING;

-- ============================================================================
-- PART 7: FUNDING PROGRAMS
-- ============================================================================

INSERT INTO funding_programs (
  code, name, description, funding_type,
  pays_tuition, pays_wages, pays_stipend, is_active
)
VALUES
  ('WIOA-ADULT', 'WIOA Adult', 'WIOA Adult funding for eligible participants.', 'tuition', true, false, false, true),
  ('WIOA-YOUTH', 'WIOA Youth', 'WIOA Youth funding for eligible participants.', 'tuition', true, false, false, true),
  ('WRG', 'Workforce Ready Grant', 'Indiana Workforce Ready Grant funding for high-demand programs.', 'tuition', true, false, false, true),
  ('JRI', 'Job Ready Indy Support', 'Job Ready Indy–linked support where available (badges + possible stipends if contracted).', 'mixed', false, false, true, true),
  ('APPRENTICESHIP', 'Registered Apprenticeship', 'Registered Apprenticeship model with wage reimbursement/offsets via state or workforce programs.', 'wage', false, true, false, true)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;

-- ============================================================================
-- PART 8: LINK BARBER PROGRAM TO FUNDING OPTIONS
-- ============================================================================

INSERT INTO program_funding_options (program_id, funding_program_id, is_default)
SELECT
  p.id,
  fp.id,
  CASE WHEN fp.code = 'WIOA-ADULT' THEN true ELSE false END
FROM programs p
CROSS JOIN funding_programs fp
WHERE p.slug = 'barber-apprenticeship'
  AND fp.code IN ('WIOA-ADULT', 'WRG', 'JRI', 'APPRENTICESHIP')
ON CONFLICT (program_id, funding_program_id) DO NOTHING;

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify program was created
SELECT 'Program created:' as status, slug, name FROM programs WHERE slug = 'barber-apprenticeship';

-- Verify modules were created
SELECT 'Modules created:' as status, COUNT(*) as module_count 
FROM course_modules cm
JOIN programs p ON cm.program_id = p.id
WHERE p.slug = 'barber-apprenticeship';

-- Verify SCORM packages were linked
SELECT 'SCORM packages:' as status, COUNT(*) as scorm_count
FROM scorm_packages sp
JOIN course_modules cm ON sp.module_id = cm.id
JOIN programs p ON cm.program_id = p.id
WHERE p.slug = 'barber-apprenticeship';

-- Verify funding options were linked
SELECT 'Funding options:' as status, COUNT(*) as funding_count
FROM program_funding_options pfo
JOIN programs p ON pfo.program_id = p.id
WHERE p.slug = 'barber-apprenticeship';

-- ============================================================================
-- NOTES FOR IMPLEMENTATION
-- ============================================================================

/*
TODO ITEMS TO UPDATE AFTER RUNNING THIS SCRIPT:

1. Update RAPIDS Program ID:
   UPDATE programs 
   SET rapids_program_id = 'YOUR-REAL-RAPIDS-ID'
   WHERE slug = 'barber-apprenticeship';

2. Update ETPL status when approved:
   UPDATE programs 
   SET is_on_etpl = true, etpl_program_code = 'YOUR-ETPL-CODE'
   WHERE slug = 'barber-apprenticeship';

3. Update Milady external URL:
   UPDATE course_modules
   SET external_url = 'YOUR-REAL-MILADY-URL'
   WHERE title = 'Module 1: Barber Theory – Milady';

4. Update SCORM storage paths:
   UPDATE scorm_packages
   SET storage_path = 'YOUR-REAL-PATH', launch_url = 'YOUR-REAL-LAUNCH-URL'
   WHERE provider IN ('JRI', 'EFH');

5. Set actual hour requirements based on Indiana State Board:
   UPDATE course_modules
   SET required_hours = ACTUAL_HOURS
   WHERE program_id = (SELECT id FROM programs WHERE slug = 'barber-apprenticeship');
*/
