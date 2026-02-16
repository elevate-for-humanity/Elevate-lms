-- DIY ID Verification System
-- Self-service identity verification for all user roles

-- Create id_verifications table
CREATE TABLE IF NOT EXISTS id_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal Information
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  ssn_last_4 TEXT, -- Last 4 digits only for security
  
  -- Address Information
  street_address TEXT NOT NULL,
  address_line_2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  
  -- ID Document Information
  id_type TEXT NOT NULL, -- 'drivers_license', 'state_id', 'passport', 'military_id'
  id_number TEXT NOT NULL,
  id_state TEXT, -- State that issued the ID
  id_expiration_date DATE,
  
  -- Document Uploads
  id_front_url TEXT NOT NULL, -- Front of ID
  id_back_url TEXT, -- Back of ID (optional for passport)
  selfie_url TEXT NOT NULL, -- Selfie for facial comparison
  
  -- Verification Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'needs_review'
  verification_method TEXT DEFAULT 'manual', -- 'manual', 'automated', 'hybrid'
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  
  -- Rejection/Review Information
  rejection_reason TEXT,
  review_notes TEXT,
  
  -- Metadata
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure one active verification per user
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_id_verifications_user_id ON id_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_id_verifications_status ON id_verifications(status);
CREATE INDEX IF NOT EXISTS idx_id_verifications_created_at ON id_verifications(created_at DESC);

-- Enable RLS
ALTER TABLE id_verifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own verification
CREATE POLICY "Users can view own verification"
  ON id_verifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own verification (only if none exists)
CREATE POLICY "Users can create own verification"
  ON id_verifications FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    NOT EXISTS (
      SELECT 1 FROM id_verifications
      WHERE user_id = auth.uid()
    )
  );

-- Users can update their own pending verification
CREATE POLICY "Users can update own pending verification"
  ON id_verifications FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending');

-- Admins can view all verifications
CREATE POLICY "Admins can view all verifications"
  ON id_verifications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Admins can update any verification (for review)
CREATE POLICY "Admins can update verifications"
  ON id_verifications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Create verification_audit_log table
CREATE TABLE IF NOT EXISTS verification_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  verification_id UUID NOT NULL REFERENCES id_verifications(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'submitted', 'approved', 'rejected', 'updated'
  performed_by UUID REFERENCES auth.users(id),
  old_status TEXT,
  new_status TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_verification_audit_log_verification_id ON verification_audit_log(verification_id);
CREATE INDEX IF NOT EXISTS idx_verification_audit_log_created_at ON verification_audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE verification_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all audit logs
CREATE POLICY "Admins can view audit logs"
  ON verification_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- System can insert audit logs
CREATE POLICY "System can insert audit logs"
  ON verification_audit_log FOR INSERT
  WITH CHECK (true);

-- Create trigger to update updated_at
CREATE TRIGGER update_id_verifications_updated_at
  BEFORE UPDATE ON id_verifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to log verification changes
CREATE OR REPLACE FUNCTION log_verification_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO verification_audit_log (
      verification_id,
      action,
      performed_by,
      new_status,
      notes
    ) VALUES (
      NEW.id,
      'submitted',
      NEW.user_id,
      NEW.status,
      'Initial verification submission'
    );
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO verification_audit_log (
      verification_id,
      action,
      performed_by,
      old_status,
      new_status,
      notes
    ) VALUES (
      NEW.id,
      CASE 
        WHEN NEW.status = 'approved' THEN 'approved'
        WHEN NEW.status = 'rejected' THEN 'rejected'
        ELSE 'updated'
      END,
      NEW.verified_by,
      OLD.status,
      NEW.status,
      NEW.review_notes
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_verification_changes
  AFTER INSERT OR UPDATE ON id_verifications
  FOR EACH ROW
  EXECUTE FUNCTION log_verification_change();

-- Create function to update profile verification status
CREATE OR REPLACE FUNCTION update_profile_verification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' THEN
    UPDATE profiles
    SET 
      verified = true,
      eligibility_verified = true,
      updated_at = NOW()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profile_on_verification
  AFTER UPDATE ON id_verifications
  FOR EACH ROW
  WHEN (NEW.status = 'approved' AND OLD.status != 'approved')
  EXECUTE FUNCTION update_profile_verification();

-- Create storage bucket for ID documents (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-documents', 'id-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for ID documents
CREATE POLICY "Users can upload own ID documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'id-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own ID documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'id-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all ID documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'id-documents' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
