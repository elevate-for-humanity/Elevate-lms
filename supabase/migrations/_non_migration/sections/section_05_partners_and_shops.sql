-- Partner Documents System
-- Automated approval based on document completion

-- Partner Documents table
CREATE TABLE IF NOT EXISTS partner_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  
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
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
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
CREATE POLICY "Partners can view own documents"
  ON partner_documents FOR SELECT
  USING (
    partner_id IN (SELECT partner_id FROM partner_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Partners can upload documents"
  ON partner_documents FOR INSERT
  WITH CHECK (
    partner_id IN (SELECT partner_id FROM partner_users WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all documents"
  ON partner_documents FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- RLS Policies for requirements (public read)
CREATE POLICY "Anyone can view document requirements"
  ON partner_document_requirements FOR SELECT
  USING (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_documents_partner ON partner_documents(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_documents_status ON partner_documents(status);
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
-- Partner Shop System
-- Supports program-scoped access control for employer partners (e.g., Barber shops)

-- Partners (the shop entity)
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  dba VARCHAR(255),
  ein VARCHAR(20),
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  website VARCHAR(255),
  
  -- Capacity and credentials
  apprentice_capacity INTEGER DEFAULT 1,
  schedule_notes TEXT,
  license_number VARCHAR(100),
  license_state VARCHAR(50),
  license_expiry DATE,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id)
);

-- Partner Applications (onboarding submissions)
CREATE TABLE IF NOT EXISTS partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Shop info
  shop_name VARCHAR(255) NOT NULL,
  dba VARCHAR(255),
  ein VARCHAR(20),
  owner_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  zip VARCHAR(20) NOT NULL,
  website VARCHAR(255),
  
  -- Programs requested (stored as array)
  programs_requested TEXT[] NOT NULL,
  
  -- Capacity and details
  apprentice_capacity INTEGER DEFAULT 1,
  schedule_notes TEXT,
  license_number VARCHAR(100),
  license_state VARCHAR(50),
  license_expiry DATE,
  additional_notes TEXT,
  
  -- Agreement
  agreed_to_terms BOOLEAN DEFAULT false,
  agreed_at TIMESTAMPTZ,
  
  -- Status workflow
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'withdrawn')),
  status_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  
  -- Link to created partner (after approval)
  partner_id UUID REFERENCES partners(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Partner Users (link auth user to partner + role)
CREATE TABLE IF NOT EXISTS partner_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('partner_admin', 'partner_staff')),
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  
  -- Invitation tracking
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  activated_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, partner_id)
);

-- Partner Program Access (entitlements)
CREATE TABLE IF NOT EXISTS partner_program_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  program_id VARCHAR(100) NOT NULL, -- e.g., 'barber', 'cna', 'hvac'
  
  -- Permissions
  can_view_apprentices BOOLEAN DEFAULT true,
  can_enter_progress BOOLEAN DEFAULT true,
  can_view_reports BOOLEAN DEFAULT true,
  
  -- Timestamps
  granted_at TIMESTAMPTZ DEFAULT now(),
  granted_by UUID REFERENCES auth.users(id),
  revoked_at TIMESTAMPTZ,
  
  UNIQUE(partner_id, program_id)
);

-- Progress Entries (hours/attendance tracking)
CREATE TABLE IF NOT EXISTS progress_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Links
  apprentice_id UUID NOT NULL REFERENCES auth.users(id),
  partner_id UUID NOT NULL REFERENCES partners(id),
  program_id VARCHAR(100) NOT NULL,
  
  -- Progress data
  week_ending DATE NOT NULL, -- Always a Friday
  hours_worked DECIMAL(5,2) NOT NULL CHECK (hours_worked >= 0 AND hours_worked <= 168),
  tasks_completed TEXT,
  notes TEXT,
  
  -- Verification
  submitted_by UUID NOT NULL REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ DEFAULT now(),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'verified', 'disputed')),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Prevent duplicate entries for same apprentice/week
  UNIQUE(apprentice_id, partner_id, program_id, week_ending)
);

