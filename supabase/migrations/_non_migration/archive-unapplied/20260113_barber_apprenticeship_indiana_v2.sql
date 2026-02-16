-- =====================================================
-- INDIANA BARBER APPRENTICESHIP SCHEMA
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Create student_enrollments if not exists
CREATE TABLE IF NOT EXISTS student_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  program_id uuid,
  stripe_checkout_session_id text,
  status text NOT NULL DEFAULT 'active',
  transfer_hours numeric DEFAULT 0,
  required_hours numeric DEFAULT 1500,
  rapids_status text DEFAULT 'pending',
  rapids_id text,
  milady_enrolled boolean DEFAULT false,
  milady_enrolled_at timestamptz,
  shop_id uuid,
  supervisor_id uuid,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Add columns if table already exists (safe to run multiple times)
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS transfer_hours numeric DEFAULT 0;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS required_hours numeric DEFAULT 1500;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS rapids_status text DEFAULT 'pending';
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS rapids_id text;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS milady_enrolled boolean DEFAULT false;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS milady_enrolled_at timestamptz;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS shop_id uuid;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS supervisor_id uuid;

-- 3. Transfer Hour Requests
CREATE TABLE IF NOT EXISTS transfer_hour_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  enrollment_id uuid,
  hours_requested numeric NOT NULL,
  hours_approved numeric,
  previous_school_name text NOT NULL,
  previous_school_address text,
  previous_school_phone text,
  previous_school_license text,
  completion_date date,
  documentation_url text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  reviewer_id uuid,
  reviewer_notes text,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. Barber Shops
CREATE TABLE IF NOT EXISTS barber_shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  license_number text,
  address text,
  city text,
  state text DEFAULT 'IN',
  zip text,
  phone text,
  email text,
  owner_name text,
  owner_license text,
  is_approved boolean DEFAULT false,
  approved_at timestamptz,
  approved_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 5. Shop Supervisors
CREATE TABLE IF NOT EXISTS shop_supervisors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid,
  user_id uuid,
  name text NOT NULL,
  email text,
  phone text,
  license_number text,
  license_type text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 6. Indiana Hour Categories
CREATE TABLE IF NOT EXISTS indiana_hour_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  hour_type text NOT NULL,
  min_hours numeric,
  max_hours numeric,
  created_at timestamptz DEFAULT now()
);

-- Add unique constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'indiana_hour_categories_code_key') THEN
    ALTER TABLE indiana_hour_categories ADD CONSTRAINT indiana_hour_categories_code_key UNIQUE (code);
  END IF;
END $$;

-- Insert categories
INSERT INTO indiana_hour_categories (code, name, description, hour_type, min_hours) VALUES
  ('SANITATION', 'Sanitation & Sterilization', 'Health and safety procedures', 'RTI', 75),
  ('HAIR_CUTTING', 'Hair Cutting & Styling', 'Clipper cuts, scissor cuts, fades, tapers', 'OJT', 500),
  ('SHAVING', 'Shaving & Facial Hair', 'Straight razor shaving, beard trimming', 'OJT', 200),
  ('CHEMISTRY', 'Hair & Scalp Chemistry', 'Chemical services, treatments', 'RTI', 50),
  ('BUSINESS', 'Business Practices', 'Shop management, client relations', 'RTI', 25),
  ('STATE_LAW', 'Indiana State Law', 'IPLA regulations, licensing requirements', 'RTI', 10),
  ('PRACTICAL', 'General Practical Training', 'Hands-on client services', 'OJT', 640)
ON CONFLICT (code) DO NOTHING;

-- 7. Milady Enrollments
CREATE TABLE IF NOT EXISTS milady_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  enrollment_id uuid,
  milady_student_id text,
  milady_email text,
  enrolled_at timestamptz DEFAULT now(),
  courses_completed jsonb DEFAULT '[]',
  certificate_url text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. RAPIDS Registrations
CREATE TABLE IF NOT EXISTS rapids_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  enrollment_id uuid,
  rapids_id text,
  occupation_code text DEFAULT '39-5011.00',
  sponsor_id text,
  registration_date date,
  expected_completion_date date,
  status text DEFAULT 'pending',
  submitted_at timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 9. State Board Readiness
CREATE TABLE IF NOT EXISTS state_board_readiness (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  enrollment_id uuid,
  total_hours_completed numeric DEFAULT 0,
  rti_hours_completed numeric DEFAULT 0,
  ojt_hours_completed numeric DEFAULT 0,
  milady_completed boolean DEFAULT false,
  practical_skills_verified boolean DEFAULT false,
  ready_for_exam boolean DEFAULT false,
  exam_scheduled_date date,
  exam_location text,
  written_exam_passed boolean,
  written_exam_date date,
  practical_exam_passed boolean,
  practical_exam_date date,
  license_number text,
  license_issued_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 10. Update apprentice_hours_log if exists
ALTER TABLE apprentice_hours_log ADD COLUMN IF NOT EXISTS supervisor_id uuid;
ALTER TABLE apprentice_hours_log ADD COLUMN IF NOT EXISTS supervisor_approved boolean DEFAULT false;
ALTER TABLE apprentice_hours_log ADD COLUMN IF NOT EXISTS supervisor_approved_at timestamptz;
ALTER TABLE apprentice_hours_log ADD COLUMN IF NOT EXISTS shop_id uuid;

-- 11. Create indexes
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student ON student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_enrollments_program ON student_enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_student ON transfer_hour_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_status ON transfer_hour_requests(status);
CREATE INDEX IF NOT EXISTS idx_barber_shops_approved ON barber_shops(is_approved);
CREATE INDEX IF NOT EXISTS idx_supervisors_shop ON shop_supervisors(shop_id);
CREATE INDEX IF NOT EXISTS idx_milady_enrollments_student ON milady_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_rapids_student ON rapids_registrations(student_id);
CREATE INDEX IF NOT EXISTS idx_rapids_status ON rapids_registrations(status);
CREATE INDEX IF NOT EXISTS idx_state_board_student ON state_board_readiness(student_id);

-- 12. Enable RLS on all tables
ALTER TABLE student_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_hour_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE barber_shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE indiana_hour_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE milady_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE rapids_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE state_board_readiness ENABLE ROW LEVEL SECURITY;

-- 13. RLS Policies

-- student_enrollments
DROP POLICY IF EXISTS "Users can view own enrollments" ON student_enrollments;
CREATE POLICY "Users can view own enrollments" ON student_enrollments FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Users can insert own enrollments" ON student_enrollments;
CREATE POLICY "Users can insert own enrollments" ON student_enrollments FOR INSERT WITH CHECK (auth.uid() = student_id);

-- transfer_hour_requests
DROP POLICY IF EXISTS "Users can view own transfer requests" ON transfer_hour_requests;
CREATE POLICY "Users can view own transfer requests" ON transfer_hour_requests FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Users can create transfer requests" ON transfer_hour_requests;
CREATE POLICY "Users can create transfer requests" ON transfer_hour_requests FOR INSERT WITH CHECK (auth.uid() = student_id);

-- barber_shops (public read for approved)
DROP POLICY IF EXISTS "Anyone can view approved shops" ON barber_shops;
CREATE POLICY "Anyone can view approved shops" ON barber_shops FOR SELECT USING (is_approved = true);

-- indiana_hour_categories (public read)
DROP POLICY IF EXISTS "Anyone can view hour categories" ON indiana_hour_categories;
CREATE POLICY "Anyone can view hour categories" ON indiana_hour_categories FOR SELECT USING (true);

-- milady_enrollments
DROP POLICY IF EXISTS "Users can view own milady enrollment" ON milady_enrollments;
CREATE POLICY "Users can view own milady enrollment" ON milady_enrollments FOR SELECT USING (auth.uid() = student_id);

-- rapids_registrations
DROP POLICY IF EXISTS "Users can view own rapids registration" ON rapids_registrations;
CREATE POLICY "Users can view own rapids registration" ON rapids_registrations FOR SELECT USING (auth.uid() = student_id);

-- state_board_readiness
DROP POLICY IF EXISTS "Users can view own state board status" ON state_board_readiness;
CREATE POLICY "Users can view own state board status" ON state_board_readiness FOR SELECT USING (auth.uid() = student_id);

-- shop_supervisors
DROP POLICY IF EXISTS "Supervisors can view own record" ON shop_supervisors;
CREATE POLICY "Supervisors can view own record" ON shop_supervisors FOR SELECT USING (user_id = auth.uid());

-- 14. Grant permissions
GRANT SELECT, INSERT, UPDATE ON student_enrollments TO authenticated;
GRANT SELECT, INSERT ON transfer_hour_requests TO authenticated;
GRANT SELECT ON barber_shops TO authenticated;
GRANT SELECT ON shop_supervisors TO authenticated;
GRANT SELECT ON indiana_hour_categories TO authenticated;
GRANT SELECT ON milady_enrollments TO authenticated;
GRANT SELECT ON rapids_registrations TO authenticated;
GRANT SELECT ON state_board_readiness TO authenticated;

-- Done!
SELECT 'Indiana Barber Apprenticeship schema created successfully!' as result;
