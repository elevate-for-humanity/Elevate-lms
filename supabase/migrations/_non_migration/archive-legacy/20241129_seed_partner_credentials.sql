-- ============================================================================
-- SEED ACTUAL PARTNER CREDENTIALS
-- Real credentials from partners (not placeholders)
-- ============================================================================

-- ============================================================================
-- INSERT PARTNER LMS PROVIDERS WITH REAL CREDENTIALS
-- ============================================================================

-- Milady RISE Partner
INSERT INTO partner_lms_providers (
  provider_name,
  provider_type,
  enrollment_url,
  promo_code,
  contact_name,
  contact_email,
  contact_phone,
  is_active,
  requires_payment,
  payment_amount
) VALUES (
  'Milady RISE - Client Well-Being & Safety',
  'milady',
  'https://www.miladytraining.com/bundles/client-well-being-safety-certification',
  'efhcti-rise295',
  'Jessica Boyd',
  'jessica.boyd@cengage.com',
  '(919) 623-4623',
  true,
  false,
  0.00
) ON CONFLICT DO NOTHING;

-- Job Readiness Initiative (JRI) - EmployIndy
INSERT INTO partner_lms_providers (
  provider_name,
  provider_type,
  api_endpoint,
  enrollment_url,
  sso_url,
  contact_name,
  contact_email,
  is_active,
  requires_payment,
  payment_amount
) VALUES (
  'Job Readiness Initiative (JRI) - EmployIndy',
  'jri',
  'https://learning.employindy.org',
  'https://learning.employindy.org/jri-participant-elevatehumanitycareertraining',
  'https://jri.employindy.org',
  'The Learning Team',
  'learning@employindy.org',
  true,
  false,
  0.00
) ON CONFLICT DO NOTHING;

-- Certiport Testing
INSERT INTO partner_lms_providers (
  provider_name,
  provider_type,
  api_endpoint,
  enrollment_url,
  contact_name,
  contact_email,
  is_active,
  requires_payment,
  payment_amount
) VALUES (
  'Certiport Certification Testing',
  'certiport',
  'https://certiport.pearsonvue.com/api',
  'https://certiport.pearsonvue.com',
  'Elizabeth Powell',
  'elizabethpowell6262@gmail.com',
  true,
  true,
  150.00
) ON CONFLICT DO NOTHING;

-- NRF RISE Up
INSERT INTO partner_lms_providers (
  provider_name,
  provider_type,
  enrollment_url,
  sso_url,
  api_endpoint,
  contact_name,
  contact_email,
  is_active,
  requires_payment,
  payment_amount
) VALUES (
  'NRF Foundation RISE Up',
  'nrf_rise',
  'https://riseup.nrf.com',
  'https://riseup.nrf.com/login',
  'https://riseup.nrf.com/api',
  'RISE Up Team',
  'riseup@kaleidolearning.com',
  true,
  false,
  0.00
) ON CONFLICT DO NOTHING;

-- HSI Safety Training (CPR, AED, First Aid, EMR)
INSERT INTO partner_lms_providers (
  provider_name,
  provider_type,
  enrollment_url,
  contact_name,
  contact_email,
  contact_phone,
  is_active,
  requires_payment,
  payment_amount
) VALUES (
  'HSI - CPR, AED, First Aid & EMR Training',
  'hsi',
  'https://hsi.com/solutions/cpr-aed-first-aid-training/elevate-for-humanity-career-training-institute-nts-class-sign-up',
  'Geoff Albrecht',
  'galbrecht@hsi.com',
  '(949) 456-8366',
  true,
  true,
  0.00
) ON CONFLICT DO NOTHING;