-- Audit Log for partner actions
CREATE TABLE IF NOT EXISTS partner_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partners(id),
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_applications_status ON partner_applications(status);
CREATE INDEX IF NOT EXISTS idx_partner_applications_email ON partner_applications(email);
CREATE INDEX IF NOT EXISTS idx_partner_users_user_id ON partner_users(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_users_partner_id ON partner_users(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_program_access_partner ON partner_program_access(partner_id);
CREATE INDEX IF NOT EXISTS idx_progress_entries_apprentice ON progress_entries(apprentice_id);
CREATE INDEX IF NOT EXISTS idx_progress_entries_partner ON progress_entries(partner_id);
CREATE INDEX IF NOT EXISTS idx_progress_entries_week ON progress_entries(week_ending);
CREATE INDEX IF NOT EXISTS idx_partner_audit_log_partner ON partner_audit_log(partner_id);

-- Enable RLS
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_program_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Partners: Partner users can view their own partner
CREATE POLICY "Partner users can view own partner"
  ON partners FOR SELECT
  USING (
    id IN (SELECT partner_id FROM partner_users WHERE user_id = auth.uid())
  );

-- Partners: Admins can manage all
CREATE POLICY "Admins can manage partners"
  ON partners FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Partner Applications: Public can insert (onboarding)
CREATE POLICY "Public can submit partner applications"
  ON partner_applications FOR INSERT
  WITH CHECK (true);

-- Partner Applications: Applicant can view own
CREATE POLICY "Applicants can view own applications"
  ON partner_applications FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Partner Applications: Admins can manage all
CREATE POLICY "Admins can manage partner applications"
  ON partner_applications FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- Partner Users: Users can view own record
CREATE POLICY "Users can view own partner_user record"
  ON partner_users FOR SELECT
  USING (user_id = auth.uid());

-- Partner Users: Partner admins can manage their partner's users
CREATE POLICY "Partner admins can manage partner users"
  ON partner_users FOR ALL
  USING (
    partner_id IN (
      SELECT partner_id FROM partner_users 
      WHERE user_id = auth.uid() AND role = 'partner_admin'
    )
  );

-- Partner Program Access: Partner users can view their entitlements
CREATE POLICY "Partner users can view own program access"
  ON partner_program_access FOR SELECT
  USING (
    partner_id IN (SELECT partner_id FROM partner_users WHERE user_id = auth.uid())
  );

-- Progress Entries: Partner users can manage entries for their partner + authorized programs
CREATE POLICY "Partner users can manage progress entries"
  ON progress_entries FOR ALL
  USING (
    partner_id IN (SELECT partner_id FROM partner_users WHERE user_id = auth.uid())
    AND program_id IN (
      SELECT program_id FROM partner_program_access ppa
      JOIN partner_users pu ON ppa.partner_id = pu.partner_id
      WHERE pu.user_id = auth.uid()
    )
  );

-- Audit Log: Partner users can view their partner's audit log
CREATE POLICY "Partner users can view own audit log"
  ON partner_audit_log FOR SELECT
  USING (
    partner_id IN (SELECT partner_id FROM partner_users WHERE user_id = auth.uid())
  );

-- Audit Log: System can insert
CREATE POLICY "System can insert audit log"
  ON partner_audit_log FOR INSERT
  WITH CHECK (true);
-- Phase 2: Atomic Partner Approval
-- Two-phase approval: DB-only first, then auth linking

-- ============================================
-- 1. Partner Approval Status Enum
-- ============================================
DO $$ BEGIN
  CREATE TYPE partner_approval_status AS ENUM (
    'pending',
    'approved_pending_user',  -- DB approved, waiting for auth user creation
    'approved',               -- Fully approved with auth user linked
    'denied',
    'suspended'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Add approval_status column if not exists
ALTER TABLE partner_applications 
  ADD COLUMN IF NOT EXISTS approval_status partner_approval_status DEFAULT 'pending';

-- ============================================
-- 2. RPC: rpc_approve_partner (Phase 1 - DB Only)
-- ============================================
CREATE OR REPLACE FUNCTION rpc_approve_partner(
  p_partner_application_id UUID,
  p_admin_user_id UUID,
  p_partner_email TEXT,
  p_program_ids UUID[],
  p_idempotency_key TEXT,
  p_profile JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
  v_existing_result JSONB;
  v_application RECORD;
  v_partner_id UUID;
  v_program_id UUID;
BEGIN
  -- ========================================
  -- IDEMPOTENCY CHECK
  -- ========================================
  SELECT result INTO v_existing_result
  FROM idempotency_keys
  WHERE user_id = p_admin_user_id
    AND operation = 'approve_partner'
    AND idempotency_key = p_idempotency_key;

  IF v_existing_result IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'idempotent', true,
      'partner_id', v_existing_result->>'partner_id',
      'message', 'Partner approval already processed'
    );
  END IF;

  -- ========================================
  -- LOCK & VALIDATE APPLICATION
  -- ========================================
  SELECT * INTO v_application
  FROM partner_applications
  WHERE id = p_partner_application_id
  FOR UPDATE;

  IF v_application IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'NOT_FOUND',
      'message', 'Partner application not found'
    );
  END IF;

  IF v_application.status NOT IN ('pending') AND v_application.approval_status NOT IN ('pending') THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'ALREADY_PROCESSED',
      'message', format('Application already processed with status: %s', v_application.status)
    );
  END IF;

  -- ========================================
  -- STEP 1: Create partner entity
  -- ========================================
  INSERT INTO partners (
    name,
    dba,
    ein,
    owner_name,
    email,
    phone,
    address_line1,
    address_line2,
    city,
    state,
    zip,
    website,
    apprentice_capacity,
    schedule_notes,
    license_number,
    license_state,
    license_expiry,
    status,
    account_status,
    approved_at
  ) VALUES (
    v_application.shop_name,
    v_application.dba,
    v_application.ein,
    v_application.owner_name,
    COALESCE(p_partner_email, v_application.contact_email),
    v_application.phone,
    v_application.address_line1,
    v_application.address_line2,
    v_application.city,
    v_application.state,
    v_application.zip,
    v_application.website,
    v_application.apprentice_capacity,
    v_application.schedule_notes,
    v_application.license_number,
    v_application.license_state,
    v_application.license_expiry,
    'active',
    'pending_user',  -- Not fully active until auth user linked
    NOW()
  )
  RETURNING id INTO v_partner_id;

  -- ========================================
  -- STEP 2: Create program access entries
  -- ========================================
  IF p_program_ids IS NOT NULL AND array_length(p_program_ids, 1) > 0 THEN
    FOREACH v_program_id IN ARRAY p_program_ids
    LOOP
      INSERT INTO partner_program_access (
        partner_id,
        program_id,
        can_view_apprentices,
        can_enter_progress,
        can_view_reports,
        created_at
      ) VALUES (
        v_partner_id,
        v_program_id,
        true,
        true,
        true,
        NOW()
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  ELSE
    -- Use programs from application if not specified
    IF v_application.programs_requested IS NOT NULL THEN
      FOR v_program_id IN
        SELECT p.id FROM programs p
        WHERE p.slug = ANY(
          SELECT jsonb_array_elements_text(v_application.programs_requested::jsonb)
        )
      LOOP
        INSERT INTO partner_program_access (
          partner_id,
          program_id,
          can_view_apprentices,
          can_enter_progress,
          can_view_reports,
          created_at
        ) VALUES (
          v_partner_id,
          v_program_id,
          true,
          true,
          true,
          NOW()
        )
        ON CONFLICT DO NOTHING;
      END LOOP;
    END IF;
  END IF;

  -- ========================================
  -- STEP 3: Update application status
  -- ========================================
  UPDATE partner_applications
  SET 
    status = 'approved',
    approval_status = 'approved_pending_user',
    reviewed_at = NOW(),
    reviewed_by = p_admin_user_id,
    partner_id = v_partner_id,
    updated_at = NOW()
  WHERE id = p_partner_application_id;

  -- ========================================
  -- STEP 4: Create placeholder partner_user entry
  -- ========================================
  INSERT INTO partner_users (
    partner_id,
    user_id,
    role,
    status,
    created_at
  ) VALUES (
    v_partner_id,
    NULL,  -- Will be linked when auth user is created
    'partner_admin',
    'pending_activation',
    NOW()
  )
  ON CONFLICT DO NOTHING;

  -- ========================================
  -- STEP 5: Upsert profile (if email matches existing user)
  -- ========================================
  -- This is a placeholder - actual profile creation happens after auth user
  
  -- ========================================
  -- STEP 6: Write audit log
  -- ========================================
  INSERT INTO audit_logs (
    action,
    entity_type,
    entity_id,
    actor_id,
    details,
    created_at
  ) VALUES (
    'partner_approved',
    'partner',
    v_partner_id,
    p_admin_user_id,
    jsonb_build_object(
      'application_id', p_partner_application_id,
      'partner_email', p_partner_email,
      'program_ids', p_program_ids,
      'idempotency_key', p_idempotency_key,
      'phase', 'db_only'
    ),
    NOW()
  );

  -- ========================================
  -- STEP 7: Record idempotency key
  -- ========================================
  INSERT INTO idempotency_keys (user_id, operation, idempotency_key, result)
  VALUES (
    p_admin_user_id,
    'approve_partner',
    p_idempotency_key,
    jsonb_build_object(
      'partner_id', v_partner_id,
      'application_id', p_partner_application_id
    )
  );

  -- ========================================
  -- SUCCESS
  -- ========================================
  RETURN jsonb_build_object(
    'success', true,
    'partner_id', v_partner_id,
    'application_id', p_partner_application_id,
    'status', 'approved_pending_user',
    'message', 'Partner approved. Auth user creation required to complete.'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'code', SQLSTATE,
    'message', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. RPC: rpc_link_partner_user (Phase 2 - Auth Linking)
-- ============================================
CREATE OR REPLACE FUNCTION rpc_link_partner_user(
  p_partner_id UUID,
  p_auth_user_id UUID,
  p_email TEXT,
  p_idempotency_key TEXT
) RETURNS JSONB AS $$
DECLARE
  v_existing_result JSONB;
  v_partner RECORD;
  v_application_id UUID;
BEGIN
  -- ========================================
  -- IDEMPOTENCY CHECK
  -- ========================================
  SELECT result INTO v_existing_result
  FROM idempotency_keys
  WHERE user_id = p_auth_user_id
    AND operation = 'link_partner_user'
    AND idempotency_key = p_idempotency_key;

  IF v_existing_result IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'idempotent', true,
      'partner_id', v_existing_result->>'partner_id',
      'message', 'Partner user already linked'
    );
  END IF;

  -- ========================================
  -- LOCK & VALIDATE PARTNER
  -- ========================================
  SELECT * INTO v_partner
  FROM partners
  WHERE id = p_partner_id
  FOR UPDATE;

  IF v_partner IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'NOT_FOUND',
      'message', 'Partner not found'
    );
  END IF;

  -- ========================================
  -- STEP 1: Update partner_users with auth user
  -- ========================================
  UPDATE partner_users
  SET 
    user_id = p_auth_user_id,
    status = 'active',
    activated_at = NOW(),
    updated_at = NOW()
  WHERE partner_id = p_partner_id
    AND (user_id IS NULL OR user_id = p_auth_user_id);

  -- If no row was updated, insert new one
  IF NOT FOUND THEN
    INSERT INTO partner_users (
      partner_id,
      user_id,
      role,
      status,
      activated_at,
      created_at
    ) VALUES (
      p_partner_id,
      p_auth_user_id,
      'partner_admin',
      'active',
      NOW(),
      NOW()
    )
    ON CONFLICT (partner_id, user_id) DO UPDATE
    SET status = 'active', activated_at = NOW();
  END IF;

  -- ========================================
  -- STEP 2: Upsert profile
  -- ========================================
  INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    p_auth_user_id,
    p_email,
    v_partner.owner_name,
    'partner_admin',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    role = 'partner_admin',
    updated_at = NOW();

  -- ========================================
  -- STEP 3: Update partner account status
  -- ========================================
  UPDATE partners
  SET 
    account_status = 'active',
    updated_at = NOW()
  WHERE id = p_partner_id;

  -- ========================================
  -- STEP 4: Update application approval status
  -- ========================================
  UPDATE partner_applications
  SET 
    approval_status = 'approved',
    updated_at = NOW()
  WHERE partner_id = p_partner_id;

  -- Get application ID for audit
  SELECT id INTO v_application_id
  FROM partner_applications
  WHERE partner_id = p_partner_id
  LIMIT 1;

  -- ========================================
  -- STEP 5: Write audit log
  -- ========================================
  INSERT INTO audit_logs (
    action,
    entity_type,
    entity_id,
    actor_id,
    details,
    created_at
  ) VALUES (
    'partner_user_linked',
    'partner',
    p_partner_id,
    p_auth_user_id,
    jsonb_build_object(
      'application_id', v_application_id,
      'email', p_email,
      'idempotency_key', p_idempotency_key,
      'phase', 'auth_linked'
    ),
    NOW()
  );

  -- ========================================
  -- STEP 6: Record idempotency key
  -- ========================================
  INSERT INTO idempotency_keys (user_id, operation, idempotency_key, result)
  VALUES (
    p_auth_user_id,
    'link_partner_user',
    p_idempotency_key,
    jsonb_build_object(
      'partner_id', p_partner_id,
      'linked', true
    )
  );

  -- ========================================
  -- SUCCESS
  -- ========================================
  RETURN jsonb_build_object(
    'success', true,
    'partner_id', p_partner_id,
    'user_id', p_auth_user_id,
    'status', 'approved',
    'message', 'Partner user linked successfully'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'code', SQLSTATE,
    'message', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. Grant Permissions
-- ============================================
GRANT EXECUTE ON FUNCTION rpc_approve_partner TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION rpc_link_partner_user TO authenticated, service_role;

-- ============================================
-- 5. Documentation
-- ============================================
COMMENT ON FUNCTION rpc_approve_partner IS 
'Phase 1 of partner approval. Creates partner entity, program access, and updates 
application status to approved_pending_user. Does NOT create auth user.
Idempotent via idempotency_key. All writes atomic.';

COMMENT ON FUNCTION rpc_link_partner_user IS
'Phase 2 of partner approval. Links auth user to partner, updates profile,
and finalizes approval status to approved. Called after auth user creation.
Idempotent via idempotency_key. All writes atomic.';

COMMENT ON TYPE partner_approval_status IS
'Partner approval workflow states:
- pending: Awaiting admin review
- approved_pending_user: DB approved, auth user not yet created
- approved: Fully approved with auth user linked
- denied: Application rejected
- suspended: Partner access suspended';
-- Barber Webhook Automation: Create barber_subscriptions table and add tracking fields
-- Ensures idempotent email sending and proper record linking

-- 1. Create barber_subscriptions table (stores Stripe subscription details for barber program)
CREATE TABLE IF NOT EXISTS barber_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  enrollment_id UUID,
  apprentice_id UUID,
  
  -- Stripe identifiers
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_checkout_session_id TEXT,
  
  -- Customer info
  customer_email TEXT,
  customer_name TEXT,
  
  -- Subscription status
  status TEXT DEFAULT 'active',
  
  -- Payment details
  setup_fee_paid BOOLEAN DEFAULT false,
  setup_fee_amount INTEGER,
  weekly_payment_cents INTEGER,
  weeks_remaining INTEGER,
  hours_per_week INTEGER DEFAULT 40,
  transferred_hours_verified INTEGER DEFAULT 0,
  
  -- Billing dates
  billing_cycle_anchor TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  
  -- Email tracking (for idempotency)
  welcome_email_sent_at TIMESTAMPTZ,
  milady_email_sent_at TIMESTAMPTZ,
  dashboard_invite_sent_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add columns to apprentices for reverse lookup
ALTER TABLE apprentices
ADD COLUMN IF NOT EXISTS barber_subscription_id UUID,
ADD COLUMN IF NOT EXISTS mou_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS dashboard_invite_sent_at TIMESTAMPTZ;

-- 3. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_barber_subscriptions_user_id ON barber_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_barber_subscriptions_stripe_sub ON barber_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_apprentices_user_id ON apprentices(user_id);

-- 4. Enable RLS
ALTER TABLE barber_subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies
CREATE POLICY "Users can view own subscriptions"
  ON barber_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role full access"
  ON barber_subscriptions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
-- Add geocoding columns to shops table for distance-based routing

ALTER TABLE shops ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE shops ADD COLUMN IF NOT EXISTS geocoded_at TIMESTAMPTZ;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS geocode_source VARCHAR(20); -- 'google', 'mapbox', 'manual'

-- Index for spatial queries
CREATE INDEX IF NOT EXISTS idx_shops_coords ON shops (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Track geocoding failures
ALTER TABLE shops ADD COLUMN IF NOT EXISTS geocode_failed_at TIMESTAMPTZ;
ALTER TABLE shops ADD COLUMN IF NOT EXISTS geocode_error TEXT;

COMMENT ON COLUMN shops.latitude IS 'Latitude coordinate for distance calculations';
COMMENT ON COLUMN shops.longitude IS 'Longitude coordinate for distance calculations';
COMMENT ON COLUMN shops.geocode_source IS 'Source of geocoding: google, mapbox, or manual';
-- Audit trail for partner CSV exports
CREATE TABLE IF NOT EXISTS partner_export_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  shop_ids UUID[] NOT NULL DEFAULT '{}',
  row_count INTEGER NOT NULL DEFAULT 0,
  export_type TEXT NOT NULL DEFAULT 'completions_csv',
  exported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_partner_export_logs_user ON partner_export_logs(user_id);
CREATE INDEX idx_partner_export_logs_exported_at ON partner_export_logs(exported_at DESC);

-- RLS: only admins and the exporting user can read their own logs
ALTER TABLE partner_export_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own export logs"
  ON partner_export_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own export logs"
  ON partner_export_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
-- 20260214_partner_visibility_policies.sql
--
-- Partner visibility on enrollments, lesson_progress, certificates.
-- Also adds tenant-scoped policies to shops and shop_staff.
--
-- Scope chain (all direct tenant_id checks, no cross-table tenant joins):
--   auth.uid() -> profiles (role gate)
--   -> shop_staff (active + tenant_id match)
--   -> shops (active + tenant_id match)
--   -> apprentice_placements (tenant_id match)
--   -> student_id -> target table (tenant_id match)
--
-- Enforces per policy:
--   1. Target row tenant_id = caller's tenant
--   2. Caller has partner/admin/super_admin role
--   3. Caller's shop_staff row is active AND same tenant
--   4. Shop is active
--   5. Student is placed at that shop
--
-- Relationship table write-lock audit (2026-02-14):
--   shops:                  No non-admin write policies. Blocked.
--   shop_staff:             No non-admin write policies. Blocked.
--   apprentice_placements:  Only admin write policy. Blocked for partners.
--   All three have RLS enabled and enforced.

-- ============================================================
-- shops: add tenant-scoped policies
-- ============================================================

-- Partners can read their own shops (via shop_staff membership)
CREATE POLICY "shops_partner_read" ON shops
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM shop_staff ss
      WHERE ss.shop_id = shops.id
        AND ss.user_id = auth.uid()
        AND ss.active = true
    )
  );

-- Admin can manage shops within their tenant
CREATE POLICY "shops_admin_all" ON shops
  FOR ALL TO authenticated
  USING (
    (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- shop_staff: add tenant-scoped admin write policy
-- ============================================================

-- Existing SELECT policy (shop_staff_read) uses is_admin() + user_id check.
-- Add tenant-scoped admin write policy.
CREATE POLICY "shop_staff_admin_write" ON shop_staff
  FOR ALL TO authenticated
  USING (
    (public.is_super_admin() OR tenant_id = public.get_current_tenant_id())
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'super_admin')
    )
  );

-- ============================================================
-- enrollments: partner can read their placed students' enrollments
-- ============================================================

CREATE POLICY "enrollments_partner_read" ON training_enrollments
  FOR SELECT TO authenticated
  USING (
    -- Tenant match on target row (direct column, O(1))
    tenant_id = public.get_current_tenant_id()
    -- Caller is a partner-eligible role
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('partner', 'admin', 'super_admin')
    )
    -- Student is placed at caller's active shop (all tables now have tenant_id)
    AND EXISTS (
      SELECT 1 FROM apprentice_placements ap
      JOIN shop_staff ss ON ss.shop_id = ap.shop_id
        AND ss.tenant_id = ap.tenant_id
      JOIN shops s ON s.id = ss.shop_id
        AND s.tenant_id = ss.tenant_id
      WHERE ap.student_id = training_enrollments.user_id
        AND ss.user_id = auth.uid()
        AND ss.active = true
        AND s.active = true
    )
  );

