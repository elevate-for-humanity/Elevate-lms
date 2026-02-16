-- Create table for program holder acknowledgements
CREATE TABLE IF NOT EXISTS program_holder_acknowledgements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  title TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  agreed BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries by date
CREATE INDEX IF NOT EXISTS idx_program_holder_ack_created_at
  ON program_holder_acknowledgements (created_at DESC);

-- Add comment to table
COMMENT ON TABLE program_holder_acknowledgements IS 'Stores acknowledgements from program holders and site partners who agree to host learners';
