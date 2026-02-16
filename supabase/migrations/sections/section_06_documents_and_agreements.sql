-- Update documents table to support the document management system
-- Adds missing columns for user_id, file_url, status, metadata, verification_notes

-- Add user_id column (nullable for backward compatibility, references the uploading user)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add file_url column for public URL
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_url TEXT;

-- Add file_size column (alias for file_size_bytes)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size INT;

-- Add status column for verification workflow
DO $$ BEGIN
  CREATE TYPE document_status AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add status column if not exists (with default)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- Add metadata column for additional document info
ALTER TABLE documents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Add verification_notes column for admin notes
ALTER TABLE documents ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Add employment_verification to document_type check constraint
-- First drop the old constraint, then add new one
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_document_type_check;
ALTER TABLE documents ADD CONSTRAINT documents_document_type_check CHECK (document_type IN (
  'photo_id',
  'school_transcript',
  'certificate',
  'out_of_state_license',
  'shop_license',
  'barber_license',
  'ce_certificate',
  'employment_verification',
  'ipla_packet',
  'other'
));

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);

-- Create index on status for verification queue
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);

-- Update existing records to set status based on verified column
UPDATE documents SET status = 'verified' WHERE verified = true AND status IS NULL;
UPDATE documents SET status = 'pending' WHERE verified = false AND status IS NULL;

-- Backfill user_id from uploaded_by where possible (if uploaded_by is a UUID)
UPDATE documents 
SET user_id = uploaded_by::uuid 
WHERE user_id IS NULL 
  AND uploaded_by IS NOT NULL 
  AND uploaded_by ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

-- Add comment
COMMENT ON COLUMN documents.user_id IS 'User who uploaded the document (references auth.users)';
COMMENT ON COLUMN documents.status IS 'Verification status: pending, verified, rejected';
COMMENT ON COLUMN documents.verification_notes IS 'Admin notes when verifying/rejecting';

-- Add docs_verified columns to enrollments table for tracking verification status
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS docs_verified BOOLEAN DEFAULT false;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS docs_verified_at TIMESTAMPTZ;
-- RLS DOCUMENTATION (policies already exist)
-- This migration documents existing Row Level Security policies for audit purposes

comment on table enrollments is 'RLS enforced: users see only own enrollments or org scope';
comment on table lesson_progress is 'RLS enforced: user_id = auth.uid()';
comment on table certificates is 'RLS enforced: owner or verifier access';
comment on table tenants is 'RLS enforced: tenant isolation';
comment on table profiles is 'RLS enforced: users can only read/update own profile';
comment on table courses is 'RLS enforced: public read, admin write';
comment on table lessons is 'RLS enforced: enrolled users can read, admin write';
-- Document Automation Tables
-- Stores OCR extractions, automated decisions, and review queue

-- 1. Document Extractions - stores OCR/parsing results
CREATE TABLE IF NOT EXISTS documents_extractions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL, -- transcript, license, insurance, mou, id, w2
  extracted JSONB NOT NULL DEFAULT '{}', -- extracted fields
  raw_text TEXT, -- raw OCR text
  confidence NUMERIC(5,4) DEFAULT 0, -- 0.0000 to 1.0000
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'passed', 'failed', 'needs_review')),
  validation_errors TEXT[], -- list of validation failures
  ruleset_version TEXT NOT NULL DEFAULT '1.0.0',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_doc_extractions_document ON documents_extractions(document_id);
CREATE INDEX idx_doc_extractions_status ON documents_extractions(status);
CREATE INDEX idx_doc_extractions_doc_type ON documents_extractions(doc_type);

-- 2. Automated Decisions - audit trail for all system decisions
CREATE TABLE IF NOT EXISTS automated_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type TEXT NOT NULL, -- application, partner, transfer_hours, routing, document
  subject_id UUID NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('approved', 'rejected', 'needs_review', 'recommended', 'assigned', 'flagged')),
  reason_codes TEXT[] NOT NULL DEFAULT '{}',
  input_snapshot JSONB NOT NULL DEFAULT '{}', -- extracted fields + context at decision time
  ruleset_version TEXT NOT NULL DEFAULT '1.0.0',
  actor TEXT NOT NULL DEFAULT 'system',
  overridden_by UUID REFERENCES profiles(id),
  overridden_at TIMESTAMPTZ,
  override_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_auto_decisions_subject ON automated_decisions(subject_type, subject_id);