-- ============================================================
-- lesson_progress: partner can read their placed students' progress
-- ============================================================

CREATE POLICY "lesson_progress_partner_read" ON lesson_progress
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('partner', 'admin', 'super_admin')
    )
    AND EXISTS (
      SELECT 1 FROM apprentice_placements ap
      JOIN shop_staff ss ON ss.shop_id = ap.shop_id
        AND ss.tenant_id = ap.tenant_id
      JOIN shops s ON s.id = ss.shop_id
        AND s.tenant_id = ss.tenant_id
      WHERE ap.student_id = lesson_progress.user_id
        AND ss.user_id = auth.uid()
        AND ss.active = true
        AND s.active = true
    )
  );

-- ============================================================
-- certificates: partner can read their placed students' certificates
-- ============================================================

CREATE POLICY "certificates_partner_read" ON certificates
  FOR SELECT TO authenticated
  USING (
    tenant_id = public.get_current_tenant_id()
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('partner', 'admin', 'super_admin')
    )
    AND EXISTS (
      SELECT 1 FROM apprentice_placements ap
      JOIN shop_staff ss ON ss.shop_id = ap.shop_id
        AND ss.tenant_id = ap.tenant_id
      JOIN shops s ON s.id = ss.shop_id
        AND s.tenant_id = ss.tenant_id
      WHERE ap.student_id = certificates.user_id
        AND ss.user_id = auth.uid()
        AND ss.active = true
        AND s.active = true
    )
  );

