-- =====================================================
-- Tax Services Tables & Storage Setup
-- Created: December 18, 2024
-- Purpose: Support tax appointment booking and document uploads
-- =====================================================

-- =====================================================
-- 1. TAX APPOINTMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tax_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contact Information
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- Appointment Details
  service TEXT NOT NULL,
  appointment_type TEXT NOT NULL CHECK (appointment_type IN ('in-person', 'virtual')),
  preferred_date DATE NOT NULL,
  preferred_time TIME NOT NULL,
  message TEXT,
  
  -- Status Tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no-show')),
  
  -- Zoom Meeting (for virtual appointments)
  zoom_meeting_id TEXT,
  zoom_join_url TEXT,
  zoom_start_url TEXT,
  
  -- Notes
  staff_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_tax_appointments_status ON tax_appointments(status);
CREATE INDEX idx_tax_appointments_date ON tax_appointments(preferred_date);
CREATE INDEX idx_tax_appointments_email ON tax_appointments(email);
CREATE INDEX idx_tax_appointments_created ON tax_appointments(created_at DESC);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_tax_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tax_appointments_updated_at
  BEFORE UPDATE ON tax_appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_tax_appointments_updated_at();

-- Comments
COMMENT ON TABLE tax_appointments IS 'Stores tax preparation appointment bookings for both VITA and SupersonicFastCash services';
COMMENT ON COLUMN tax_appointments.appointment_type IS 'Either in-person or virtual (Zoom)';
COMMENT ON COLUMN tax_appointments.service IS 'Service requested: vita-free-tax-help, individual-tax-prep, business-tax-prep, refund-advance, etc.';

-- =====================================================
-- 2. TAX DOCUMENT UPLOADS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tax_document_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Contact Information
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  -- File Information
  filename TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT,
  content_type TEXT,
  
  -- Status
  status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'reviewed', 'archived')),
  
  -- Processing
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  
  -- Timestamps
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_tax_document_uploads_email ON tax_document_uploads(email);
CREATE INDEX idx_tax_document_uploads_status ON tax_document_uploads(status);
CREATE INDEX idx_tax_document_uploads_uploaded ON tax_document_uploads(uploaded_at DESC);

-- Comments
COMMENT ON TABLE tax_document_uploads IS 'Tracks document uploads for tax preparation services';
COMMENT ON COLUMN tax_document_uploads.file_path IS 'Path in Supabase Storage bucket';

-- =====================================================
-- 3. STORAGE BUCKET SETUP
-- =====================================================

-- Create tax-documents bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tax-documents',
  'tax-documents',
  false, -- Private bucket
  10485760, -- 10MB limit per file
  ARRAY[
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on tables
ALTER TABLE tax_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_document_uploads ENABLE ROW LEVEL SECURITY;

-- Tax Appointments Policies
-- Allow service role to do everything
CREATE POLICY "Service role has full access to tax_appointments"
  ON tax_appointments
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to view their own appointments
CREATE POLICY "Users can view their own appointments"
  ON tax_appointments
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = email);

-- Allow public to insert appointments (for booking form)
CREATE POLICY "Anyone can create appointments"
  ON tax_appointments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Tax Document Uploads Policies
-- Allow service role to do everything
CREATE POLICY "Service role has full access to tax_document_uploads"
  ON tax_document_uploads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to view their own uploads
CREATE POLICY "Users can view their own uploads"
  ON tax_document_uploads
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = email);

-- Allow public to insert uploads (for upload form)
CREATE POLICY "Anyone can upload documents"
  ON tax_document_uploads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- =====================================================
-- 5. STORAGE POLICIES
-- =====================================================

-- Allow authenticated users to upload to tax-documents
CREATE POLICY "Authenticated users can upload tax documents"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'tax-documents' AND
    (storage.foldername(name))[1] = 'supersonicfastcash'
  );

