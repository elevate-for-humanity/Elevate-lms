-- Partner Shop System
-- Supports program-scoped access control for employer partners (e.g., Barber shops)

-- Partners (the shop entity)
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  dba VARCHAR(255),
  ein VARCHAR(20),
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  website VARCHAR(255),
  
  -- Capacity and credentials
  apprentice_capacity INTEGER DEFAULT 1,
  schedule_notes TEXT,
  license_number VARCHAR(100),
  license_state VARCHAR(50),
  license_expiry DATE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id)
);

-- Partner Applications (onboarding submissions)
CREATE TABLE IF NOT EXISTS partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Shop info
  shop_name VARCHAR(255) NOT NULL,
  dba VARCHAR(255),
  ein VARCHAR(20),
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip VARCHAR(20) NOT NULL,
  website VARCHAR(255),
  
  -- Programs requested (stored as array)
  programs_requested TEXT[] NOT NULL,
  
  -- Capacity and details
  apprentice_capacity INTEGER DEFAULT 1,
  schedule_notes TEXT,
  license_number VARCHAR(100),
  license_state VARCHAR(50),
  license_expiry DATE,
  additional_notes TEXT,
  
  -- Agreement
  agreed_to_terms BOOLEAN DEFAULT false,
  agreed_at TIMESTAMPTZ,
  
  -- Status workflow
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'withdrawn')),
  status_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  
  -- Link to created partner (after approval)
  partner_id UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Partner Users (link auth user to partner + role)
CREATE TABLE IF NOT EXISTS partner_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('partner_admin', 'partner_staff')),
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  
  -- Invitation tracking
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  activated_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, partner_id)
);

-- Partner Program Access (entitlements)
CREATE TABLE IF NOT EXISTS partner_program_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL,
  program_id VARCHAR(100) NOT NULL, -- e.g., 'barber', 'cna', 'hvac'
  
  -- Permissions
  can_view_apprentices BOOLEAN DEFAULT true,
  can_enter_progress BOOLEAN DEFAULT true,
  can_view_reports BOOLEAN DEFAULT true,
  
  -- Timestamps
  granted_at TIMESTAMPTZ DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id),
  revoked_at TIMESTAMPTZ,
  
  UNIQUE(partner_id, program_id)
);

-- Progress Entries (hours/attendance tracking)
CREATE TABLE IF NOT EXISTS progress_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Links
  apprentice_id UUID NOT NULL REFERENCES auth.users(id),
  partner_id UUID NOT NULL,
  program_id VARCHAR(100) NOT NULL,
  
  -- Progress data
  week_ending DATE NOT NULL, -- Always a Friday
  hours_worked DECIMAL(5,2) NOT NULL CHECK (hours_worked >= 0 AND hours_worked <= 168),
  tasks_completed TEXT,
  notes TEXT,
  
  -- Verification
  submitted_by UUID NOT NULL REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ DEFAULT now(),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'verified', 'disputed')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent duplicate entries for same apprentice/week
  UNIQUE(apprentice_id, partner_id, program_id, week_ending)
);

-- Audit Log for partner actions
CREATE TABLE IF NOT EXISTS partner_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_partner_applications_status ON partner_applications(status);
ALTER TABLE partner_applications ADD COLUMN IF NOT EXISTS email TEXT;
CREATE INDEX IF NOT EXISTS idx_partner_applications_email ON partner_applications(email);
ALTER TABLE partner_users ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_partner_users_user_id ON partner_users(user_id);
ALTER TABLE partner_users ADD COLUMN IF NOT EXISTS partner_id UUID;
CREATE INDEX IF NOT EXISTS idx_partner_users_partner_id ON partner_users(partner_id);
ALTER TABLE partner_program_access ADD COLUMN IF NOT EXISTS partner_id UUID;
CREATE INDEX IF NOT EXISTS idx_partner_program_access_partner ON partner_program_access(partner_id);
ALTER TABLE progress_entries ADD COLUMN IF NOT EXISTS apprentice_id TEXT;
CREATE INDEX IF NOT EXISTS idx_progress_entries_apprentice ON progress_entries(apprentice_id);
ALTER TABLE progress_entries ADD COLUMN IF NOT EXISTS partner_id UUID;
CREATE INDEX IF NOT EXISTS idx_progress_entries_partner ON progress_entries(partner_id);
ALTER TABLE progress_entries ADD COLUMN IF NOT EXISTS week_ending TEXT;
CREATE INDEX IF NOT EXISTS idx_progress_entries_week ON progress_entries(week_ending);
ALTER TABLE partner_audit_log ADD COLUMN IF NOT EXISTS partner_id UUID;
CREATE INDEX IF NOT EXISTS idx_partner_audit_log_partner ON partner_audit_log(partner_id);

