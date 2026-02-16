-- ============================================================================
-- NRF FOUNDATION RISE UP INTEGRATION
-- Industry-backed training and credentialing program
-- ============================================================================

-- Update NRF provider with complete info
UPDATE partner_lms_providers 
SET 
  provider_name = 'NRF Foundation RISE Up',
  enrollment_url = 'https://riseup.nrf.com',
  sso_url = 'https://riseup.nrf.com/login',
  api_endpoint = 'https://riseup.nrf.com/api',
  contact_name = 'RISE Up Team',
  contact_email = 'riseup@kaleidolearning.com'
WHERE provider_type = 'nrf_rise';

-- ============================================================================
-- NRF RISE UP STUDENT ENROLLMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS nrf_rise_up_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  nrf_account_created BOOLEAN DEFAULT false,
  nrf_account_created_at TIMESTAMPTZ,
  nrf_user_id TEXT,
  training_started BOOLEAN DEFAULT false,
  training_started_at TIMESTAMPTZ,
  training_completed BOOLEAN DEFAULT false,
  training_completed_at TIMESTAMPTZ,
  credential_earned BOOLEAN DEFAULT false,
  credential_earned_at TIMESTAMPTZ,
  credential_number TEXT,
  credential_url TEXT,
  credential_expiration_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, enrollment_id)
);

CREATE INDEX IF NOT EXISTS idx_nrf_enrollments_user ON nrf_rise_up_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_nrf_enrollments_enrollment ON nrf_rise_up_enrollments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_nrf_enrollments_program ON nrf_rise_up_enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_nrf_enrollments_credential ON nrf_rise_up_enrollments(credential_earned);

-- ============================================================================
-- MAP NRF RISE UP TO PROGRAMS
-- ============================================================================

DO $$
DECLARE
  nrf_provider_id UUID;
BEGIN
  SELECT id INTO nrf_provider_id FROM partner_lms_providers WHERE provider_type = 'nrf_rise' LIMIT 1;

  -- Map NRF RISE Up to programs that require it
  INSERT INTO program_partner_lms (program_id, provider_id, is_required, sequence_order, auto_enroll_on_program_start, send_welcome_email)
  SELECT 
    p.id,
    nrf_provider_id,
    true,
    2,
    true,
    true
  FROM programs p
  WHERE p.slug IN ('hvac', 'hvac-technician', 'hvac-technician-wrg', 'tax-prep-financial-services', 'beauty-career-educator', 'rise-up-certificate')
  ON CONFLICT DO NOTHING;
END $$;

-- ============================================================================
-- EMAIL TEMPLATE FOR NRF RISE UP ENROLLMENT
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
  'nrf_rise_up_enrollment',
  'credentials_ready',
  'Welcome to NRF Foundation RISE Up!',
  '<h1>Welcome to RISE Up!</h1>
  <p>Hi {{student_name}},</p>
  <p>You''ve been enrolled in the <strong>NRF Foundation RISE Up</strong> training and credentialing program!</p>
  
  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3>🎯 What is RISE Up?</h3>
    <p>RISE Up is an industry-backed program that provides foundational employability skills to help you land jobs and get promoted in retail and beyond.</p>
  </div>

  <h3>🚀 Get Started:</h3>
  <p><strong>Step 1:</strong> Set up your password</p>
  <ol>
    <li>Go to <a href="https://riseup.nrf.com/login">riseup.nrf.com/login</a></li>
    <li>Click "Forgot password?"</li>
    <li>Enter your email: <strong>{{student_email}}</strong></li>
    <li>Follow the password reset process</li>
  </ol>

  <p><strong>Step 2:</strong> Log in and start training</p>
  <p><a href="https://riseup.nrf.com/login" style="background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Access RISE Up Platform</a></p>

  <h3>📚 What You''ll Learn:</h3>
  <ul>
    <li>Professional communication</li>
    <li>Customer service excellence</li>
    <li>Workplace readiness</li>
    <li>Problem-solving skills</li>
    <li>Teamwork and collaboration</li>
  </ul>

  <h3>🏆 What You''ll Earn:</h3>
  <ul>
    <li>Industry-recognized RISE Up credential</li>
    <li>Digital badge for LinkedIn and resumes</li>
    <li>Skills employers are actively seeking</li>
    <li>Career advancement opportunities</li>
  </ul>

  <h3>📞 Need Help?</h3>
  <p>Visit the <a href="https://support.riseup.nrf.com">RISE Up Help Center</a> or contact support at <a href="mailto:riseup@kaleidolearning.com">riseup@kaleidolearning.com</a></p>

  <p>Let''s RISE Up together!</p>
  <p>Elevate For Humanity Team</p>',
  'Welcome to NRF RISE Up! Set up your password at: https://riseup.nrf.com/login',
  '["student_name", "student_email"]'::jsonb,
  true
) ON CONFLICT (template_name) DO NOTHING;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ NRF Foundation RISE Up Integration Complete!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 NRF RISE Up:';
  RAISE NOTICE '  - Industry-backed training and credentialing';
  RAISE NOTICE '  - Foundational employability skills';
  RAISE NOTICE '  - Organization: Elevate for Humanity Career and Training Center';
  RAISE NOTICE '  - Status: APPROVED';
  RAISE NOTICE '';
  RAISE NOTICE '🔗 Platform Access:';
  RAISE NOTICE '  - Login: https://riseup.nrf.com/login';
  RAISE NOTICE '  - Help Center: https://support.riseup.nrf.com';
  RAISE NOTICE '  - Support: riseup@kaleidolearning.com';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Table Created:';
  RAISE NOTICE '  - nrf_rise_up_enrollments (track training & credentials)';
  RAISE NOTICE '';
  RAISE NOTICE '📧 Email Domains to Whitelist:';
  RAISE NOTICE '  - kaleidolearning.com';
  RAISE NOTICE '  - riseup@kaleidolearning.com';
  RAISE NOTICE '  - riseupsupport@kaleidolearning.com';
  RAISE NOTICE '  - support@kaleidoscopelearning.zendesk.com';
END $$;
