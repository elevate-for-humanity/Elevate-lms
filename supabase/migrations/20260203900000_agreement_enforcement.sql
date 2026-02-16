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
ALTER TABLE public.license_agreement_acceptances ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_agreements_user_id ON public.license_agreement_acceptances(user_id);
CREATE INDEX IF NOT EXISTS idx_agreements_type_version ON public.license_agreement_acceptances(agreement_type, document_version);
ALTER TABLE public.license_agreement_acceptances ADD COLUMN IF NOT EXISTS organization_id TEXT;
CREATE INDEX IF NOT EXISTS idx_agreements_org ON public.license_agreement_acceptances(organization_id);
ALTER TABLE public.license_agreement_acceptances ADD COLUMN IF NOT EXISTS accepted_at TEXT;
CREATE INDEX IF NOT EXISTS idx_agreements_accepted_at ON public.license_agreement_acceptances(accepted_at);

-- 3. RLS: INSERT only, NO UPDATE, NO DELETE
ALTER TABLE public.license_agreement_acceptances ENABLE ROW LEVEL SECURITY;

-- Users can only insert their own agreements
DROP POLICY IF EXISTS "Users can insert own agreements" ON public.license_agreement_acceptances;
CREATE POLICY "Users can insert own agreements"
  ON public.license_agreement_acceptances
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own agreements
DROP POLICY IF EXISTS "Users can read own agreements" ON public.license_agreement_acceptances;
CREATE POLICY "Users can read own agreements"
  ON public.license_agreement_acceptances
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can read all agreements (for compliance reporting)
DROP POLICY IF EXISTS "Admins can read all agreements" ON public.license_agreement_acceptances;
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

ALTER TABLE public.user_onboarding_status ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_onboarding_user ON public.user_onboarding_status(user_id);
ALTER TABLE public.user_onboarding_status ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON public.user_onboarding_status(status);

-- RLS for onboarding status
ALTER TABLE public.user_onboarding_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own onboarding status" ON public.user_onboarding_status;
CREATE POLICY "Users can read own onboarding status"
  ON public.user_onboarding_status
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own onboarding status" ON public.user_onboarding_status;
CREATE POLICY "Users can update own onboarding status"
  ON public.user_onboarding_status
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own onboarding status" ON public.user_onboarding_status;
CREATE POLICY "Users can insert own onboarding status"
  ON public.user_onboarding_status
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all onboarding" ON public.user_onboarding_status;
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

ALTER TABLE public.user_documents ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_user_docs_user ON public.user_documents(user_id);
ALTER TABLE public.user_documents ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_user_docs_status ON public.user_documents(status);

ALTER TABLE public.user_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own documents" ON public.user_documents;
CREATE POLICY "Users can manage own documents"
  ON public.user_documents
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff can verify documents" ON public.user_documents;
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
