-- Migration: Create barbershop_partner_applications table
-- Purpose: Store barbershop partner applications for the Indiana Barber Apprenticeship program

CREATE TABLE IF NOT EXISTS barbershop_partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Application status
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'withdrawn')),
  
  -- Shop information
  shop_legal_name TEXT NOT NULL,
  shop_dba_name TEXT,
  owner_name TEXT NOT NULL,
  
  -- Contact information
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  
  -- Address
  shop_address_line1 TEXT NOT NULL,
  shop_address_line2 TEXT,
  shop_city TEXT NOT NULL,
  shop_state TEXT NOT NULL DEFAULT 'IN',
  shop_zip TEXT NOT NULL,
  
  -- Licensing
  indiana_shop_license_number TEXT NOT NULL,
  
  -- Supervising barber
  supervisor_name TEXT NOT NULL,
  supervisor_license_number TEXT NOT NULL,
  supervisor_years_licensed INTEGER,
  
  -- Employment and compliance
  employment_model TEXT NOT NULL CHECK (employment_model IN ('hourly', 'commission', 'hybrid', 'not_sure')),
  has_workers_comp BOOLEAN NOT NULL DEFAULT false,
  can_supervise_and_verify BOOLEAN NOT NULL DEFAULT false,
  
  -- Acknowledgments
  mou_acknowledged BOOLEAN NOT NULL DEFAULT false,
  consent_acknowledged BOOLEAN NOT NULL DEFAULT false,
  
  -- Additional info
  notes TEXT,
  
  -- Tracking
  source_url TEXT,
  user_agent TEXT,
  ip_hash TEXT,
  
  -- Internal notes (for staff)
  internal_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ
);

-- Indexes for common queries
CREATE INDEX idx_barbershop_partner_apps_email ON barbershop_partner_applications(contact_email);
CREATE INDEX idx_barbershop_partner_apps_license ON barbershop_partner_applications(indiana_shop_license_number);
CREATE INDEX idx_barbershop_partner_apps_status ON barbershop_partner_applications(status);
CREATE INDEX idx_barbershop_partner_apps_created ON barbershop_partner_applications(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_barbershop_partner_apps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_barbershop_partner_apps_updated_at
  BEFORE UPDATE ON barbershop_partner_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_barbershop_partner_apps_updated_at();

-- RLS policies
ALTER TABLE barbershop_partner_applications ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anyone (public form submission)
CREATE POLICY "Allow public inserts" ON barbershop_partner_applications
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated staff can view/update
CREATE POLICY "Staff can view all" ON barbershop_partner_applications
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can update" ON barbershop_partner_applications
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Comment on table
COMMENT ON TABLE barbershop_partner_applications IS 'Barbershop partner applications for the Indiana Barber Apprenticeship program';
