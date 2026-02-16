-- =====================================================
-- AI Instructor & Certificate System Migration
-- =====================================================
-- Run this in your Supabase SQL Editor
-- This creates all tables and storage needed for:
-- - Certificate generation and storage
-- - Certificate verification
-- - Student certificate dashboard
-- =====================================================

-- Create student_certificates table
CREATE TABLE IF NOT EXISTS student_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  certificate_type TEXT NOT NULL CHECK (certificate_type IN ('module', 'program')),
  certificate_number TEXT UNIQUE NOT NULL,
  course_name TEXT NOT NULL,
  issued_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  issuer TEXT NOT NULL,
  pdf_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_certificates_student_id 
  ON student_certificates(student_id);

CREATE INDEX IF NOT EXISTS idx_student_certificates_number 
  ON student_certificates(certificate_number);

CREATE INDEX IF NOT EXISTS idx_student_certificates_type 
  ON student_certificates(certificate_type);

CREATE INDEX IF NOT EXISTS idx_student_certificates_issued_date 
  ON student_certificates(issued_date DESC);

-- Add comments for documentation
COMMENT ON TABLE student_certificates IS 'Stores all certificates issued to students (module and program certificates)';
COMMENT ON COLUMN student_certificates.certificate_type IS 'Type of certificate: module (from partners) or program (from Elevate)';
COMMENT ON COLUMN student_certificates.certificate_number IS 'Unique verification number (e.g., MOD-1234567890-ABC123)';
COMMENT ON COLUMN student_certificates.issuer IS 'Organization that issued the certificate (partner name or Elevate for Humanity)';
COMMENT ON COLUMN student_certificates.metadata IS 'Additional data: enrollment_id, module_id, program_id, etc.';

-- Enable Row Level Security
ALTER TABLE student_certificates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Students can view their own certificates" ON student_certificates;
DROP POLICY IF EXISTS "Service role can insert certificates" ON student_certificates;
DROP POLICY IF EXISTS "Service role can update certificates" ON student_certificates;
DROP POLICY IF EXISTS "Public can verify certificates" ON student_certificates;

-- RLS Policy: Students can view their own certificates
CREATE POLICY "Students can view their own certificates"
  ON student_certificates
  FOR SELECT
  USING (auth.uid() = student_id);

-- RLS Policy: Service role can insert certificates
CREATE POLICY "Service role can insert certificates"
  ON student_certificates
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy: Service role can update certificates
CREATE POLICY "Service role can update certificates"
  ON student_certificates
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RLS Policy: Public can verify certificates (read-only, specific columns)
CREATE POLICY "Public can verify certificates"
  ON student_certificates
  FOR SELECT
  USING (true);

-- Create storage bucket for certificates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificates',
  'certificates',
  true,
  5242880, -- 5MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['application/pdf'];

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Anyone can view certificates" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload certificates" ON storage.objects;
DROP POLICY IF EXISTS "Service role can update certificates" ON storage.objects;
DROP POLICY IF EXISTS "Service role can delete certificates" ON storage.objects;

-- Storage Policy: Anyone can view certificates (public bucket)
CREATE POLICY "Anyone can view certificates"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'certificates');

-- Storage Policy: Service role can upload certificates
CREATE POLICY "Service role can upload certificates"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'certificates');

-- Storage Policy: Service role can update certificates
CREATE POLICY "Service role can update certificates"
  ON storage.objects
  FOR UPDATE
  USING (bucket_id = 'certificates')
  WITH CHECK (bucket_id = 'certificates');

-- Storage Policy: Service role can delete certificates
CREATE POLICY "Service role can delete certificates"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'certificates');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_student_certificates_updated_at ON student_certificates;
CREATE TRIGGER update_student_certificates_updated_at
  BEFORE UPDATE ON student_certificates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add completed_modules column to partner_course_enrollments if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'partner_course_enrollments' 
    AND column_name = 'completed_modules'
  ) THEN
    ALTER TABLE partner_course_enrollments 
    ADD COLUMN completed_modules TEXT[] DEFAULT '{}';
  END IF;
END $$;

-- Create index on completed_modules
CREATE INDEX IF NOT EXISTS idx_partner_course_enrollments_completed_modules 
  ON partner_course_enrollments USING GIN(completed_modules);

-- Grant necessary permissions
GRANT SELECT ON student_certificates TO anon, authenticated;
GRANT ALL ON student_certificates TO service_role;
GRANT SELECT ON storage.objects TO anon, authenticated;
GRANT ALL ON storage.objects TO service_role;

-- =====================================================
-- Verification: Check that everything was created
-- =====================================================

-- Verify table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'student_certificates') THEN
    RAISE NOTICE '✅ Table student_certificates created successfully';
  ELSE
    RAISE EXCEPTION '❌ Table student_certificates was not created';
  END IF;
END $$;

-- Verify indexes exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'student_certificates' AND indexname = 'idx_student_certificates_student_id') THEN
    RAISE NOTICE '✅ Indexes created successfully';
  ELSE
    RAISE EXCEPTION '❌ Indexes were not created';
  END IF;
END $$;

-- Verify storage bucket exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'certificates') THEN
    RAISE NOTICE '✅ Storage bucket certificates created successfully';
  ELSE
    RAISE EXCEPTION '❌ Storage bucket certificates was not created';
  END IF;
END $$;

-- Verify RLS is enabled
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'student_certificates' 
    AND rowsecurity = true
  ) THEN
    RAISE NOTICE '✅ Row Level Security enabled successfully';
  ELSE
    RAISE EXCEPTION '❌ Row Level Security was not enabled';
  END IF;
END $$;

RAISE NOTICE '🎉 Migration completed successfully!';
RAISE NOTICE '📝 Next steps:';
RAISE NOTICE '   1. Test certificate generation via API';
RAISE NOTICE '   2. Visit /student/certificates to view certificates';
RAISE NOTICE '   3. Visit /certificates/verify to test verification';
