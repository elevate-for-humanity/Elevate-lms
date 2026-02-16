-- Volunteer Applications System
-- VITA volunteer application and background check management

-- Volunteer Applications Table
CREATE TABLE IF NOT EXISTS volunteer_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  availability JSONB DEFAULT '[]'::jsonb,
  experience TEXT,
  certifications TEXT[],
  background_check_status TEXT CHECK (background_check_status IN (
    'not_started',
    'pending',
    'in_progress',
    'approved',
    'rejected',
    'expired'
  )) DEFAULT 'not_started',
  background_check_date TIMESTAMPTZ,
  background_check_expiry TIMESTAMPTZ,
  approval_status TEXT CHECK (approval_status IN (
    'pending',
    'approved',
    'rejected',
    'waitlisted'
  )) DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  irs_certification_number TEXT,
  irs_certification_expiry TIMESTAMPTZ,
  training_completed BOOLEAN DEFAULT false,
  training_completed_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_email ON volunteer_applications(email);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_status ON volunteer_applications(approval_status);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_background ON volunteer_applications(background_check_status);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_user ON volunteer_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_volunteer_applications_created ON volunteer_applications(created_at);

-- RLS
ALTER TABLE volunteer_applications ENABLE ROW LEVEL SECURITY;

-- Users can view their own applications
CREATE POLICY "Users can view own volunteer applications"
  ON volunteer_applications FOR SELECT
  USING (
    user_id = auth.uid()
    OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Anyone can submit applications
CREATE POLICY "Anyone can submit volunteer applications"
  ON volunteer_applications FOR INSERT
  WITH CHECK (true);

-- Users can update their own pending applications
CREATE POLICY "Users can update own pending applications"
  ON volunteer_applications FOR UPDATE
  USING (
    user_id = auth.uid()
    AND approval_status = 'pending'
  );

-- Admin can view all applications
CREATE POLICY "Admin can view all volunteer applications"
  ON volunteer_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'tax_coordinator')
    )
  );

-- Admin can manage all applications
CREATE POLICY "Admin can manage volunteer applications"
  ON volunteer_applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'tax_coordinator')
    )
  );

COMMENT ON TABLE volunteer_applications IS 'VITA volunteer applications with background checks';
