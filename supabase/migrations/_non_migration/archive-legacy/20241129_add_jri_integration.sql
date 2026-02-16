-- ============================================================================
-- JRI (JOB READY INDY) INTEGRATION
-- EmployIndy 6-Badge Workforce Readiness Program
-- ============================================================================

-- Update JRI provider with complete info
UPDATE partner_lms_providers 
SET 
  provider_name = 'Job Readiness Initiative (JRI) - EmployIndy',
  enrollment_url = 'https://learning.employindy.org/jri-participant-elevatehumanitycareertraining',
  sso_url = 'https://jri.employindy.org',
  api_endpoint = 'https://learning.employindy.org',
  contact_name = 'The Learning Team',
  contact_email = 'learning@employindy.org'
WHERE provider_type = 'jri';

-- ============================================================================
-- JRI BADGE TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS jri_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_number INTEGER NOT NULL CHECK (badge_number BETWEEN 1 AND 6),
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  course_url TEXT,
  order_index INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert 6 JRI Badges
INSERT INTO jri_badges (badge_number, badge_name, badge_description, order_index) VALUES
(1, 'Introduction to Job Ready Indy', 'Foundation of workforce readiness and JRI program overview', 1),
(2, 'Professional Communication', 'Workplace communication skills and professional etiquette', 2),
(3, 'Workplace Readiness', 'Essential workplace behaviors and expectations', 3),
(4, 'Digital Literacy', 'Computer skills and digital workplace tools', 4),
(5, 'Financial Literacy', 'Personal finance management and budgeting', 5),
(6, 'Career Planning', 'Goal setting, resume building, and career pathways', 6)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- JRI STUDENT PROGRESS TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS jri_student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  jri_registered BOOLEAN DEFAULT false,
  jri_registration_url TEXT,
  jri_registered_at TIMESTAMPTZ,
  badge_1_completed BOOLEAN DEFAULT false,
  badge_1_completed_at TIMESTAMPTZ,
  badge_2_completed BOOLEAN DEFAULT false,
  badge_2_completed_at TIMESTAMPTZ,
  badge_3_completed BOOLEAN DEFAULT false,
  badge_3_completed_at TIMESTAMPTZ,
  badge_4_completed BOOLEAN DEFAULT false,
  badge_4_completed_at TIMESTAMPTZ,
  badge_5_completed BOOLEAN DEFAULT false,
  badge_5_completed_at TIMESTAMPTZ,
  badge_6_completed BOOLEAN DEFAULT false,
  badge_6_completed_at TIMESTAMPTZ,
  all_badges_completed BOOLEAN DEFAULT false,
  completion_date TIMESTAMPTZ,
  jri_certificate_issued BOOLEAN DEFAULT false,
  jri_certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, enrollment_id)
);

CREATE INDEX IF NOT EXISTS idx_jri_progress_user ON jri_student_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_jri_progress_enrollment ON jri_student_progress(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_jri_progress_completed ON jri_student_progress(all_badges_completed);

-- ============================================================================
-- MAP JRI TO PROGRAMS
-- ============================================================================

DO $$
DECLARE
  jri_provider_id UUID;
BEGIN
  SELECT id INTO jri_provider_id FROM partner_lms_providers WHERE provider_type = 'jri' LIMIT 1;

  -- Map JRI to programs that require it
  INSERT INTO program_partner_lms (program_id, provider_id, is_required, sequence_order, auto_enroll_on_program_start, send_welcome_email)
  SELECT 
    p.id,
    jri_provider_id,
    true,
    1,
    true,
    true
  FROM programs p
  WHERE p.slug IN ('peer-recovery-specialist-jri', 'life-coach-certification-wioa', 'beauty-career-educator', 'rise-up-certificate')
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================================================
-- EMAIL TEMPLATE FOR JRI ENROLLMENT
-- ============================================================================

INSERT INTO email_templates (
  template_name,
  template_type,
  subject_template,
  body_html_template,
  body_text_template,
  variables,
  is_active
) VALUES (
  'jri_enrollment',
  'credentials_ready',
  'Welcome to Job Ready Indy (JRI)!',
  '<h1>Welcome to Job Ready Indy!</h1>
  <p>Hi {{student_name}},</p>
  <p>You''ve been enrolled in the <strong>Job Ready Indy (JRI)</strong> program through EmployIndy!</p>
  
  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3>🎯 What is JRI?</h3>
    <p>Job Ready Indy is a 6-badge workforce readiness program that teaches essential skills for career success:</p>
    <ol>
      <li>Introduction to Job Ready Indy</li>
      <li>Professional Communication</li>
      <li>Workplace Readiness</li>
      <li>Digital Literacy</li>
      <li>Financial Literacy</li>
      <li>Career Planning</li>
    </ol>
  </div>

  <h3>🚀 Get Started:</h3>
  <p><strong>Step 1:</strong> Register for JRI using your custom link:</p>
  <p><a href="https://learning.employindy.org/jri-participant-elevatehumanitycareertraining" style="background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Register for JRI</a></p>
  
  <p><strong>Step 2:</strong> After registration, access your courses at:</p>
  <p><a href="https://jri.employindy.org">jri.employindy.org</a></p>

  <h3>⏰ Timeline:</h3>
  <p>Most students complete all 6 badges in 4-6 weeks, working at their own pace.</p>

  <h3>🏆 What You''ll Earn:</h3>
  <ul>
    <li>6 digital badges (one for each course)</li>
    <li>Job Ready Indy Certificate</li>
    <li>Nationally recognized workforce credential</li>
    <li>Skills employers are looking for</li>
  </ul>

  <p><strong>Questions?</strong> Contact the EmployIndy Learning Team at learning@employindy.org</p>

  <p>Let''s get you job ready!</p>
  <p>Elevate For Humanity Team</p>',
  'Welcome to Job Ready Indy! Register at: https://learning.employindy.org/jri-participant-elevatehumanitycareertraining',
  '["student_name"]'::jsonb,
  true
) ON CONFLICT (template_name) DO NOTHING;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ JRI Integration Complete!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Job Ready Indy (JRI):';
  RAISE NOTICE '  - 6 Badge Workforce Readiness Program';
  RAISE NOTICE '  - Provider: EmployIndy';
  RAISE NOTICE '  - Facilitator: Elizabeth Greene';
  RAISE NOTICE '';
  RAISE NOTICE '🔗 Registration Link:';
  RAISE NOTICE '  https://learning.employindy.org/jri-participant-elevatehumanitycareertraining';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Dashboard Access:';
  RAISE NOTICE '  - Course Progress dashboard';
  RAISE NOTICE '  - Filter: JRI Participant - Elevate for Humanity Career and Training Institute';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Tables Created:';
  RAISE NOTICE '  - jri_badges (6 badge definitions)';
  RAISE NOTICE '  - jri_student_progress (track badge completion)';
END $$;