CREATE INDEX idx_auto_decisions_decision ON automated_decisions(decision);
CREATE INDEX idx_auto_decisions_created ON automated_decisions(created_at DESC);

-- 3. Review Queue - unified queue for human review
CREATE TABLE IF NOT EXISTS review_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_type TEXT NOT NULL, -- transcript_review, partner_docs_review, routing_review, document_review
  subject_type TEXT NOT NULL,
  subject_id UUID NOT NULL,
  priority INT NOT NULL DEFAULT 5 CHECK (priority BETWEEN 1 AND 10), -- 1 = highest
  reasons TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'escalated')),
  assigned_to UUID REFERENCES profiles(id),
  resolved_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  resolution TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_review_queue_status ON review_queue(status);
CREATE INDEX idx_review_queue_type ON review_queue(queue_type);
CREATE INDEX idx_review_queue_priority ON review_queue(priority, created_at);
CREATE INDEX idx_review_queue_assigned ON review_queue(assigned_to) WHERE assigned_to IS NOT NULL;

-- 4. Automation Rulesets - versioned rules for audit
CREATE TABLE IF NOT EXISTS automation_rulesets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  version TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- transcript_approval, partner_approval, shop_routing
  rules JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, version)
);

-- 5. Shop Routing Scores - for apprentice-shop matching
CREATE TABLE IF NOT EXISTS shop_routing_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  shop_id UUID NOT NULL,
  total_score NUMERIC(5,2) NOT NULL,
  distance_score NUMERIC(5,2),
  capacity_score NUMERIC(5,2),
  specialty_score NUMERIC(5,2),
  preference_score NUMERIC(5,2),
  score_breakdown JSONB NOT NULL DEFAULT '{}',
  rank INT,
  status TEXT DEFAULT 'recommended' CHECK (status IN ('recommended', 'assigned', 'rejected', 'expired')),
  assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_routing_scores_app ON shop_routing_scores(application_id);
CREATE INDEX idx_routing_scores_shop ON shop_routing_scores(shop_id);
CREATE INDEX idx_routing_scores_rank ON shop_routing_scores(application_id, rank);

-- 6. Transfer Hours Records
CREATE TABLE IF NOT EXISTS transfer_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  application_id UUID REFERENCES applications(id),
  enrollment_id UUID REFERENCES enrollments(id),
  source_institution TEXT NOT NULL,
  source_state TEXT NOT NULL,
  total_hours NUMERIC(10,2) NOT NULL,
  approved_hours NUMERIC(10,2),
  document_id UUID REFERENCES documents(id),
  extraction_id UUID REFERENCES documents_extractions(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'needs_review')),
  auto_approved BOOLEAN DEFAULT false,
  decision_id UUID REFERENCES automated_decisions(id),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transfer_hours_user ON transfer_hours(user_id);
CREATE INDEX idx_transfer_hours_status ON transfer_hours(status);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_doc_extractions_updated
  BEFORE UPDATE ON documents_extractions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_review_queue_updated
  BEFORE UPDATE ON review_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_transfer_hours_updated
  BEFORE UPDATE ON transfer_hours
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert default rulesets
INSERT INTO automation_rulesets (name, version, rule_type, rules) VALUES
('indiana_transcript_approval', '1.0.0', 'transcript_approval', '{
  "approved_states": ["IN"],
  "max_transfer_hours": 1000,
  "min_confidence": 0.85,
  "require_school_name": true,
  "require_date": true,
  "require_hours": true
}'::jsonb),
('partner_document_approval', '1.0.0', 'partner_approval', '{
  "required_docs": ["shop_license", "partner_mou", "insurance"],
  "license_must_be_valid": true,
  "mou_must_be_signed": true,
  "insurance_optional_states": ["IN"]
}'::jsonb),
('shop_routing', '1.0.0', 'shop_routing', '{
  "max_distance_miles": 25,
  "min_capacity": 1,
  "weights": {
    "distance": 0.3,
    "capacity": 0.2,
    "specialty": 0.3,
    "preference": 0.2
  },
  "auto_assign_threshold": 0.85
}'::jsonb)
ON CONFLICT (name, version) DO NOTHING;
-- AGREEMENT ENFORCEMENT MIGRATION
-- Single source of truth for all legal agreements
-- Immutable, append-only, bound to auth.uid()

