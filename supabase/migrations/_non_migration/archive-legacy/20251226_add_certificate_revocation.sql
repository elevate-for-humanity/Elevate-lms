-- Add certificate revocation capability

ALTER TABLE certificates
ADD COLUMN IF NOT EXISTS revoked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS revoked_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS revocation_reason TEXT;

-- Create index for revocation queries
CREATE INDEX IF NOT EXISTS idx_certificates_revoked ON certificates(revoked);

-- Function to revoke certificate
CREATE OR REPLACE FUNCTION revoke_certificate(
  certificate_id UUID,
  admin_id UUID,
  reason TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE certificates
  SET 
    revoked = true,
    revoked_at = NOW(),
    revoked_by = admin_id,
    revocation_reason = reason
  WHERE id = certificate_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to restore certificate
CREATE OR REPLACE FUNCTION restore_certificate(
  certificate_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE certificates
  SET 
    revoked = false,
    revoked_at = NULL,
    revoked_by = NULL,
    revocation_reason = NULL
  WHERE id = certificate_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policy for revoked certificates
CREATE POLICY "Revoked certificates not visible to students"
  ON certificates FOR SELECT
  USING (
    revoked = false OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Comment
COMMENT ON COLUMN certificates.revoked IS 'Whether certificate has been revoked';
COMMENT ON COLUMN certificates.revocation_reason IS 'Reason for certificate revocation';