-- ============================================================
-- Indexes for partner policy performance
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_shop_staff_user_active
  ON shop_staff(user_id, active, shop_id);

CREATE INDEX IF NOT EXISTS idx_placements_shop_student
  ON apprentice_placements(shop_id, student_id);

CREATE INDEX IF NOT EXISTS idx_shops_active
  ON shops(id) WHERE active = true;
-- Add active flag to shop_staff for staff deactivation without row deletion
-- Enables clean partner access revocation

ALTER TABLE shop_staff
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_shop_staff_active
  ON shop_staff(user_id, active) WHERE active = true;

-- Update existing RLS read policy to exclude inactive staff
DROP POLICY IF EXISTS "shop_staff_read" ON shop_staff;
CREATE POLICY "shop_staff_read"
  ON shop_staff FOR SELECT
  USING (
    is_admin() OR
    (shop_staff.user_id = auth.uid() AND shop_staff.active = true) OR
    (is_shop_staff(shop_staff.shop_id) AND shop_staff.active = true)
  );
-- Fix: Partner LMS table RLS policies were only in archive-unapplied.
-- Without these, /courses/partners returns empty results (RLS enabled, no policies)
-- or is wide open (RLS not enabled).
--
-- Tables: partner_lms_providers, partner_lms_courses, partner_courses,
--         partner_lms_enrollments, partner_certificates
--
-- Uses is_admin() SECURITY DEFINER to avoid profiles recursion.

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. partner_lms_providers
-- ────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.partner_lms_providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_lms_providers_public_read" ON public.partner_lms_providers;
DROP POLICY IF EXISTS "Public can view active providers" ON public.partner_lms_providers;
CREATE POLICY "partner_lms_providers_public_read"
  ON public.partner_lms_providers
  FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "partner_lms_providers_admin_all" ON public.partner_lms_providers;
