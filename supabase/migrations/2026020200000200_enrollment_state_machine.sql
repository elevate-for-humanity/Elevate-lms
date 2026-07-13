-- ============================================================
-- ENROLLMENT STATE MACHINE
-- Adds columns for frictionless enrollment flow tracking
-- ============================================================

-- Add enrollment state tracking columns
ALTER TABLE public.training_enrollments 
ADD COLUMN IF NOT EXISTS orientation_completed_at TIMESTAMPTZ;

ALTER TABLE public.training_enrollments 
ADD COLUMN IF NOT EXISTS documents_submitted_at TIMESTAMPTZ;

ALTER TABLE public.training_enrollments 
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;

ALTER TABLE public.training_enrollments 
ADD COLUMN IF NOT EXISTS funding_source TEXT;

ALTER TABLE public.training_enrollments 
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('self_pay', 'wioa', 'wrg', 'jri', 'employer', 'other'));

-- Drop existing status constraint and add new one with all states
ALTER TABLE public.training_enrollments DROP CONSTRAINT IF EXISTS enrollments_status_check;

ALTER TABLE public.training_enrollments 
ADD CONSTRAINT training_enrollments_status_check 
CHECK (status IN (
  'applied',
  'approved', 
  'paid',
  'confirmed',
  'orientation_complete',
  'documents_complete',
  'active',
  'in_progress',
  'completed',
  'withdrawn',
  'suspended',
  'pending'
));

-- Create index for faster state queries
ALTER TABLE public.training_enrollments ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON public.training_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_status ON public.training_enrollments(user_id, status);

-- Function to get next required action for an enrollment
CREATE OR REPLACE FUNCTION get_enrollment_next_action(enrollment_id UUID)
RETURNS TABLE(action_label TEXT, action_href TEXT, action_description TEXT) AS $$
DECLARE
  enrollment_record RECORD;
  program_slug TEXT;
BEGIN
  SELECT e.*, p.slug INTO enrollment_record
  FROM training_enrollments e
  LEFT JOIN programs p ON e.program_id = p.id
  WHERE e.id = enrollment_id;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  program_slug := COALESCE(enrollment_record.slug, 'barber-apprenticeship');
  
  -- Priority 1: Orientation
  IF enrollment_record.orientation_completed_at IS NULL THEN
    RETURN QUERY SELECT 
      'Complete Orientation'::TEXT,
      ('/programs/' || program_slug || '/orientation')::TEXT,
      'Complete your mandatory orientation to continue'::TEXT;
    RETURN;
  END IF;
  
  -- Priority 2: Documents
  IF enrollment_record.documents_submitted_at IS NULL THEN
    RETURN QUERY SELECT 
      'Submit Required Documents'::TEXT,
      ('/programs/' || program_slug || '/documents')::TEXT,
      'Upload your required documents to access your program'::TEXT;
    RETURN;
  END IF;
  
  -- Priority 3: First course
  RETURN QUERY SELECT 
    'Begin Course 1'::TEXT,
    '/apprentice/courses/1'::TEXT,
    'Start your first course module'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_enrollment_next_action(UUID) TO authenticated;

COMMENT ON COLUMN public.training_enrollments.orientation_completed_at IS 'Timestamp when student completed mandatory orientation';
COMMENT ON COLUMN public.training_enrollments.documents_submitted_at IS 'Timestamp when student submitted required documents';
COMMENT ON COLUMN public.training_enrollments.confirmed_at IS 'Timestamp when enrollment was confirmed (post-payment)';

-- ============================================================
-- STORAGE BUCKET FOR ENROLLMENT DOCUMENTS
-- ============================================================

-- Create storage bucket for enrollment documents (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'enrollment-documents',
  'enrollment-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for enrollment-documents bucket
DROP POLICY IF EXISTS "Users can upload their own documents" ON storage.objects;
CREATE POLICY "Users can upload their own documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'enrollment-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can view their own documents" ON storage.objects;
CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'enrollment-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Users can delete their own documents" ON storage.objects;
CREATE POLICY "Users can delete their own documents"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'enrollment-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "Admins can access all enrollment documents" ON storage.objects;
CREATE POLICY "Admins can access all enrollment documents"
ON storage.objects FOR ALL TO authenticated
USING (
  bucket_id = 'enrollment-documents' AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('admin', 'super_admin')
  )
);
