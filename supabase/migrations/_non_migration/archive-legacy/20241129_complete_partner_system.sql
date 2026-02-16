-- ============================================================================
-- COMPLETE PARTNER INTEGRATION SYSTEM - ALL TABLES
-- Run this to set up everything for 1200+ partner courses
-- ============================================================================

-- ============================================================================
-- 1. PARTNER LMS PROVIDERS (Already exists, but ensure it's there)
-- ============================================================================

CREATE TABLE IF NOT EXISTS partner_lms_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL,
  provider_type TEXT UNIQUE NOT NULL,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  api_endpoint TEXT,
  api_key TEXT,
  enrollment_url TEXT,
  sso_url TEXT,
  sso_enabled BOOLEAN DEFAULT false,
  promo_code TEXT,
  requires_payment BOOLEAN DEFAULT false,
  payment_amount DECIMAL(10,2),
  login_instructions TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. PARTNER COURSES (All 1200+ courses)
-- ============================================================================

CREATE TABLE IF NOT EXISTS partner_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partner_lms_providers(id) ON DELETE CASCADE,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration_hours DECIMAL(5,2),
  wholesale_cost DECIMAL(10,2),
  retail_price DECIMAL(10,2),
  markup_percentage DECIMAL(5,2),
  profit_margin DECIMAL(10,2),
  course_url TEXT,
  enrollment_type TEXT DEFAULT 'paid' CHECK (enrollment_type IN ('paid', 'direct', 'wioa', 'apprenticeship')),
  requires_payment BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_id, course_code)
);

CREATE INDEX IF NOT EXISTS idx_partner_courses_partner ON partner_courses(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_courses_category ON partner_courses(category);
CREATE INDEX IF NOT EXISTS idx_partner_courses_active ON partner_courses(is_active);

-- ============================================================================
-- 3. PARTNER ENROLLMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS partner_lms_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES partner_lms_providers(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES partner_courses(id) ON DELETE SET NULL,
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',
    'payment_pending',
    'active',
    'completed',
    'failed',
    'cancelled'
  )),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  progress_percentage INTEGER DEFAULT 0,
  external_enrollment_id TEXT,
  external_certificate_id TEXT,
  certificate_id UUID,
  payment_status TEXT CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_amount DECIMAL(10,2),
  payment_session_id TEXT,
  payment_completed_at TIMESTAMPTZ,
  welcome_email_sent BOOLEAN DEFAULT false,
  course_name TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_enrollments_provider ON partner_lms_enrollments(provider_id);
CREATE INDEX IF NOT EXISTS idx_partner_enrollments_student ON partner_lms_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_partner_enrollments_status ON partner_lms_enrollments(status);

-- ============================================================================
-- 4. HSI SPECIFIC TABLES
-- ============================================================================

-- HSI Course Products (Stripe integration)
CREATE TABLE IF NOT EXISTS hsi_course_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_type TEXT UNIQUE NOT NULL,
  course_name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  wholesale_cost DECIMAL(10,2) NOT NULL,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  hsi_enrollment_link TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- HSI Enrollment Queue (Stripe payment → HSI enrollment)
CREATE TABLE IF NOT EXISTS hsi_enrollment_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_type TEXT NOT NULL,
  stripe_payment_id TEXT NOT NULL,
  stripe_session_id TEXT,
  amount_paid DECIMAL(10,2) NOT NULL,
  student_email TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_phone TEXT,
  student_address TEXT,
  enrollment_status TEXT DEFAULT 'pending' CHECK (enrollment_status IN (
    'pending',
    'enrolled',
    'completed',
    'failed'
  )),
  hsi_enrollment_link TEXT NOT NULL,
  enrolled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  certificate_url TEXT,
  certificate_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hsi_queue_student ON hsi_enrollment_queue(student_id);
CREATE INDEX IF NOT EXISTS idx_hsi_queue_status ON hsi_enrollment_queue(enrollment_status);
CREATE INDEX IF NOT EXISTS idx_hsi_queue_stripe ON hsi_enrollment_queue(stripe_payment_id);

