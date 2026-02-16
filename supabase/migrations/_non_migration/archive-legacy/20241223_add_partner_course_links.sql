-- Add access links to partner courses for link-based enrollment

-- Add access_link column to partner_courses
ALTER TABLE partner_courses 
  ADD COLUMN IF NOT EXISTS access_link TEXT;

-- Add access_link to partner_lms_enrollments for per-enrollment links
ALTER TABLE partner_lms_enrollments
  ADD COLUMN IF NOT EXISTS access_link TEXT;

-- Add index for quick lookup
CREATE INDEX IF NOT EXISTS idx_partner_courses_access_link 
  ON partner_courses(access_link) WHERE access_link IS NOT NULL;

-- Update existing partner courses with actual partner LMS URLs
-- Milady RISE courses
UPDATE partner_courses 
SET access_link = 'https://www.miladytraining.com/users/sign_in'
WHERE access_link IS NULL 
  AND partner_id = 'milady'
  AND active = true;

-- HSI courses
UPDATE partner_courses 
SET access_link = 'https://www.hsi.com/login'
WHERE access_link IS NULL 
  AND partner_id = 'hsi'
  AND active = true;

-- CareerSafe courses
UPDATE partner_courses 
SET access_link = 'https://www.careersafeonline.com/login'
WHERE access_link IS NULL 
  AND partner_id = 'careersafe'
  AND active = true;

-- Certiport courses
UPDATE partner_courses 
SET access_link = 'https://www.certiport.com/portal/ssl/login.aspx'
WHERE access_link IS NULL 
  AND partner_id = 'certiport'
  AND active = true;

-- JRI courses (SCORM-based via EmployIndy)
UPDATE partner_courses 
SET access_link = 'https://learning.employindy.org/jri-participant-elevatehumanitycareertraining'
WHERE access_link IS NULL 
  AND partner_id = 'jri'
  AND active = true;

-- National Drug Screening courses
UPDATE partner_courses 
SET access_link = 'https://www.nationaldrugscreening.com/training-consulting/'
WHERE access_link IS NULL 
  AND partner_id = 'nds'
  AND active = true;

-- NRF RISE Up courses
UPDATE partner_courses 
SET access_link = 'https://riseup.nrf.com'
WHERE access_link IS NULL 
  AND partner_id = 'nrf_rise'
  AND active = true;

-- Add comment
COMMENT ON COLUMN partner_courses.access_link IS 'Direct link to partner LMS course for learner access';
COMMENT ON COLUMN partner_lms_enrollments.access_link IS 'Per-enrollment access link (may include enrollment token)';
