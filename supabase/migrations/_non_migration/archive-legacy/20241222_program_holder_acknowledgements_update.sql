-- Update program_holder_acknowledgements table to support multiple document types

-- Add new columns
ALTER TABLE program_holder_acknowledgements
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS document_type TEXT NOT NULL DEFAULT 'general',
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_program_holder_ack_user_id
  ON program_holder_acknowledgements (user_id);

CREATE INDEX IF NOT EXISTS idx_program_holder_ack_document_type
  ON program_holder_acknowledgements (document_type);

-- Add unique constraint to prevent duplicate acknowledgements
CREATE UNIQUE INDEX IF NOT EXISTS idx_program_holder_ack_unique
  ON program_holder_acknowledgements (user_id, document_type);

-- Enable RLS
ALTER TABLE program_holder_acknowledgements ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own acknowledgements"
  ON program_holder_acknowledgements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own acknowledgements"
  ON program_holder_acknowledgements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all acknowledgements"
  ON program_holder_acknowledgements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Add comment
COMMENT ON COLUMN program_holder_acknowledgements.document_type IS 'Type of document acknowledged: handbook, rights, mou, etc.';