-- HSI Credit Balance Tracking
CREATE TABLE IF NOT EXISTS hsi_credit_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credits_purchased INTEGER NOT NULL,
  credits_used INTEGER DEFAULT 0,
  credits_remaining INTEGER GENERATED ALWAYS AS (credits_purchased - credits_used) STORED,
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  purchase_amount DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. PARTNER CERTIFICATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS partner_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES partner_lms_enrollments(id) ON DELETE CASCADE,
  student_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES partner_lms_providers(id) ON DELETE CASCADE,
  program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
  certificate_number TEXT UNIQUE NOT NULL,
  student_name TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  course_name TEXT,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  certificate_url TEXT,
  revoked BOOLEAN DEFAULT false,
  revoked_at TIMESTAMPTZ,
  revocation_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_certs_student ON partner_certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_partner_certs_provider ON partner_certificates(provider_id);
CREATE INDEX IF NOT EXISTS idx_partner_certs_number ON partner_certificates(certificate_number);

-- ============================================================================
-- 6. EMAIL QUEUE (if not exists)
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient TEXT NOT NULL,
  subject TEXT NOT NULL,
  html TEXT NOT NULL,
  text TEXT,
  from_email TEXT DEFAULT 'noreply@elevateforhumanity.org',
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_user ON email_queue(user_id);