DROP POLICY IF EXISTS "Admins can manage providers" ON public.partner_lms_providers;
CREATE POLICY "partner_lms_providers_admin_all"
  ON public.partner_lms_providers
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ────────────────────────────────────────────────────────────────
-- 2. partner_lms_courses
-- ────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.partner_lms_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_lms_courses_public_read" ON public.partner_lms_courses;
CREATE POLICY "partner_lms_courses_public_read"
  ON public.partner_lms_courses
  FOR SELECT
  USING (active = true);

DROP POLICY IF EXISTS "partner_lms_courses_admin_all" ON public.partner_lms_courses;
CREATE POLICY "partner_lms_courses_admin_all"
  ON public.partner_lms_courses
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ────────────────────────────────────────────────────────────────
-- 3. partner_courses
-- ────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.partner_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active courses" ON public.partner_courses;
DROP POLICY IF EXISTS "Anyone can view active partner courses" ON public.partner_courses;
CREATE POLICY "partner_courses_public_read"
  ON public.partner_courses
  FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage courses" ON public.partner_courses;
CREATE POLICY "partner_courses_admin_all"
  ON public.partner_courses
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- ────────────────────────────────────────────────────────────────
-- 4. partner_lms_enrollments
-- ────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.partner_lms_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "partner_lms_enrollments_own" ON public.partner_lms_enrollments;
DROP POLICY IF EXISTS "Students can view own enrollments" ON public.partner_lms_enrollments;
CREATE POLICY "partner_lms_enrollments_own"
  ON public.partner_lms_enrollments
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "partner_lms_enrollments_admin" ON public.partner_lms_enrollments;
DROP POLICY IF EXISTS "Admins can view all enrollments" ON public.partner_lms_enrollments;
CREATE POLICY "partner_lms_enrollments_admin"
  ON public.partner_lms_enrollments
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Service role for Edge Functions
DROP POLICY IF EXISTS "Service role can manage enrollments" ON public.partner_lms_enrollments;
CREATE POLICY "partner_lms_enrollments_service"
  ON public.partner_lms_enrollments
  FOR ALL
  TO public
  WITH CHECK (auth.role() = 'service_role');

