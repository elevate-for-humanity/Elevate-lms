-- Partner Documents System
-- Automated approval based on document completion

-- Ensure partner_documents has required columns if table already exists
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_documents') THEN
    ALTER TABLE partner_documents ADD COLUMN IF NOT EXISTS partner_id UUID;
    ALTER TABLE partner_documents ADD COLUMN IF NOT EXISTS document_type VARCHAR(50);
    ALTER TABLE partner_documents ADD COLUMN IF NOT EXISTS program_id VARCHAR(50);
    ALTER TABLE partner_documents ADD COLUMN IF NOT EXISTS state VARCHAR(50);
    ALTER TABLE partner_documents ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
  END IF;
END $$;

-- Partner Documents table
CREATE TABLE IF NOT EXISTS partner_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL ,
  
  -- Document classification
  document_type VARCHAR(50) NOT NULL, -- 'mou', 'w9', 'business_license', 'insurance_coi', 'establishment_license'
  program_id VARCHAR(50), -- NULL = applies to all programs, or specific like 'barber'
  state VARCHAR(50), -- State this document applies to
  
  -- File info
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type VARCHAR(100), -- MIME type
  
  -- Status workflow
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  rejection_reason TEXT,
  
  -- Expiration tracking
  expires_at DATE,
  
  -- Timestamps
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Document Requirements table (defines what's needed per state/program)
CREATE TABLE IF NOT EXISTS partner_document_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Scope
  state VARCHAR(50) NOT NULL, -- e.g., 'Indiana', 'ALL'
  program_id VARCHAR(50) NOT NULL, -- e.g., 'barber', 'ALL'
  
  -- Requirement
  document_type VARCHAR(50) NOT NULL,
  document_name VARCHAR(100) NOT NULL, -- Human readable name
  description TEXT,
  is_required BOOLEAN DEFAULT true,
  
  -- Validation rules
  allowed_file_types TEXT[], -- e.g., ['application/pdf', 'image/jpeg']
  max_file_size_mb INTEGER DEFAULT 10,
  requires_expiration BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now()
  
  UNIQUE(state, program_id, document_type)
);

-- Update partners table with status workflow
ALTER TABLE partners ADD COLUMN IF NOT EXISTS account_status VARCHAR(20) DEFAULT 'draft' 
  CHECK (account_status IN ('draft', 'submitted', 'conditional_access', 'active', 'restricted', 'suspended'));

-- Seed document requirements for Indiana Barber
INSERT INTO partner_document_requirements (state, program_id, document_type, document_name, description, is_required, allowed_file_types, requires_expiration)
VALUES 
  ('Indiana', 'barber', 'mou', 'Partner MOU', 'Signed Memorandum of Understanding', true, ARRAY['application/pdf'], false),
  ('Indiana', 'barber', 'w9', 'IRS W-9', 'Completed W-9 tax form', true, ARRAY['application/pdf'], false),
  ('Indiana', 'barber', 'business_license', 'Business License', 'Proof of business formation or license', true, ARRAY['application/pdf', 'image/jpeg', 'image/png'], false),
  ('Indiana', 'barber', 'insurance_coi', 'Certificate of Insurance', 'Proof of liability insurance', true, ARRAY['application/pdf'], true),
  ('Indiana', 'barber', 'establishment_license', 'Barber Shop License', 'Indiana State Board barber establishment license', true, ARRAY['application/pdf', 'image/jpeg', 'image/png'], true),
  ('ALL', 'ALL', 'mou', 'Partner MOU', 'Signed Memorandum of Understanding', true, ARRAY['application/pdf'], false),
  ('ALL', 'ALL', 'w9', 'IRS W-9', 'Completed W-9 tax form', true, ARRAY['application/pdf'], false)
ON CONFLICT (state, program_id, document_type) DO NOTHING;

-- Enable RLS
ALTER TABLE partner_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_document_requirements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for partner_documents
DROP POLICY IF EXISTS "Partners can view own documents" ON partner_documents;
CREATE POLICY "Partners can view own documents"
  ON partner_documents FOR SELECT
  USING (
    partner_id IN (SELECT partner_id FROM partner_users WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Partners can upload documents" ON partner_documents;
CREATE POLICY "Partners can upload documents"
  ON partner_documents FOR INSERT
  WITH CHECK (
    partner_id IN (SELECT partner_id FROM partner_users WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can manage all documents" ON partner_documents;
CREATE POLICY "Admins can manage all documents"
  ON partner_documents FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- RLS Policies for requirements (public read)
DROP POLICY IF EXISTS "Anyone can view document requirements" ON partner_document_requirements;
CREATE POLICY "Anyone can view document requirements"
  ON partner_document_requirements FOR SELECT
  USING (true);

-- Indexes
ALTER TABLE partner_documents ADD COLUMN IF NOT EXISTS partner_id UUID;
CREATE INDEX IF NOT EXISTS idx_partner_documents_partner ON partner_documents(partner_id);
ALTER TABLE partner_documents ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_partner_documents_status ON partner_documents(status);
ALTER TABLE partner_documents ADD COLUMN IF NOT EXISTS document_type TEXT;
CREATE INDEX IF NOT EXISTS idx_partner_documents_type ON partner_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_partner_doc_reqs_state_program ON partner_document_requirements(state, program_id);

-- Function to check if partner has all required documents
CREATE OR REPLACE FUNCTION check_partner_document_completion(p_partner_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_state VARCHAR(50);
  v_programs TEXT[];
  v_missing_count INTEGER;
BEGIN
  -- Get partner's state
  SELECT state INTO v_state FROM partners WHERE id = p_partner_id;
  
  -- Get partner's programs
  SELECT ARRAY_AGG(program_id) INTO v_programs 
  FROM partner_program_access 
  WHERE partner_id = p_partner_id AND revoked_at IS NULL;
  
  -- Count missing required documents
  SELECT COUNT(*) INTO v_missing_count
  FROM partner_document_requirements req
  WHERE (req.state = v_state OR req.state = 'ALL')
    AND (req.program_id = ANY(v_programs) OR req.program_id = 'ALL')
    AND req.is_required = true
    AND NOT EXISTS (
      SELECT 1 FROM partner_documents doc
      WHERE doc.partner_id = p_partner_id
        AND doc.document_type = req.document_type
        AND doc.status = 'accepted'
        AND (doc.expires_at IS NULL OR doc.expires_at > CURRENT_DATE)
    );
  
  RETURN v_missing_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-activate partner if documents complete
CREATE OR REPLACE FUNCTION auto_activate_partner()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run when document is accepted
  IF NEW.status = 'accepted' THEN
    -- Check if all documents are now complete
    IF check_partner_document_completion(NEW.partner_id) THEN
      -- Activate the partner
      UPDATE partners 
      SET account_status = 'active', updated_at = now()
      WHERE id = NEW.partner_id AND account_status != 'active';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-activate on document acceptance
DROP TRIGGER IF EXISTS trigger_auto_activate_partner ON partner_documents;
CREATE TRIGGER trigger_auto_activate_partner
  AFTER INSERT OR UPDATE OF status ON partner_documents
  FOR EACH ROW
  EXECUTE FUNCTION auto_activate_partner();