-- ============================================================================
-- 7. PAYMENT LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES partner_lms_enrollments(id) ON DELETE SET NULL,
  stripe_session_id TEXT,
  stripe_payment_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_logs_enrollment ON payment_logs(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_stripe ON payment_logs(stripe_session_id);

-- ============================================================================
-- 8. VIEWS FOR EASY QUERYING
-- ============================================================================

-- Partner courses catalog view
CREATE OR REPLACE VIEW partner_courses_catalog AS
SELECT 
  pc.id,
  pc.course_code,
  pc.course_name,
  pc.description,
  pc.category,
  pc.duration_hours,
  pc.wholesale_cost,
  pc.retail_price,
  pc.markup_percentage,
  pc.profit_margin,
  pc.is_active,
  p.provider_name,
  p.provider_type,
  p.enrollment_url
FROM partner_courses pc
JOIN partner_lms_providers p ON pc.partner_id = p.id
WHERE pc.is_active = true
ORDER BY p.provider_name, pc.category, pc.course_name;

-- Student enrollments view
CREATE OR REPLACE VIEW student_partner_enrollments AS
SELECT 
  e.id,
  e.status,
  e.enrolled_at,
  e.completed_at,
  e.progress_percentage,
  p.full_name as student_name,
  p.email as student_email,
  pr.provider_name,
  pr.provider_type,
  c.course_name,
  c.retail_price,
  e.payment_status,
  e.payment_amount
FROM partner_lms_enrollments e
JOIN profiles p ON e.student_id = p.id
JOIN partner_lms_providers pr ON e.provider_id = pr.id
LEFT JOIN partner_courses c ON e.course_id = c.id
ORDER BY e.enrolled_at DESC;

-- ============================================================================
-- 9. FUNCTIONS
-- ============================================================================

-- Function to auto-deduct HSI credit
CREATE OR REPLACE FUNCTION use_hsi_credit()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment credits_used in most recent purchase
  UPDATE hsi_credit_balance
  SET credits_used = credits_used + 1
  WHERE id = (
    SELECT id FROM hsi_credit_balance
    WHERE credits_remaining > 0
    ORDER BY purchase_date DESC
    LIMIT 1
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-deduct credit on HSI enrollment
DROP TRIGGER IF EXISTS trigger_use_hsi_credit ON hsi_enrollment_queue;
CREATE TRIGGER trigger_use_hsi_credit
AFTER INSERT ON hsi_enrollment_queue
FOR EACH ROW
WHEN (NEW.enrollment_status = 'enrolled')
EXECUTE FUNCTION use_hsi_credit();

-- ============================================================================
-- 10. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT ON partner_lms_providers TO authenticated;
GRANT SELECT ON partner_courses TO authenticated;
GRANT SELECT ON partner_courses_catalog TO authenticated;
GRANT SELECT, INSERT, UPDATE ON partner_lms_enrollments TO authenticated;
GRANT SELECT ON student_partner_enrollments TO authenticated;
GRANT SELECT, INSERT ON hsi_enrollment_queue TO authenticated;
GRANT SELECT ON hsi_course_products TO authenticated;
GRANT SELECT ON hsi_credit_balance TO authenticated;
GRANT SELECT ON partner_certificates TO authenticated;

-- ============================================================================
-- 11. INSERT PARTNER PROVIDERS
-- ============================================================================

INSERT INTO partner_lms_providers (provider_name, provider_type, contact_email, contact_phone, enrollment_url, promo_code, is_active) VALUES
('Milady', 'milady', 'jessica.boyd@milady.com', '866-848-5143', 'https://www.miladytraining.com', 'efhcti-rise295', true),
('Certiport', 'certiport', NULL, NULL, 'https://certiport.pearsonvue.com', NULL, true),
('Health & Safety Institute', 'hsi', 'galbrecht@hsi.com', '949-456-8366', 'https://hsi.com', NULL, true),
('Janitorial Resource Institute', 'jri', NULL, NULL, 'https://jri.org', NULL, true),
('NRF RISE Up', 'nrf_rise', NULL, NULL, 'https://nrf.com/riseup', NULL, true),
('CareerSafe', 'careersafe', NULL, NULL, 'https://careersafeonline.com', NULL, true),
('National Drug Screening', 'nds', 'sales@nationaldrugscreening.com', '866-843-4545', 'https://nationaldrugscreening.com', NULL, true)
ON CONFLICT (provider_type) DO UPDATE SET
  provider_name = EXCLUDED.provider_name,
  contact_email = EXCLUDED.contact_email,
  contact_phone = EXCLUDED.contact_phone,
  enrollment_url = EXCLUDED.enrollment_url,
  updated_at = NOW();

-- ============================================================================
-- 12. INSERT HSI COURSE PRODUCTS
-- ============================================================================

INSERT INTO hsi_course_products (course_type, course_name, description, price, wholesale_cost, hsi_enrollment_link) VALUES
('cpr_aed_all_ages', 'CPR/AED Certification (All Ages)', 'CPR and AED training for adults, children, and infants. Includes remote skills verification.', 135.00, 85.00, 'https://otis.osmanager4.com/#/nts/openenrollment/906B45CC-211D-48B3-A2FE-71D2C6D464F3'),
('cpr_aed_adult', 'CPR/AED Certification (Adult Only)', 'CPR and AED training for adults only. Includes remote skills verification.', 119.00, 75.00, 'https://otis.osmanager4.com/#/nts/openenrollment/8B978D3E-85A4-48E7-AFF2-5F01FFF12F35'),
('first_aid_cpr_all_ages', 'First Aid + CPR/AED (All Ages)', 'Complete first aid and CPR training for all ages. Most comprehensive option.', 189.00, 125.00, 'https://otis.osmanager4.com/#/nts/openenrollment/D84A8E63-967E-4A63-944A-AA3E33D777A8'),
('first_aid_cpr_adult', 'First Aid + CPR/AED (Adult Only)', 'Complete first aid and CPR training for adults. Workplace safety focused.', 189.00, 125.00, 'https://otis.osmanager4.com/#/nts/openenrollment/A373CD50-3045-49B1-B119-62A1DC5EFF47')
ON CONFLICT (course_type) DO UPDATE SET
  course_name = EXCLUDED.course_name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  wholesale_cost = EXCLUDED.wholesale_cost,
  hsi_enrollment_link = EXCLUDED.hsi_enrollment_link,
  updated_at = NOW();

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ COMPLETE PARTNER SYSTEM SETUP SUCCESSFUL!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Tables Created:';
  RAISE NOTICE '   - partner_lms_providers (7 partners)';
  RAISE NOTICE '   - partner_courses (ready for 1200+ courses)';
  RAISE NOTICE '   - partner_lms_enrollments';
  RAISE NOTICE '   - hsi_course_products (4 courses)';
  RAISE NOTICE '   - hsi_enrollment_queue';
  RAISE NOTICE '   - hsi_credit_balance';
  RAISE NOTICE '   - partner_certificates';
  RAISE NOTICE '   - email_queue';
  RAISE NOTICE '   - payment_logs';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Ready For:';
  RAISE NOTICE '   - Stripe payment integration';
  RAISE NOTICE '   - Student enrollments';
  RAISE NOTICE '   - Certificate generation';
  RAISE NOTICE '   - Credit tracking';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Next Steps:';
  RAISE NOTICE '   1. Run: 20241129_add_all_partner_courses.sql (adds 67 sample courses)';
  RAISE NOTICE '   2. Build enrollment pages';
  RAISE NOTICE '   3. Set up Stripe products';
  RAISE NOTICE '   4. Start enrolling students!';
END $$;