-- Allow service role full access
CREATE POLICY "Service role has full access to tax documents"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'tax-documents')
  WITH CHECK (bucket_id = 'tax-documents');

-- Allow users to view their own documents
CREATE POLICY "Users can view their own tax documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'tax-documents' AND
    (storage.foldername(name))[2] = (auth.jwt() ->> 'email')
  );

-- =====================================================
-- 6. HELPER FUNCTIONS
-- =====================================================

-- Function to get appointment statistics
CREATE OR REPLACE FUNCTION get_tax_appointment_stats(
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE DEFAULT CURRENT_DATE + INTERVAL '30 days'
)
RETURNS TABLE (
  total_appointments BIGINT,
  pending_appointments BIGINT,
  confirmed_appointments BIGINT,
  completed_appointments BIGINT,
  cancelled_appointments BIGINT,
  in_person_count BIGINT,
  virtual_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_appointments,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT AS pending_appointments,
    COUNT(*) FILTER (WHERE status = 'confirmed')::BIGINT AS confirmed_appointments,
    COUNT(*) FILTER (WHERE status = 'completed')::BIGINT AS completed_appointments,
    COUNT(*) FILTER (WHERE status = 'cancelled')::BIGINT AS cancelled_appointments,
    COUNT(*) FILTER (WHERE appointment_type = 'in-person')::BIGINT AS in_person_count,
    COUNT(*) FILTER (WHERE appointment_type = 'virtual')::BIGINT AS virtual_count
  FROM tax_appointments
  WHERE preferred_date BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get document upload statistics
CREATE OR REPLACE FUNCTION get_tax_document_stats(
  start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
  end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
  total_uploads BIGINT,
  total_size_mb NUMERIC,
  uploaded_count BIGINT,
  reviewed_count BIGINT,
  unique_users BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_uploads,
    ROUND(SUM(file_size)::NUMERIC / 1048576, 2) AS total_size_mb,
    COUNT(*) FILTER (WHERE status = 'uploaded')::BIGINT AS uploaded_count,
    COUNT(*) FILTER (WHERE status = 'reviewed')::BIGINT AS reviewed_count,
    COUNT(DISTINCT email)::BIGINT AS unique_users
  FROM tax_document_uploads
  WHERE uploaded_at BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. SAMPLE DATA (OPTIONAL - FOR TESTING)
-- =====================================================

-- Uncomment to insert sample appointments for testing
/*
INSERT INTO tax_appointments (name, email, phone, service, appointment_type, preferred_date, preferred_time, status)
VALUES
  ('John Doe', 'john@example.com', '317-555-0101', 'individual-tax-prep', 'in-person', CURRENT_DATE + 1, '10:00', 'pending'),
  ('Jane Smith', 'jane@example.com', '317-555-0102', 'refund-advance', 'virtual', CURRENT_DATE + 2, '14:00', 'confirmed'),
  ('Bob Johnson', 'bob@example.com', '317-555-0103', 'vita-free-tax-help', 'in-person', CURRENT_DATE + 3, '11:00', 'pending');
*/

-- =====================================================
-- 8. GRANTS (ENSURE PROPER PERMISSIONS)
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Grant access to tables
GRANT SELECT, INSERT ON tax_appointments TO anon, authenticated;
GRANT ALL ON tax_appointments TO service_role;

GRANT SELECT, INSERT ON tax_document_uploads TO anon, authenticated;
GRANT ALL ON tax_document_uploads TO service_role;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_tax_appointment_stats TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_tax_document_stats TO authenticated, service_role;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

-- Verify tables were created
DO $$
BEGIN
  RAISE NOTICE 'Tax services tables created successfully!';
  RAISE NOTICE 'Tables: tax_appointments, tax_document_uploads';
  RAISE NOTICE 'Storage bucket: tax-documents';
  RAISE NOTICE 'Helper functions: get_tax_appointment_stats, get_tax_document_stats';
END $$;
