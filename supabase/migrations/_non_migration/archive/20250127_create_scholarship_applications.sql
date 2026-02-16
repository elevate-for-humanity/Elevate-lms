-- Migration: Create scholarship applications table
-- Created: 2025-01-27

-- Scholarship applications table
CREATE TABLE IF NOT EXISTS scholarship_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Personal Information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip TEXT NOT NULL,
  
  -- Scholarship & Program
  scholarship_type TEXT NOT NULL,
  program_interest TEXT NOT NULL,
  
  -- Eligibility
  household_income TEXT NOT NULL,
  household_size INTEGER NOT NULL,
  employment_status TEXT NOT NULL,
  education_level TEXT NOT NULL,
  
  -- Circumstances
  is_single_parent BOOLEAN DEFAULT false,
  is_formerly_incarcerated BOOLEAN DEFAULT false,
  is_homeless BOOLEAN DEFAULT false,
  is_veteran BOOLEAN DEFAULT false,
  has_disability BOOLEAN DEFAULT false,
  
  -- Essays
  why_scholarship TEXT NOT NULL,
  career_goals TEXT NOT NULL,
  financial_need TEXT,
  
  -- Uploaded Files
  proof_of_income_url TEXT,
  identification_url TEXT,
  additional_docs_url TEXT,
  
  -- Status & Tracking
  status TEXT DEFAULT 'pending',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  decision TEXT,
  decision_notes TEXT,
  award_amount NUMERIC,
  
  -- Timestamps
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scholarship_applications_email ON scholarship_applications(email);
CREATE INDEX IF NOT EXISTS idx_scholarship_applications_status ON scholarship_applications(status);
CREATE INDEX IF NOT EXISTS idx_scholarship_applications_scholarship_type ON scholarship_applications(scholarship_type);
CREATE INDEX IF NOT EXISTS idx_scholarship_applications_submitted_at ON scholarship_applications(submitted_at);

-- Enable Row Level Security
ALTER TABLE scholarship_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Service role full access
CREATE POLICY "Service role full access on scholarship_applications"
  ON scholarship_applications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Applicants can view their own applications
CREATE POLICY "Applicants can view own applications"
  ON scholarship_applications
  FOR SELECT
  TO authenticated
  USING (auth.jwt() ->> 'email' = email);

-- Add updated_at trigger
CREATE TRIGGER update_scholarship_applications_updated_at
  BEFORE UPDATE ON scholarship_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "Service role can upload documents"
  ON storage.objects
  FOR INSERT
  TO service_role
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "Service role can read documents"
  ON storage.objects
  FOR SELECT
  TO service_role
  USING (bucket_id = 'documents');

CREATE POLICY "Authenticated users can read own documents"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = 'scholarship-applications' AND
    (storage.foldername(name))[2] = auth.jwt() ->> 'email'
  );