-- ────────────────────────────────────────────────────────────────
-- 5. partner_certificates
-- ────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.partner_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students can view own certificates" ON public.partner_certificates;
CREATE POLICY "partner_certificates_own"
  ON public.partner_certificates
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all certificates" ON public.partner_certificates;
CREATE POLICY "partner_certificates_admin"
  ON public.partner_certificates
  FOR ALL
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Service role can manage certificates" ON public.partner_certificates;
CREATE POLICY "partner_certificates_service"
  ON public.partner_certificates
  FOR ALL
  TO public
  WITH CHECK (auth.role() = 'service_role');

-- ────────────────────────────────────────────────────────────────
-- 6. partner_lms_enrollment_failures (admin only)
-- ────────────────────────────────────────────────────────────────
ALTER TABLE IF EXISTS public.partner_lms_enrollment_failures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view enrollment failures" ON public.partner_lms_enrollment_failures;
CREATE POLICY "partner_enrollment_failures_admin"
  ON public.partner_lms_enrollment_failures
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- ────────────────────────────────────────────────────────────────
-- 7. Grants
-- ────────────────────────────────────────────────────────────────
GRANT SELECT ON public.partner_lms_providers TO anon, authenticated;
GRANT SELECT ON public.partner_lms_courses TO anon, authenticated;
GRANT SELECT ON public.partner_courses TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.partner_lms_enrollments TO authenticated;
GRANT SELECT ON public.partner_certificates TO authenticated;
GRANT ALL ON public.partner_lms_providers TO service_role;
GRANT ALL ON public.partner_lms_courses TO service_role;
GRANT ALL ON public.partner_courses TO service_role;
GRANT ALL ON public.partner_lms_enrollments TO service_role;
GRANT ALL ON public.partner_certificates TO service_role;
GRANT ALL ON public.partner_lms_enrollment_failures TO service_role;

COMMIT;
