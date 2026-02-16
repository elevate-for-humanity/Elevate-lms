-- ============================================================================
-- PARTNER LMS INTEGRATION SYSTEM
-- External LMS connections, payments, emails, certificates, live instruction
-- ============================================================================

-- ============================================================================
-- PARTNER LMS CREDENTIALS & CONFIGURATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS partner_lms_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL,
  provider_type TEXT CHECK (provider_type IN ('milady', 'jri', 'certiport', 'nrf_rise', 'hsi', 'careersafe', 'other')),
  api_endpoint TEXT,
  api_key_placeholder TEXT DEFAULT 'PARTNER_WILL_PROVIDE',
  api_secret_placeholder TEXT DEFAULT 'PARTNER_WILL_PROVIDE',
  sso_enabled BOOLEAN DEFAULT false,
  sso_url TEXT,
  enrollment_url TEXT,
  promo_code TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  requires_payment BOOLEAN DEFAULT false,
  payment_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_lms_providers_type ON partner_lms_providers(provider_type);
CREATE INDEX IF NOT EXISTS idx_partner_lms_providers_active ON partner_lms_providers(is_active);

-- ============================================================================
-- PROGRAM TO PARTNER LMS MAPPING
-- ============================================================================

CREATE TABLE IF NOT EXISTS program_partner_lms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES partner_lms_providers(id) ON DELETE CASCADE,
  is_required BOOLEAN DEFAULT true,
  sequence_order INTEGER DEFAULT 1,
  requires_payment BOOLEAN DEFAULT false,
  payment_amount DECIMAL(10,2),
  auto_enroll_on_program_start BOOLEAN DEFAULT false,
  send_welcome_email BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_id, provider_id)
);

CREATE INDEX IF NOT EXISTS idx_program_partner_lms_program ON program_partner_lms(program_id);
CREATE INDEX IF NOT EXISTS idx_program_partner_lms_provider ON program_partner_lms(provider_id);

-- ============================================================================
-- EXTERNAL LMS ENROLLMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS external_lms_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES partner_lms_providers(id) ON DELETE CASCADE,
  external_user_id TEXT,
  external_course_id TEXT,
  access_url TEXT,
  credentials_sent BOOLEAN DEFAULT false,
  credentials_sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'credentials_sent', 'enrolled', 'in_progress', 'completed', 'failed')),
  enrolled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  certificate_url TEXT,
  certificate_issued_at TIMESTAMPTZ,
  payment_required BOOLEAN DEFAULT false,
  payment_status TEXT CHECK (payment_status IN ('not_required', 'pending', 'paid', 'failed', 'refunded')),
  payment_amount DECIMAL(10,2),
  stripe_payment_intent_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_external_lms_enrollments_user ON external_lms_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_external_lms_enrollments_enrollment ON external_lms_enrollments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_external_lms_enrollments_provider ON external_lms_enrollments(provider_id);
CREATE INDEX IF NOT EXISTS idx_external_lms_enrollments_status ON external_lms_enrollments(status);

-- ============================================================================
-- LIVE INSTRUCTION SESSIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS live_instruction_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES lessons(id) ON DELETE SET NULL,
  instructor_id UUID,
  session_title TEXT NOT NULL,
  session_description TEXT,
  session_type TEXT CHECK (session_type IN ('zoom', 'in_person', 'hybrid', 'other')),
  meeting_url TEXT,
  meeting_password TEXT,
  location_address TEXT,
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER,
  max_participants INTEGER,
  current_participants INTEGER DEFAULT 0,
  is_required BOOLEAN DEFAULT false,
  reminder_sent BOOLEAN DEFAULT false,
  reminder_sent_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  recording_url TEXT,
  attendance_tracked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_live_instruction_program ON live_instruction_sessions(program_id);
