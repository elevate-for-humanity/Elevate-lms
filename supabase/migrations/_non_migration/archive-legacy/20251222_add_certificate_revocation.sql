-- Add revocation fields to certificates
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS revoked BOOLEAN DEFAULT FALSE;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ;
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS revoked_by UUID REFERENCES auth.users(id);
ALTER TABLE certificates ADD COLUMN IF NOT EXISTS revocation_reason TEXT;

-- Create revocation audit log
CREATE TABLE IF NOT EXISTS certificate_revocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id UUID REFERENCES certificates(id) ON DELETE CASCADE,
  revoked_by UUID REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for revocations
ALTER TABLE certificate_revocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view revocations" ON certificate_revocations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Admins can create revocations" ON certificate_revocations
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

COMMENT ON COLUMN certificates.revoked IS 'Certificate has been revoked';
COMMENT ON COLUMN certificates.revocation_reason IS 'Reason for revocation';