-- Enable RLS
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_program_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Partners: Partner users can view their own partner
DROP POLICY IF EXISTS "Partner users can view own partner" ON partners;
CREATE POLICY "Partner users can view own partner"
  ON partners FOR SELECT
  USING (
    id IN (SELECT partner_id FROM partner_users WHERE user_id = auth.uid())
  );

-- Partners: Admins can manage all
DROP POLICY IF EXISTS "Admins can manage partners" ON partners;
CREATE POLICY "Admins can manage partners"
  ON partners FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Partner Applications: Public can insert (onboarding)
DROP POLICY IF EXISTS "Public can submit partner applications" ON partner_applications;
CREATE POLICY "Public can submit partner applications"
  ON partner_applications FOR INSERT
  WITH CHECK (true);

-- Partner Applications: Applicant can view own
DROP POLICY IF EXISTS "Applicants can view own applications" ON partner_applications;
CREATE POLICY "Applicants can view own applications"
  ON partner_applications FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Partner Applications: Admins can manage all
DROP POLICY IF EXISTS "Admins can manage partner applications" ON partner_applications;
CREATE POLICY "Admins can manage partner applications"
  ON partner_applications FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Partner Users: Users can view own record
DROP POLICY IF EXISTS "Users can view own partner_user record" ON partner_users;
CREATE POLICY "Users can view own partner_user record"
  ON partner_users FOR SELECT
  USING (user_id = auth.uid());

-- Partner Users: Partner admins can manage their partner's users
DROP POLICY IF EXISTS "Partner admins can manage partner users" ON partner_users;
CREATE POLICY "Partner admins can manage partner users"
  ON partner_users FOR ALL
  USING (
    partner_id IN (
      SELECT partner_id FROM partner_users 
      WHERE user_id = auth.uid() AND role = 'partner_admin'
    )
  );

-- Partner Program Access: Partner users can view their entitlements
DROP POLICY IF EXISTS "Partner users can view own program access" ON partner_program_access;
CREATE POLICY "Partner users can view own program access"
  ON partner_program_access FOR SELECT
  USING (
    partner_id IN (SELECT partner_id FROM partner_users WHERE user_id = auth.uid())
  );

-- Progress Entries: Partner users can manage entries for their partner + authorized programs
DROP POLICY IF EXISTS "Partner users can manage progress entries" ON progress_entries;
CREATE POLICY "Partner users can manage progress entries"
  ON progress_entries FOR ALL
  USING (
    partner_id IN (SELECT partner_id FROM partner_users WHERE user_id = auth.uid())
    AND program_id IN (
      SELECT program_id FROM partner_program_access ppa
      JOIN partner_users pu ON ppa.partner_id = pu.partner_id
      WHERE pu.user_id = auth.uid()
    )
  );

-- Audit Log: Partner users can view their partner's audit log
DROP POLICY IF EXISTS "Partner users can view own audit log" ON partner_audit_log;
CREATE POLICY "Partner users can view own audit log"
  ON partner_audit_log FOR SELECT
  USING (
    partner_id IN (SELECT partner_id FROM partner_users WHERE user_id = auth.uid())
  );

-- Audit Log: System can insert
DROP POLICY IF EXISTS "System can insert audit log" ON partner_audit_log;
CREATE POLICY "System can insert audit log"
  ON partner_audit_log FOR INSERT
  WITH CHECK (true);