CREATE INDEX IF NOT EXISTS idx_live_instruction_date ON live_instruction_sessions(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_live_instruction_status ON live_instruction_sessions(status);

-- ============================================================================
-- LIVE INSTRUCTION ATTENDANCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS live_instruction_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES live_instruction_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  attended BOOLEAN DEFAULT false,
  attended_at TIMESTAMPTZ,
  attendance_duration_minutes INTEGER,
  notes TEXT,
  UNIQUE(session_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_live_attendance_session ON live_instruction_attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_live_attendance_user ON live_instruction_attendance(user_id);

-- ============================================================================
-- SYLLABUS UPLOADS & AUTO-COURSE CREATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS syllabus_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  instructor_id UUID NOT NULL,
  syllabus_title TEXT NOT NULL,
  syllabus_file_url TEXT NOT NULL,
  file_type TEXT,
  file_size_kb INTEGER,
  auto_create_modules BOOLEAN DEFAULT true,
  modules_created BOOLEAN DEFAULT false,
  modules_created_at TIMESTAMPTZ,
  parsing_status TEXT DEFAULT 'pending' CHECK (parsing_status IN ('pending', 'processing', 'completed', 'failed')),
  parsing_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_syllabus_uploads_program ON syllabus_uploads(program_id);
CREATE INDEX IF NOT EXISTS idx_syllabus_uploads_instructor ON syllabus_uploads(instructor_id);

-- ============================================================================
-- AUTOMATIC CERTIFICATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS auto_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  certificate_type TEXT CHECK (certificate_type IN ('completion', 'achievement', 'participation', 'credential')),
  certificate_number TEXT UNIQUE,
  issued_by TEXT DEFAULT 'Elevate For Humanity',
  issued_date DATE DEFAULT CURRENT_DATE,
  completion_date DATE,
  certificate_template TEXT DEFAULT 'default',
  certificate_pdf_url TEXT,
  certificate_image_url TEXT,
  verification_url TEXT,
  is_verified BOOLEAN DEFAULT true,
  auto_generated BOOLEAN DEFAULT true,
  sent_to_student BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auto_certificates_user ON auto_certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_auto_certificates_enrollment ON auto_certificates(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_auto_certificates_number ON auto_certificates(certificate_number);

-- ============================================================================
-- CERTIPORT PRE-TEST PROMOTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS certiport_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  test_name TEXT NOT NULL,
  test_code TEXT,
  test_description TEXT,
  requires_pre_test BOOLEAN DEFAULT true,
  pre_test_passing_score INTEGER DEFAULT 70,
  test_cost DECIMAL(10,2),
  voucher_required BOOLEAN DEFAULT true,
  promotion_message TEXT,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certiport_tests_program ON certiport_tests(program_id);

CREATE TABLE IF NOT EXISTS certiport_test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES certiport_tests(id) ON DELETE CASCADE,
  attempt_type TEXT CHECK (attempt_type IN ('pre_test', 'official_test')),
  score INTEGER,
  passed BOOLEAN,
  payment_required BOOLEAN DEFAULT false,
  payment_status TEXT CHECK (payment_status IN ('not_required', 'pending', 'paid', 'failed')),
  stripe_payment_intent_id TEXT,
  voucher_code TEXT,
  voucher_issued_at TIMESTAMPTZ,
  test_scheduled_date DATE,
  test_completed_date DATE,
  certificate_earned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_certiport_attempts_user ON certiport_test_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_certiport_attempts_test ON certiport_test_attempts(test_id);

-- ============================================================================
-- STRIPE PAYMENT TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS stripe_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  enrollment_id UUID REFERENCES enrollments(id) ON DELETE SET NULL,
  payment_type TEXT CHECK (payment_type IN ('external_lms', 'certiport_test', 'credential_course', 'other')),
  reference_id UUID,
  reference_type TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded')),
  payment_method TEXT,
  paid_at TIMESTAMPTZ,
  refunded_at TIMESTAMPTZ,
  refund_amount DECIMAL(10,2),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_payments_user ON stripe_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_intent ON stripe_payments(stripe_payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_stripe_payments_status ON stripe_payments(payment_status);

-- ============================================================================
-- EMAIL NOTIFICATION QUEUE
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email_type TEXT NOT NULL CHECK (email_type IN (
    'welcome', 'credentials_ready', 'course_reminder', 'live_session_reminder',
    'payment_required', 'payment_confirmed', 'certificate_issued', 'completion_congratulations',
    'pre_test_promotion', 'milestone_achieved', 'custom'
  )),
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT NOT NULL,
  body_text TEXT,
  template_name TEXT,
  template_data JSONB DEFAULT '{}'::jsonb,
  scheduled_send_at TIMESTAMPTZ DEFAULT NOW(),
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  failed BOOLEAN DEFAULT false,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_notifications_user ON email_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_sent ON email_notifications(sent);
CREATE INDEX IF NOT EXISTS idx_email_notifications_scheduled ON email_notifications(scheduled_send_at);
CREATE INDEX IF NOT EXISTS idx_email_notifications_type ON email_notifications(email_type);

-- ============================================================================
-- EMAIL TEMPLATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT UNIQUE NOT NULL,
  template_type TEXT NOT NULL,
  subject_template TEXT NOT NULL,
  body_html_template TEXT NOT NULL,
  body_text_template TEXT,
  variables JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Partner LMS Integration System Created!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tables Created:';
  RAISE NOTICE '  - partner_lms_providers (Milady, JRI, Certiport credentials)';
  RAISE NOTICE '  - program_partner_lms (Program to partner mapping)';
  RAISE NOTICE '  - external_lms_enrollments (Track external enrollments)';
  RAISE NOTICE '  - live_instruction_sessions (Schedule live classes)';
  RAISE NOTICE '  - live_instruction_attendance (Track attendance)';
  RAISE NOTICE '  - syllabus_uploads (Auto-create courses from syllabus)';
  RAISE NOTICE '  - auto_certificates (Generate certificates on completion)';
  RAISE NOTICE '  - certiport_tests (Pre-test promotions)';
  RAISE NOTICE '  - stripe_payments (Payment tracking)';
  RAISE NOTICE '  - email_notifications (Automatic emails)';
  RAISE NOTICE '  - email_templates (Email templates)';
END $$;
