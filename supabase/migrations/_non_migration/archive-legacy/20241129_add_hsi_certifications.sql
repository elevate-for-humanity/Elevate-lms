-- ============================================================================
-- HSI CERTIFICATIONS
-- CPR, AED, First Aid, Emergency Medical Responder
-- Contact: Geoff Albrecht (galbrecht@hsi.com)
-- ============================================================================

-- Get HSI provider ID
DO $$
DECLARE
  hsi_provider_id UUID;
BEGIN
  SELECT id INTO hsi_provider_id FROM partner_lms_providers WHERE provider_type = 'hsi' LIMIT 1;

  -- CPR Certification
  INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
  SELECT 
    p.id,
    'CPR & AED Certification (HSI)',
    'HSI-CPR-AED',
    'American Heart Association or Red Cross equivalent CPR and AED certification through HSI',
    false,
    0,
    0.00,
    false,
    true
  FROM programs p
  WHERE p.slug IN ('emergency-health-safety-tech', 'hvac', 'hvac-technician', 'hvac-technician-wrg')
  ON CONFLICT DO NOTHING;

  -- First Aid Certification
  INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
  SELECT 
    p.id,
    'First Aid Certification (HSI)',
    'HSI-FIRST-AID',
    'Basic First Aid certification through HSI',
    false,
    0,
    0.00,
    false,
    false
  FROM programs p
  WHERE p.slug IN ('emergency-health-safety-tech', 'cna', 'cna-training-wrg', 'medical-assistant')
  ON CONFLICT DO NOTHING;

  -- Emergency Medical Responder (EMR)
  INSERT INTO certiport_tests (program_id, test_name, test_code, test_description, requires_pre_test, pre_test_passing_score, test_cost, voucher_required, is_required)
  SELECT 
    p.id,
    'Emergency Medical Responder (EMR) - HSI',
    'HSI-EMR',
    'Emergency Medical Responder certification through HSI - prepares for NREMT certification',
    false,
    0,
    0.00,
    false,
    true
  FROM programs p
  WHERE p.slug IN ('emergency-health-safety-tech')
  ON CONFLICT DO NOTHING;

  -- Map programs to HSI provider
  INSERT INTO program_partner_lms (program_id, provider_id, is_required, sequence_order, auto_enroll_on_program_start, send_welcome_email)
  SELECT 
    p.id,
    hsi_provider_id,
    true,
    2,
    false,
    true
  FROM programs p
  WHERE p.slug IN ('emergency-health-safety-tech', 'hvac', 'hvac-technician', 'hvac-technician-wrg')
  ON CONFLICT DO NOTHING;

END $$;

-- ============================================================================
-- CREATE HSI CLASS SCHEDULING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS hsi_class_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  class_type TEXT CHECK (class_type IN ('cpr_aed_all_ages', 'cpr_aed_adult_only', 'first_aid_cpr_all_ages', 'first_aid_cpr_adult_only', 'emr', 'combined')),
  class_format TEXT CHECK (class_format IN ('traditional', 'blended', 'rsv', 'online')),
  scheduled_date DATE,
  start_time TIME,
  end_time TIME,
  max_students INTEGER DEFAULT 12,
  enrolled_students INTEGER DEFAULT 0,
  instructor_name TEXT,
  location TEXT,
  hsi_class_id TEXT,
  rsv_enrollment_url TEXT,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'invoiced')),
  payment_method TEXT CHECK (payment_method IN ('credit_terms', 'credit_card', 'other')),
  credits_used INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hsi_classes_program ON hsi_class_schedules(program_id);
