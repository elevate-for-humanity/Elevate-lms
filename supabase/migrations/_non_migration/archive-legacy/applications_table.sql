-- Applications Table
-- Stores student applications for programs

CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- Address
  street_address TEXT,
  city TEXT NOT NULL,
  state TEXT DEFAULT 'IN',
  zip_code TEXT NOT NULL,
  
  -- Program Selection
  program_id UUID REFERENCES programs(id),
  program_name TEXT NOT NULL,
  
  -- Additional Information
  notes TEXT,
  referral_source TEXT,
  
  -- Funding
  funding_type TEXT CHECK (funding_type IN ('WIOA', 'WRG', 'JRI', 'Self-Pay', 'Other')),
  has_barriers BOOLEAN DEFAULT FALSE,
  barrier_types TEXT[], -- Array of barrier types
  
  -- Status Tracking
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',
    'reviewing',
    'approved',
    'rejected',
    'enrolled',
    'withdrawn'
  )),
  
  -- Timestamps
  submitted_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  approved_at TIMESTAMP,
  enrolled_at TIMESTAMP,
  
  -- Reviewer Information
  reviewed_by UUID REFERENCES auth.users(id),
  reviewer_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_applications_email ON applications(email);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_program ON applications(program_id);
CREATE INDEX idx_applications_submitted ON applications(submitted_at DESC);
CREATE INDEX idx_applications_funding ON applications(funding_type);

-- Full-text search index
CREATE INDEX idx_applications_search ON applications USING gin(
  to_tsvector('english', 
    coalesce(first_name, '') || ' ' || 
    coalesce(last_name, '') || ' ' || 
    coalesce(email, '') || ' ' ||
    coalesce(program_name, '')
  )
);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_applications_updated_at();

-- Row Level Security (RLS)
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Policy: Public can insert (submit applications)
CREATE POLICY "Anyone can submit applications"
  ON applications
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Users can view their own applications
CREATE POLICY "Users can view own applications"
  ON applications
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- Policy: Admins can view all applications
CREATE POLICY "Admins can view all applications"
  ON applications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Policy: Admins can update applications
CREATE POLICY "Admins can update applications"
  ON applications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Comments for documentation
COMMENT ON TABLE applications IS 'Student applications for training programs';
COMMENT ON COLUMN applications.status IS 'Application workflow status';
COMMENT ON COLUMN applications.funding_type IS 'Type of funding student is applying for';
COMMENT ON COLUMN applications.barrier_types IS 'Array of barriers student faces (transportation, childcare, etc.)';
