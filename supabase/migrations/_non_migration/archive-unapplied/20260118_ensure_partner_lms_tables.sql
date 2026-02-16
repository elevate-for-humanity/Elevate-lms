-- Ensure partner LMS tables exist
-- These tables support external LMS integrations (Milady, etc.)

-- Partner LMS Providers
CREATE TABLE IF NOT EXISTS partner_lms_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  api_base_url TEXT,
  api_key_encrypted TEXT,
  website_url TEXT,
  logo_url TEXT,
  active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_lms_providers_active ON partner_lms_providers(active);
CREATE INDEX IF NOT EXISTS idx_partner_lms_providers_type ON partner_lms_providers(provider_type);

-- Partner LMS Courses
CREATE TABLE IF NOT EXISTS partner_lms_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES partner_lms_providers(id) ON DELETE CASCADE,
  course_name TEXT NOT NULL,
  course_code TEXT,
  description TEXT,
  duration_hours INTEGER,
  price DECIMAL(10,2),
  external_course_id TEXT,
  active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_lms_courses_provider ON partner_lms_courses(provider_id);
CREATE INDEX IF NOT EXISTS idx_partner_lms_courses_active ON partner_lms_courses(active);

-- Partner LMS Enrollments
CREATE TABLE IF NOT EXISTS partner_lms_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  course_id UUID REFERENCES partner_lms_courses(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES partner_lms_providers(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending',
  progress_percentage INTEGER DEFAULT 0,
  external_enrollment_id TEXT,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  funding_source TEXT DEFAULT 'self_pay',
  certificate_issued_at TIMESTAMPTZ,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_lms_enrollments_student ON partner_lms_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_partner_lms_enrollments_course ON partner_lms_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_partner_lms_enrollments_status ON partner_lms_enrollments(status);

-- Program Holders table
CREATE TABLE IF NOT EXISTS program_holders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_name TEXT NOT NULL,
  organization_type TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMPTZ,
  compliance_score INTEGER DEFAULT 100,
  active BOOLEAN DEFAULT true,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_holders_user ON program_holders(user_id);
CREATE INDEX IF NOT EXISTS idx_program_holders_verified ON program_holders(verified);
CREATE INDEX IF NOT EXISTS idx_program_holders_active ON program_holders(active);

-- Student Progress table
CREATE TABLE IF NOT EXISTS student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  course_id UUID,
  lesson_id UUID,
  enrollment_id UUID,
  progress_percentage INTEGER DEFAULT 0,
  time_spent_minutes INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  score DECIMAL(5,2),
  attempts INTEGER DEFAULT 0,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_student_progress_student ON student_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_course ON student_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_enrollment ON student_progress(enrollment_id);

-- Donations table
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID,
  donor_name TEXT,
  donor_email TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_method TEXT,
  stripe_payment_id TEXT,
  stripe_customer_id TEXT,
  status TEXT DEFAULT 'pending',
  recurring BOOLEAN DEFAULT false,
  recurring_interval TEXT,
  campaign TEXT,
  message TEXT,
  anonymous BOOLEAN DEFAULT false,
  receipt_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donations_donor ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_created ON donations(created_at DESC);

-- Enable RLS on all tables
ALTER TABLE partner_lms_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_lms_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_lms_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_holders ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Partner LMS Providers: Public read for active, admin write
DROP POLICY IF EXISTS "partner_lms_providers_public_read" ON partner_lms_providers;
CREATE POLICY "partner_lms_providers_public_read" ON partner_lms_providers
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "partner_lms_providers_admin_all" ON partner_lms_providers;
CREATE POLICY "partner_lms_providers_admin_all" ON partner_lms_providers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Partner LMS Courses: Public read for active, admin write
DROP POLICY IF EXISTS "partner_lms_courses_public_read" ON partner_lms_courses;
CREATE POLICY "partner_lms_courses_public_read" ON partner_lms_courses
  FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "partner_lms_courses_admin_all" ON partner_lms_courses;
CREATE POLICY "partner_lms_courses_admin_all" ON partner_lms_courses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Partner LMS Enrollments: Users see own, admin sees all
DROP POLICY IF EXISTS "partner_lms_enrollments_own" ON partner_lms_enrollments;
CREATE POLICY "partner_lms_enrollments_own" ON partner_lms_enrollments
  FOR ALL USING (student_id = auth.uid());

DROP POLICY IF EXISTS "partner_lms_enrollments_admin" ON partner_lms_enrollments;
CREATE POLICY "partner_lms_enrollments_admin" ON partner_lms_enrollments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Program Holders: Users see own, admin sees all
DROP POLICY IF EXISTS "program_holders_own" ON program_holders;
CREATE POLICY "program_holders_own" ON program_holders
  FOR ALL USING (user_id = auth.uid());

DROP POLICY IF EXISTS "program_holders_admin" ON program_holders;
CREATE POLICY "program_holders_admin" ON program_holders
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Student Progress: Users see own, admin sees all
DROP POLICY IF EXISTS "student_progress_own" ON student_progress;
CREATE POLICY "student_progress_own" ON student_progress
  FOR ALL USING (student_id = auth.uid());

DROP POLICY IF EXISTS "student_progress_admin" ON student_progress;
CREATE POLICY "student_progress_admin" ON student_progress
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Donations: Donors see own, admin sees all, anyone can insert
DROP POLICY IF EXISTS "donations_own" ON donations;
CREATE POLICY "donations_own" ON donations
  FOR SELECT USING (donor_id = auth.uid());

DROP POLICY IF EXISTS "donations_admin" ON donations;
CREATE POLICY "donations_admin" ON donations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

DROP POLICY IF EXISTS "donations_insert" ON donations;
CREATE POLICY "donations_insert" ON donations
  FOR INSERT WITH CHECK (true);
