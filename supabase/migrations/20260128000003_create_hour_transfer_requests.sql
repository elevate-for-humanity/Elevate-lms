-- Hour Transfer Requests Table
-- Tracks requests to transfer hours from previous training/employment

CREATE TABLE IF NOT EXISTS hour_transfer_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Apprentice info
  apprentice_id UUID NOT NULL,
  submitted_by UUID NOT NULL REFERENCES auth.users(id),
  
  -- Source info
  source TEXT NOT NULL, -- 'barber_school', 'cosmetology_school', 'out_of_state_license', etc.
  source_type TEXT NOT NULL CHECK (source_type IN (
    'in_state_barber_school',
    'out_of_state_school', 
    'out_of_state_license',
    'previous_apprenticeship',
    'work_experience'
  )),
  
  -- Request details
  hours_requested INT NOT NULL CHECK (hours_requested > 0),
  description TEXT,
  previous_employer TEXT,
  employment_dates TEXT,
  
  -- Supporting documents
  document_ids UUID[] DEFAULT '{}',
  
  -- Verification status
  docs_verified BOOLEAN DEFAULT false,
  docs_verified_at TIMESTAMPTZ,
  
  -- Request status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending',
    'requires_manual_review',
    'evaluated',
    'approved',
    'partial',
    'rejected'
  )),
  
  -- Evaluation results
  hours_accepted INT,
  evaluation_decision TEXT,
  evaluation_notes TEXT,
  evaluated_by UUID REFERENCES auth.users(id),
  evaluated_at TIMESTAMPTZ,
  
  -- Rule tracking
  rule_set_id TEXT,
  rule_hash TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hour_transfer_requests_apprentice 
  ON hour_transfer_requests(apprentice_id);

CREATE INDEX IF NOT EXISTS idx_hour_transfer_requests_submitted_by 
  ON hour_transfer_requests(submitted_by);

CREATE INDEX IF NOT EXISTS idx_hour_transfer_requests_status 
  ON hour_transfer_requests(status);

CREATE INDEX IF NOT EXISTS idx_hour_transfer_requests_source_type 
  ON hour_transfer_requests(source_type);

-- Enable RLS
ALTER TABLE hour_transfer_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own transfer requests" ON hour_transfer_requests;
CREATE POLICY "Users can view own transfer requests" ON hour_transfer_requests
  FOR SELECT USING (submitted_by = auth.uid());

DROP POLICY IF EXISTS "Users can create own transfer requests" ON hour_transfer_requests;
CREATE POLICY "Users can create own transfer requests" ON hour_transfer_requests
  FOR INSERT WITH CHECK (submitted_by = auth.uid());

DROP POLICY IF EXISTS "Admins can view all transfer requests" ON hour_transfer_requests;
CREATE POLICY "Admins can view all transfer requests" ON hour_transfer_requests
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can update transfer requests" ON hour_transfer_requests;
CREATE POLICY "Admins can update transfer requests" ON hour_transfer_requests
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Service role full access" ON hour_transfer_requests;
CREATE POLICY "Service role full access" ON hour_transfer_requests
  FOR ALL USING (auth.role() = 'service_role');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_hour_transfer_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hour_transfer_requests_updated_at
  BEFORE UPDATE ON hour_transfer_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_hour_transfer_requests_updated_at();

-- Add comment
COMMENT ON TABLE hour_transfer_requests IS 'Tracks requests to transfer hours from previous training or employment';