CREATE INDEX IF NOT EXISTS idx_hsi_classes_date ON hsi_class_schedules(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_hsi_classes_status ON hsi_class_schedules(status);

-- ============================================================================
-- CREATE HSI STUDENT ENROLLMENT TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS hsi_student_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  class_schedule_id UUID REFERENCES hsi_class_schedules(id) ON DELETE SET NULL,
  certification_type TEXT NOT NULL,
  class_format TEXT CHECK (class_format IN ('traditional', 'blended', 'rsv')),
  rsv_enrollment_url TEXT,
  rsv_enrolled BOOLEAN DEFAULT false,
  rsv_enrolled_at TIMESTAMPTZ,
  hsi_email_sent BOOLEAN DEFAULT false,
  hsi_email_sent_at TIMESTAMPTZ,
  blended_training_completed BOOLEAN DEFAULT false,
  skills_session_scheduled BOOLEAN DEFAULT false,
  skills_session_date TIMESTAMPTZ,
  supplies_shipped BOOLEAN DEFAULT false,
  supplies_tracking_number TEXT,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  attended BOOLEAN DEFAULT false,
  attended_at TIMESTAMPTZ,
  passed BOOLEAN DEFAULT false,
  certificate_issued BOOLEAN DEFAULT false,
  certificate_number TEXT,
  certificate_expiration_date DATE,
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hsi_enrollments_user ON hsi_student_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_hsi_enrollments_class ON hsi_student_enrollments(class_schedule_id);

-- ============================================================================
-- ADD EMAIL TEMPLATE FOR HSI CLASS SCHEDULING
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
  'hsi_class_scheduled',
  'live_session_reminder',
  'Your {{certification_type}} Class is Scheduled!',
  '<h1>{{certification_type}} Training Scheduled</h1>
  <p>Hi {{student_name}},</p>
  <p>Great news! Your {{certification_type}} training through HSI has been scheduled.</p>
  
  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3>Class Details:</h3>
    <p><strong>Certification:</strong> {{certification_type}}<br>
    <strong>Date:</strong> {{class_date}}<br>
    <strong>Time:</strong> {{start_time}} - {{end_time}}<br>
    <strong>Format:</strong> {{class_format}}<br>
    <strong>Location:</strong> {{location}}<br>
    <strong>Instructor:</strong> {{instructor_name}}</p>
  </div>

  <h3>What to Bring:</h3>
  <ul>
    <li>Photo ID</li>
    <li>Comfortable clothing</li>
    <li>Notebook and pen</li>
    <li>Water bottle</li>
  </ul>

  <h3>What to Expect:</h3>
  <p>This hands-on training will prepare you for real-world emergency response situations. You''ll practice CPR techniques, learn to use an AED, and gain confidence in your ability to help others.</p>

  <p><strong>Certification:</strong> Upon successful completion, you''ll receive a nationally recognized certification card valid for 2 years.</p>

  <p>Questions? Contact your instructor or reply to this email.</p>

  <p>See you in class!</p>
  <p>Elevate For Humanity Team</p>',
  'Your {{certification_type}} class is scheduled for {{class_date}} at {{start_time}}. Location: {{location}}',
  '["student_name", "certification_type", "class_date", "start_time", "end_time", "class_format", "location", "instructor_name"]'::jsonb,
  true
) ON CONFLICT (template_name) DO NOTHING;

-- ============================================================================
-- ADD EMAIL TEMPLATE FOR HSI RSV ENROLLMENT
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
  'hsi_rsv_enrolled',
  'credentials_ready',
  'Your {{certification_type}} Training is Ready!',
  '<h1>{{certification_type}} - Remote Skills Verification</h1>
  <p>Hi {{student_name}},</p>
  <p>Great news! You''ve been enrolled in {{certification_type}} through HSI''s Remote Skills Verification (RSV) program.</p>
  
  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3>📧 Check Your Email</h3>
    <p>You should receive an email from <strong>info@hsi.com</strong> within the next few minutes with your personal training link.</p>
    <p><strong>Important:</strong> Save that email! You''ll use it to access your training.</p>
  </div>

  <h3>What Happens Next:</h3>
  <ol>
    <li><strong>Complete Online Training</strong> - Watch videos and complete knowledge checks at your own pace</li>
    <li><strong>Schedule Skills Session</strong> - Pick a date and time that works for you</li>
    <li><strong>Receive Supplies</strong> - HSI will ship training supplies to your address</li>
    <li><strong>Complete Skills Session</strong> - Practice hands-on skills via video call with an HSI instructor</li>
    <li><strong>Get Certified</strong> - Receive your certification card (valid for 2 years)</li>
  </ol>

  <h3>⏰ Timeline:</h3>
  <p>Most students complete the online portion in 2-3 hours and schedule their skills session within 1-2 weeks.</p>

  <p><strong>Questions?</strong> Contact HSI Support or reply to this email.</p>

  <p>Good luck with your training!</p>
  <p>Elevate For Humanity Team</p>',
  'You''ve been enrolled in {{certification_type}} via HSI RSV. Check your email from info@hsi.com for your training link.',
  '["student_name", "certification_type"]'::jsonb,
  true
) ON CONFLICT (template_name) DO NOTHING;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ HSI Certifications Added!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 HSI Courses Available:';
  RAISE NOTICE '  - CPR & AED (All Ages)';
  RAISE NOTICE '  - CPR & AED (Adult Only)';
  RAISE NOTICE '  - Adult First Aid + CPR/AED (All Ages)';
  RAISE NOTICE '  - Adult First Aid + CPR/AED (Adult Only)';
  RAISE NOTICE '  - Emergency Medical Responder (EMR)';
  RAISE NOTICE '';
  RAISE NOTICE '👤 Contact: Geoff Albrecht (galbrecht@hsi.com)';
  RAISE NOTICE '📞 Phone: (949) 456-8366';
  RAISE NOTICE '';
  RAISE NOTICE '🏫 Traditional/Blended Classes:';
  RAISE NOTICE '  - Max 12 students per class';
  RAISE NOTICE '  - Credit terms or credit card payment';
  RAISE NOTICE '';
  RAISE NOTICE '💻 RSV (Remote Skills Verification):';
  RAISE NOTICE '  - Online training + remote skills session';
  RAISE NOTICE '  - Supplies shipped to student';
  RAISE NOTICE '  - Uses 1 credit per enrollment';
  RAISE NOTICE '  - Student receives email from info@hsi.com';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Tables Created:';
  RAISE NOTICE '  - hsi_class_schedules (schedule classes)';
  RAISE NOTICE '  - hsi_student_enrollments (track RSV & attendance)';
END $$;
