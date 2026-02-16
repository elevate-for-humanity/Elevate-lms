-- ============================================================
-- WORKSITE PARTNERS (OJT Training Sites)
-- For barbershops and other apprenticeship worksites
-- ============================================================

-- Worksite Partners Table
CREATE TABLE IF NOT EXISTS worksite_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Business Info
  business_name TEXT NOT NULL,
  business_type TEXT DEFAULT 'barbershop',
  license_number TEXT,
  license_state TEXT DEFAULT 'IN',
  license_expiry DATE,
  
  -- Contact Info
  owner_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  
  -- Address
  street_address TEXT,
  city TEXT,
  state TEXT DEFAULT 'IN',
  zip_code TEXT,
  
  -- Supervisor Info
  supervisor_name TEXT,
  supervisor_license TEXT,
  supervisor_years_experience INTEGER,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'suspended', 'inactive')),
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  
  -- MOU
  mou_signed BOOLEAN DEFAULT false,
  mou_signed_at TIMESTAMPTZ,
  mou_document_url TEXT,
  
  -- Insurance
  workers_comp_verified BOOLEAN DEFAULT false,
  insurance_expiry DATE,
  
  -- Capacity
  max_apprentices INTEGER DEFAULT 2,
  current_apprentices INTEGER DEFAULT 0,
  
  -- RAPIDS
  rapids_worksite_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Apprentice Assignments (links students to worksites)
CREATE TABLE IF NOT EXISTS apprentice_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprentice_id UUID NOT NULL REFERENCES auth.users(id),
  worksite_id UUID NOT NULL REFERENCES worksite_partners(id),
  enrollment_id UUID REFERENCES enrollments(id),
  
  -- Assignment Details
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'transferred', 'terminated')),
  
  -- Compensation
  hourly_rate DECIMAL(6,2),
  compensation_model TEXT, -- 'hourly', 'commission', 'hybrid'
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_worksite_partners_status ON worksite_partners(status);
CREATE INDEX IF NOT EXISTS idx_worksite_partners_city ON worksite_partners(city);
CREATE INDEX IF NOT EXISTS idx_apprentice_assignments_apprentice ON apprentice_assignments(apprentice_id);
CREATE INDEX IF NOT EXISTS idx_apprentice_assignments_worksite ON apprentice_assignments(worksite_id);

-- RLS
ALTER TABLE worksite_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE apprentice_assignments ENABLE ROW LEVEL SECURITY;

-- Public can view approved worksites
CREATE POLICY "Public can view approved worksites" ON worksite_partners
  FOR SELECT USING (status IN ('approved', 'active'));

-- Admins can manage all
CREATE POLICY "Admins can manage worksites" ON worksite_partners
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Users can view their own assignments
CREATE POLICY "Users can view own assignments" ON apprentice_assignments
  FOR SELECT USING (auth.uid() = apprentice_id);

-- Admins can manage assignments
CREATE POLICY "Admins can manage assignments" ON apprentice_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Grant permissions
GRANT SELECT ON worksite_partners TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON apprentice_assignments TO authenticated;
