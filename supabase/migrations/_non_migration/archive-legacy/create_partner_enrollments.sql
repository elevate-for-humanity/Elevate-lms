-- Create table for partner enrollments
CREATE TABLE IF NOT EXISTS partner_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Organization Info
  organization_name TEXT NOT NULL,
  organization_type TEXT,
  industry TEXT,
  website TEXT,
  
  -- Primary Contact
  contact_name TEXT NOT NULL,
  contact_title TEXT,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  
  -- Location
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  
  -- Partnership Details
  programs_interested TEXT[] NOT NULL,
  capacity_per_month TEXT,
  preferred_schedule TEXT,
  has_supervision TEXT,
  
  -- Additional Info
  experience TEXT,
  special_requirements TEXT,
  how_heard TEXT,
  
  -- Agreement
  agreed_to_terms BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, active, inactive
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_partner_enrollments_status
  ON partner_enrollments (status);

CREATE INDEX IF NOT EXISTS idx_partner_enrollments_created_at
  ON partner_enrollments (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_partner_enrollments_email
  ON partner_enrollments (contact_email);

-- Add comment to table
COMMENT ON TABLE partner_enrollments IS 'Stores partner enrollment applications from organizations interested in hosting Elevate learners';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_partner_enrollments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER partner_enrollments_updated_at
  BEFORE UPDATE ON partner_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_enrollments_updated_at();