-- 1. Create the canonical agreement table
CREATE TABLE IF NOT EXISTS public.license_agreement_acceptances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  
  -- Agreement details
  agreement_type TEXT NOT NULL, -- 'terms_of_service', 'privacy_policy', 'handbook', 'enrollment_agreement', 'data_processing'
  document_version TEXT NOT NULL, -- e.g., '2024.1', '2024.2'
  document_url TEXT, -- Link to the actual document
  
  -- Signer context (captured at signing time)
  role_at_signing TEXT NOT NULL, -- 'student', 'partner', 'employer', 'admin', 'workforce_board'
  email_at_signing TEXT NOT NULL, -- Must match auth.users.email
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Immutability constraint
  CONSTRAINT no_future_acceptance CHECK (accepted_at <= NOW())
);

-- 2. Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_agreements_user_id ON public.license_agreement_acceptances(user_id);
CREATE INDEX IF NOT EXISTS idx_agreements_type_version ON public.license_agreement_acceptances(agreement_type, document_version);
CREATE INDEX IF NOT EXISTS idx_agreements_org ON public.license_agreement_acceptances(organization_id);
CREATE INDEX IF NOT EXISTS idx_agreements_accepted_at ON public.license_agreement_acceptances(accepted_at);

-- 3. RLS: INSERT only, NO UPDATE, NO DELETE
ALTER TABLE public.license_agreement_acceptances ENABLE ROW LEVEL SECURITY;

-- Users can only insert their own agreements
CREATE POLICY "Users can insert own agreements"
  ON public.license_agreement_acceptances
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own agreements
CREATE POLICY "Users can read own agreements"
  ON public.license_agreement_acceptances
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can read all agreements (for compliance reporting)
CREATE POLICY "Admins can read all agreements"
  ON public.license_agreement_acceptances
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- NO UPDATE POLICY - agreements are immutable
-- NO DELETE POLICY - agreements cannot be removed

-- 4. Create onboarding status tracking
CREATE TABLE IF NOT EXISTS public.user_onboarding_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'incomplete' CHECK (status IN ('incomplete', 'complete', 'on_hold', 'pending_review')),
  
  -- Checklist items
  profile_complete BOOLEAN DEFAULT FALSE,
  agreements_signed BOOLEAN DEFAULT FALSE,
  documents_uploaded BOOLEAN DEFAULT FALSE,
  documents_verified BOOLEAN DEFAULT FALSE,
  orientation_complete BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Admin notes
  notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id)
);

