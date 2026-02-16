-- Sub-Office Agreements Table
CREATE TABLE IF NOT EXISTS sub_office_agreements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Sub-Office Information
  sub_office_name TEXT NOT NULL,
  sub_office_address TEXT NOT NULL,
  sub_office_city TEXT NOT NULL,
  sub_office_state TEXT NOT NULL,
  sub_office_zip TEXT NOT NULL,
  
  -- Representative Information
  representative_name TEXT NOT NULL,
  representative_title TEXT NOT NULL,
  representative_email TEXT NOT NULL,
  representative_phone TEXT NOT NULL,
  
  -- Agreement Details
  effective_date DATE NOT NULL,
  status TEXT DEFAULT 'active',
  
  -- Digital Signatures
  sub_office_signature TEXT NOT NULL,
  main_office_signature TEXT,
  
  -- Audit Trail
  signed_at TIMESTAMPTZ NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  
  -- Compensation Terms
  base_fee_split_percentage DECIMAL(5,2) DEFAULT 45.00,
  
  -- Notes
  notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sub_office_agreements_email ON sub_office_agreements(representative_email);
CREATE INDEX IF NOT EXISTS idx_sub_office_agreements_status ON sub_office_agreements(status);
CREATE INDEX IF NOT EXISTS idx_sub_office_agreements_effective_date ON sub_office_agreements(effective_date);

-- Enable RLS
ALTER TABLE sub_office_agreements ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Service role full access to agreements" ON sub_office_agreements
  FOR ALL USING (true);

-- Update trigger
CREATE TRIGGER update_sub_office_agreements_updated_at
  BEFORE UPDATE ON sub_office_agreements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
