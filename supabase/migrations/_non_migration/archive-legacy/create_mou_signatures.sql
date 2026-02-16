-- Create table for MOU digital signatures
CREATE TABLE IF NOT EXISTS mou_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Organization Info
  organization_name TEXT NOT NULL,
  
  -- Signer Info
  contact_name TEXT NOT NULL,
  contact_title TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  
  -- Signature
  digital_signature TEXT NOT NULL,
  agreed BOOLEAN NOT NULL DEFAULT TRUE,
  
  -- Audit Trail
  ip_address TEXT,
  user_agent TEXT,
  
  -- Timestamps
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_mou_signatures_email
  ON mou_signatures (contact_email);

CREATE INDEX IF NOT EXISTS idx_mou_signatures_org
  ON mou_signatures (organization_name);

CREATE INDEX IF NOT EXISTS idx_mou_signatures_signed_at
  ON mou_signatures (signed_at DESC);

-- Add comment to table
COMMENT ON TABLE mou_signatures IS 'Stores digital signatures for Universal Program Partner MOUs signed through the portal';
