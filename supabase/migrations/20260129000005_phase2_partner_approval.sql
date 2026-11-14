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