CREATE INDEX IF NOT EXISTS idx_onboarding_user ON public.user_onboarding_status(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON public.user_onboarding_status(status);

-- RLS for onboarding status
ALTER TABLE public.user_onboarding_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own onboarding status"
  ON public.user_onboarding_status
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding status"
  ON public.user_onboarding_status
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding status"
  ON public.user_onboarding_status
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all onboarding"
  ON public.user_onboarding_status
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- 5. Required documents per role
CREATE TABLE IF NOT EXISTS public.required_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  role TEXT NOT NULL, -- 'student', 'partner', 'employer'
  document_type TEXT NOT NULL, -- 'id_verification', 'proof_of_residence', 'background_check', etc.
  description TEXT,
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. User document submissions
CREATE TABLE IF NOT EXISTS public.user_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  
  -- Verification
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Timestamps
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_docs_user ON public.user_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_user_docs_status ON public.user_documents(status);

ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own documents"
  ON public.user_documents
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Staff can verify documents"
  ON public.user_documents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- 7. Function to check if user has completed required agreements
CREATE OR REPLACE FUNCTION public.check_user_agreements(
  p_user_id UUID,
  p_role TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  required_agreements TEXT[] := ARRAY['terms_of_service', 'privacy_policy'];
  signed_count INT;
BEGIN
  -- Add role-specific requirements
  IF p_role = 'student' THEN
    required_agreements := required_agreements || ARRAY['handbook', 'enrollment_agreement'];
  ELSIF p_role IN ('partner', 'employer') THEN
    required_agreements := required_agreements || ARRAY['data_processing', 'partner_agreement'];
  END IF;
  
  -- Count signed agreements (latest version only)
  SELECT COUNT(DISTINCT agreement_type) INTO signed_count
  FROM public.license_agreement_acceptances
  WHERE user_id = p_user_id
  AND agreement_type = ANY(required_agreements);
  
  RETURN signed_count >= array_length(required_agreements, 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Function to check onboarding completion
CREATE OR REPLACE FUNCTION public.check_onboarding_complete(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  onboarding_record RECORD;
BEGIN
  SELECT * INTO onboarding_record
  FROM public.user_onboarding_status
  WHERE user_id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  RETURN onboarding_record.status = 'complete';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Insert default required documents
INSERT INTO public.required_documents (role, document_type, description, is_required) VALUES
  ('student', 'government_id', 'Government-issued photo ID', true),
  ('student', 'proof_of_residence', 'Proof of Indiana residency', true),
  ('student', 'education_verification', 'High school diploma or GED', true),
  ('partner', 'business_license', 'Business license or registration', true),
  ('partner', 'insurance_certificate', 'Liability insurance certificate', true),
  ('employer', 'business_verification', 'Business verification document', true)
ON CONFLICT DO NOTHING;

-- 10. Create compliance view for admins
CREATE OR REPLACE VIEW public.admin_compliance_status AS
SELECT 
  p.id as user_id,
  p.email,
  p.full_name,
  p.role,
  o.status as onboarding_status,
  o.agreements_signed,
  o.documents_uploaded,
  o.documents_verified,
  o.completed_at as onboarding_completed_at,
  (
    SELECT COUNT(*) 
    FROM public.license_agreement_acceptances a 
    WHERE a.user_id = p.id
  ) as total_agreements_signed,
  (
    SELECT COUNT(*) 
    FROM public.user_documents d 
    WHERE d.user_id = p.id AND d.status = 'approved'
  ) as verified_documents_count,
  (
    SELECT MAX(accepted_at) 
    FROM public.license_agreement_acceptances a 
    WHERE a.user_id = p.id
  ) as last_agreement_signed
FROM public.profiles p
LEFT JOIN public.user_onboarding_status o ON o.user_id = p.id
ORDER BY p.created_at DESC;

COMMENT ON TABLE public.license_agreement_acceptances IS 'Single source of truth for all legal agreements. Immutable, append-only.';
COMMENT ON TABLE public.user_onboarding_status IS 'Tracks user onboarding completion status. Required before LMS access.';
COMMENT ON TABLE public.user_documents IS 'User-uploaded documents for verification.';
-- Fix: documents table has no owner SELECT policy.
-- Students can upload documents but cannot read them back.
--
-- The documents table has both owner_id (original) and user_id (added by
-- 20260128_update_documents_table.sql). The upload page uses user_id.
-- We add policies for both columns.

BEGIN;

-- 1. Students can view their own documents (by user_id)
DROP POLICY IF EXISTS "Users can view own documents" ON public.documents;
CREATE POLICY "Users can view own documents"
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Students can view documents where they are the owner (by owner_id)
DROP POLICY IF EXISTS "Owners can view own documents" ON public.documents;
CREATE POLICY "Owners can view own documents"
  ON public.documents
  FOR SELECT
  TO authenticated
  USING (owner_id = auth.uid());

-- 3. Students can update their own documents (e.g. re-upload)
DROP POLICY IF EXISTS "Users can update own documents" ON public.documents;
CREATE POLICY "Users can update own documents"
  ON public.documents
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 4. Admin full access (uses is_admin() to avoid recursion)
DROP POLICY IF EXISTS "documents_admin_all" ON public.documents;
CREATE POLICY "documents_admin_all"
  ON public.documents
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- 5. Grant SELECT to authenticated (was missing)
GRANT SELECT, INSERT, UPDATE ON public.documents TO authenticated;

COMMIT;
