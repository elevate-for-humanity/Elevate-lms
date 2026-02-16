-- Milady Access Provisioning Tables
-- Tracks how students get access to Milady RISE courses

-- Student Milady access records
CREATE TABLE IF NOT EXISTS milady_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_slug TEXT NOT NULL,
  provisioning_method TEXT NOT NULL CHECK (provisioning_method IN ('api', 'license_code', 'manual', 'link')),
  access_url TEXT,
  license_code TEXT,
  username TEXT,
  status TEXT NOT NULL DEFAULT 'pending_setup' CHECK (status IN ('pending_setup', 'active', 'expired', 'revoked')),
  provisioned_at TIMESTAMPTZ DEFAULT NOW(),
  manually_provisioned_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, program_slug)
);

-- Pre-purchased license codes from Milady
CREATE TABLE IF NOT EXISTS milady_license_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  program_slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'used', 'expired')),
  purchased_at TIMESTAMPTZ,
  purchase_batch TEXT, -- e.g., "2024-Q1-BATCH-001"
  cost_per_code DECIMAL(10,2),
  assigned_to UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Queue for manual provisioning (admin processes these)
CREATE TABLE IF NOT EXISTS milady_provisioning_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_email TEXT NOT NULL,
  student_name TEXT NOT NULL,
  program_slug TEXT NOT NULL,
  course_code TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  notes TEXT,
  processed_by UUID REFERENCES auth.users(id),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, program_slug)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_milady_access_student ON milady_access(student_id);
CREATE INDEX IF NOT EXISTS idx_milady_access_program ON milady_access(program_slug);
CREATE INDEX IF NOT EXISTS idx_milady_license_codes_status ON milady_license_codes(status, program_slug);
CREATE INDEX IF NOT EXISTS idx_milady_queue_status ON milady_provisioning_queue(status);

-- RLS Policies
ALTER TABLE milady_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE milady_license_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE milady_provisioning_queue ENABLE ROW LEVEL SECURITY;

-- Students can view their own access
CREATE POLICY "Students can view own milady access"
  ON milady_access FOR SELECT
  USING (auth.uid() = student_id);

-- Admins can manage all
CREATE POLICY "Admins can manage milady access"
  ON milady_access FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage license codes"
  ON milady_license_codes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can manage provisioning queue"
  ON milady_provisioning_queue FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_milady_access_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER milady_access_updated_at
  BEFORE UPDATE ON milady_access
  FOR EACH ROW
  EXECUTE FUNCTION update_milady_access_updated_at();