-- CareerSafe OSHA
INSERT INTO partner_lms_providers (
  provider_name,
  provider_type,
  enrollment_url,
  sso_url,
  contact_name,
  contact_email,
  contact_phone,
  is_active,
  requires_payment,
  payment_amount
) VALUES (
  'CareerSafe OSHA Training',
  'careersafe',
  'https://www.careersafeonline.com/campus/signin',
  'https://www.careersafeonline.com/campus',
  'Mark Sattele',
  'Mark.Sattele@careersafeonline.com',
  '(216) 926-6536',
  true,
  true,
  0.00
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- MAP PROGRAMS TO PARTNER LMS
-- ============================================================================

-- Barber programs → Milady RISE
INSERT INTO program_partner_lms (program_id, provider_id, is_required, sequence_order, auto_enroll_on_program_start, send_welcome_email)
SELECT 
  p.id,
  (SELECT id FROM partner_lms_providers WHERE provider_type = 'milady' LIMIT 1),
  true,
  1,
  true,
  true
FROM programs p
WHERE p.slug IN ('barber', 'barber-apprenticeship-wrg', 'barber-apprenticeship-full')
ON CONFLICT DO NOTHING;

-- JRI programs → JRI LMS
INSERT INTO program_partner_lms (program_id, provider_id, is_required, sequence_order, auto_enroll_on_program_start, send_welcome_email)
SELECT 
  p.id,
  (SELECT id FROM partner_lms_providers WHERE provider_type = 'jri' LIMIT 1),
  true,
  1,
  true,
  true
FROM programs p
WHERE p.slug IN ('peer-recovery-specialist-jri', 'life-coach-certification-wioa')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- SEED EMAIL TEMPLATES
-- ============================================================================

-- Welcome Email Template
INSERT INTO email_templates (
  template_name,
  template_type,
  subject_template,
  body_html_template,
  body_text_template,
  variables,
  is_active
) VALUES (
  'welcome_to_program',
  'welcome',
  'Welcome to {{program_name}} at Elevate For Humanity!',
  '<h1>Welcome {{student_name}}!</h1>
  <p>Congratulations on enrolling in <strong>{{program_name}}</strong>!</p>
  <p>Your journey to a new career starts now. Here''s what happens next:</p>
  <ul>
    <li>Access your student dashboard at <a href="{{dashboard_url}}">{{dashboard_url}}</a></li>
    <li>Complete your orientation module</li>
    <li>Meet your instructor and cohort</li>
  </ul>
  <p>We''re excited to support you every step of the way!</p>
  <p>Best regards,<br>Elevate For Humanity Team</p>',
  'Welcome {{student_name}}! Congratulations on enrolling in {{program_name}}!',
  '["student_name", "program_name", "dashboard_url"]'::jsonb,
  true
) ON CONFLICT (template_name) DO NOTHING;

-- External LMS Credentials Email
INSERT INTO email_templates (
  template_name,
  template_type,
  subject_template,
  body_html_template,
  body_text_template,
  variables,
  is_active
) VALUES (
  'external_lms_credentials',
  'credentials_ready',
  'Your {{partner_name}} Access is Ready!',
  '<h1>Your {{partner_name}} Credentials</h1>
  <p>Hi {{student_name}},</p>
  <p>Great news! Your access to <strong>{{partner_name}}</strong> is now ready.</p>
  <h3>How to Access:</h3>
  <ol>
    <li>Go to: <a href="{{enrollment_url}}">{{enrollment_url}}</a></li>
    <li>{{#if promo_code}}Use promo code: <strong>{{promo_code}}</strong>{{/if}}</li>
    <li>{{#if credentials}}Login with:<br>Username: {{username}}<br>Password: {{password}}{{/if}}</li>
  </ol>
  <p>{{additional_instructions}}</p>
  <p>Questions? Reply to this email or contact your instructor.</p>',
  'Your {{partner_name}} access is ready! Go to {{enrollment_url}}',
  '["student_name", "partner_name", "enrollment_url", "promo_code", "username", "password", "additional_instructions"]'::jsonb,
  true
) ON CONFLICT (template_name) DO NOTHING;

-- Live Session Reminder
INSERT INTO email_templates (
  template_name,
  template_type,
  subject_template,
  body_html_template,
  body_text_template,
  variables,
  is_active
) VALUES (
  'live_session_reminder',
  'live_session_reminder',
  'Reminder: {{session_title}} - {{session_date}}',
  '<h1>Live Session Reminder</h1>
  <p>Hi {{student_name}},</p>
  <p>This is a reminder about your upcoming live instruction session:</p>
  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
    <h3>{{session_title}}</h3>
    <p><strong>Date:</strong> {{session_date}}<br>
    <strong>Time:</strong> {{session_time}}<br>
    <strong>Duration:</strong> {{duration}} minutes</p>
    {{#if meeting_url}}
    <p><strong>Join Link:</strong> <a href="{{meeting_url}}">{{meeting_url}}</a></p>
    {{#if meeting_password}}<p><strong>Password:</strong> {{meeting_password}}</p>{{/if}}
    {{/if}}
    {{#if location_address}}
    <p><strong>Location:</strong> {{location_address}}</p>
    {{/if}}
  </div>
  <p>See you there!</p>',
  'Reminder: {{session_title}} on {{session_date}} at {{session_time}}',
  '["student_name", "session_title", "session_date", "session_time", "duration", "meeting_url", "meeting_password", "location_address"]'::jsonb,
  true
) ON CONFLICT (template_name) DO NOTHING;

-- Payment Required
INSERT INTO email_templates (
  template_name,
  template_type,
  subject_template,
  body_html_template,
  body_text_template,
  variables,
  is_active
) VALUES (
  'payment_required',
  'payment_required',
  'Payment Required: {{item_name}}',
  '<h1>Payment Required</h1>
  <p>Hi {{student_name}},</p>
  <p>To continue with <strong>{{item_name}}</strong>, a payment of <strong>${{amount}}</strong> is required.</p>
  <p><a href="{{payment_url}}" style="background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Pay Now</a></p>
  <p>{{payment_description}}</p>',
  'Payment of ${{amount}} required for {{item_name}}. Pay at {{payment_url}}',
  '["student_name", "item_name", "amount", "payment_url", "payment_description"]'::jsonb,
  true
) ON CONFLICT (template_name) DO NOTHING;

-- Certificate Issued
INSERT INTO email_templates (
  template_name,
  template_type,
  subject_template,
  body_html_template,
  body_text_template,
  variables,
  is_active
) VALUES (
  'certificate_issued',
  'certificate_issued',
  '🎉 Your {{program_name}} Certificate is Ready!',
  '<h1>Congratulations {{student_name}}!</h1>
  <p>You''ve successfully completed <strong>{{program_name}}</strong>!</p>
  <p>Your certificate of completion is now available:</p>
  <p><a href="{{certificate_url}}" style="background: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Download Certificate</a></p>
  <p><strong>Certificate Number:</strong> {{certificate_number}}<br>
  <strong>Issued Date:</strong> {{issue_date}}</p>
  <p>Share your achievement on LinkedIn and with potential employers!</p>
  <p>We''re proud of you!</p>',
  'Congratulations! Your {{program_name}} certificate is ready. Download at {{certificate_url}}',
  '["student_name", "program_name", "certificate_url", "certificate_number", "issue_date"]'::jsonb,
  true
) ON CONFLICT (template_name) DO NOTHING;

-- Certiport Pre-Test Promotion
INSERT INTO email_templates (
  template_name,
  template_type,
  subject_template,
  body_html_template,
  body_text_template,
  variables,
  is_active
) VALUES (
  'certiport_pretest_promotion',
  'pre_test_promotion',
  'Ready for Your {{test_name}} Certification?',
  '<h1>Get Certified!</h1>
  <p>Hi {{student_name}},</p>
  <p>You''re making great progress in {{program_name}}! It''s time to earn your industry-recognized certification.</p>
  <h3>{{test_name}}</h3>
  <p>Before scheduling your official test, take our free pre-test to ensure you''re ready:</p>
  <p><a href="{{pretest_url}}" style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Take Pre-Test</a></p>
  <p><strong>Passing Score:</strong> {{passing_score}}%<br>
  <strong>Official Test Cost:</strong> ${{test_cost}}</p>
  <p>Once you pass the pre-test, we''ll help you schedule your official certification exam!</p>',
  'Ready for {{test_name}}? Take the free pre-test at {{pretest_url}}',
  '["student_name", "program_name", "test_name", "pretest_url", "passing_score", "test_cost"]'::jsonb,
  true
) ON CONFLICT (template_name) DO NOTHING;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Partner Credentials Seeded!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Partners Added:';
  RAISE NOTICE '  - Milady RISE (promo: efhcti-rise295)';
  RAISE NOTICE '  - Job Readiness Initiative (JRI)';
  RAISE NOTICE '  - Certiport Testing ($150)';
  RAISE NOTICE '  - NRF RISE Up';
  RAISE NOTICE '  - HSI Safety Training';
  RAISE NOTICE '  - CareerSafe OSHA';
  RAISE NOTICE '';
  RAISE NOTICE '📧 Email Templates Created:';
  RAISE NOTICE '  - Welcome emails';
  RAISE NOTICE '  - Credentials ready';
  RAISE NOTICE '  - Live session reminders';
  RAISE NOTICE '  - Payment required';
  RAISE NOTICE '  - Certificate issued';
  RAISE NOTICE '  - Certiport pre-test promotion';
END $$;
