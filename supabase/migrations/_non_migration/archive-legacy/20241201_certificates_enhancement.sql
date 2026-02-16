-- Enhance certificates table for complete certificate system
-- This migration ensures all necessary fields exist

-- Create certificates table if not exists
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  enrollment_id UUID,
  course_id UUID,
  certificate_number TEXT UNIQUE NOT NULL,
  certificate_type TEXT DEFAULT 'internal',
  student_name TEXT NOT NULL,
  course_name TEXT NOT NULL,
  completion_date TIMESTAMPTZ NOT NULL,
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked BOOLEAN DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  pdf_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'certificates' AND column_name = 'certificate_number') THEN
    ALTER TABLE public.certificates ADD COLUMN certificate_number TEXT UNIQUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'certificates' AND column_name = 'certificate_type') THEN
    ALTER TABLE public.certificates ADD COLUMN certificate_type TEXT DEFAULT 'internal';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'certificates' AND column_name = 'enrollment_id') THEN
    ALTER TABLE public.certificates ADD COLUMN enrollment_id UUID;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'certificates' AND column_name = 'revoked_at') THEN
    ALTER TABLE public.certificates ADD COLUMN revoked_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'certificates' AND column_name = 'revoked_reason') THEN
    ALTER TABLE public.certificates ADD COLUMN revoked_reason TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'certificates' AND column_name = 'pdf_url') THEN
    ALTER TABLE public.certificates ADD COLUMN pdf_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'certificates' AND column_name = 'metadata') THEN
    ALTER TABLE public.certificates ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates (user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_certificate_number ON public.certificates (certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_enrollment_id ON public.certificates (enrollment_id);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON public.certificates (issued_at);
CREATE INDEX IF NOT EXISTS idx_certificates_revoked ON public.certificates (revoked) WHERE revoked = FALSE;

-- Create certificate verification log table
CREATE TABLE IF NOT EXISTS public.certificate_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_number TEXT NOT NULL,
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  verification_result TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_certificate_verifications_number ON public.certificate_verifications (certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificate_verifications_verified_at ON public.certificate_verifications (verified_at);

-- Function to log certificate verification
CREATE OR REPLACE FUNCTION log_certificate_verification(
  p_certificate_number TEXT,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_result TEXT DEFAULT 'success'
)
RETURNS UUID AS $$
DECLARE
  v_verification_id UUID;
BEGIN
  INSERT INTO public.certificate_verifications (
    certificate_number,
    ip_address,
    user_agent,
    verification_result
  ) VALUES (
    p_certificate_number,
    p_ip_address,
    p_user_agent,
    p_result
  ) RETURNING id INTO v_verification_id;
  
  RETURN v_verification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  v_number TEXT;
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate format: EFH-YYYY-XXXXXXXX
    v_number := 'EFH-' || 
                TO_CHAR(NOW(), 'YYYY') || '-' || 
                UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    
    -- Check if exists
    SELECT EXISTS(
      SELECT 1 FROM public.certificates WHERE certificate_number = v_number
    ) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate certificate number if not provided
CREATE OR REPLACE FUNCTION set_certificate_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.certificate_number IS NULL THEN
    NEW.certificate_number := generate_certificate_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_certificate_number ON public.certificates;
CREATE TRIGGER trigger_set_certificate_number
  BEFORE INSERT ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION set_certificate_number();

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_certificates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_certificates_updated_at ON public.certificates;
CREATE TRIGGER trigger_certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_certificates_updated_at();

-- RLS Policies
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_verifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own certificates
DROP POLICY IF EXISTS "Users can view own certificates" ON public.certificates;
CREATE POLICY "Users can view own certificates"
  ON public.certificates
  FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone can verify certificates (public verification)
DROP POLICY IF EXISTS "Anyone can verify certificates" ON public.certificates;
CREATE POLICY "Anyone can verify certificates"
  ON public.certificates
  FOR SELECT
  USING (revoked = FALSE);

-- System can insert certificates
DROP POLICY IF EXISTS "System can insert certificates" ON public.certificates;
CREATE POLICY "System can insert certificates"
  ON public.certificates
  FOR INSERT
  WITH CHECK (true);

-- Anyone can log verifications
DROP POLICY IF EXISTS "Anyone can log verifications" ON public.certificate_verifications;
CREATE POLICY "Anyone can log verifications"
  ON public.certificate_verifications
  FOR INSERT
  WITH CHECK (true);

-- Admins can view all verifications
DROP POLICY IF EXISTS "Admins can view verifications" ON public.certificate_verifications;
CREATE POLICY "Admins can view verifications"
  ON public.certificate_verifications
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );
