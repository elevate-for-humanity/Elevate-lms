-- rpc_approve_partner
-- Called by: app/api/partner/applications/[id]/approve/route.ts (Phase 1)
--
-- Parameters (exact names from route):
--   p_partner_application_id uuid
--   p_admin_user_id          uuid
--   p_partner_email          text
--   p_program_ids            text[]  (null = use programs_requested from application)
--   p_idempotency_key        text
--
-- Returns jsonb:
--   { success: bool, partner_id: uuid, idempotent: bool, message: text, code: text }
--
-- Guarantees:
--   - Idempotent: second call with same application_id returns existing partner_id
--   - Atomic: all writes succeed or none do
--   - Does NOT create auth user (that is Phase 2)
--   - Does NOT populate partner_users (that is rpc_link_partner_user)

CREATE OR REPLACE FUNCTION public.rpc_approve_partner(
  p_partner_application_id uuid,
  p_admin_user_id          uuid,
  p_partner_email          text,
  p_program_ids            text[]  DEFAULT NULL,
  p_idempotency_key        text    DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_application   partner_applications%ROWTYPE;
  v_partner_id    uuid;
  v_programs      jsonb;
BEGIN
  -- 1. Lock and fetch application
  SELECT * INTO v_application
  FROM partner_applications
  WHERE id = p_partner_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Application not found',
      'code', 'NOT_FOUND'
    );
  END IF;

  -- 2. Idempotency: if already approved, return existing partner
  IF v_application.approval_status IN ('approved', 'approved_pending_user') THEN
    -- Find the partner created from this application
    SELECT id INTO v_partner_id
    FROM partners
    WHERE contact_email = v_application.contact_email
    ORDER BY created_at DESC
    LIMIT 1;

    RETURN jsonb_build_object(
      'success',    true,
      'idempotent', true,
      'partner_id', v_partner_id,
      'message',    'Already approved'
    );
  END IF;

  -- 3. Reject invalid state transitions
  IF v_application.approval_status NOT IN ('pending') THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Application is not in pending state: ' || v_application.approval_status,
      'code',    'INVALID_STATE'
    );
  END IF;

  -- 4. Resolve programs: use p_program_ids if provided, else use programs_requested
  IF p_program_ids IS NOT NULL THEN
    v_programs := to_jsonb(p_program_ids);
  ELSIF v_application.programs_requested IS NOT NULL THEN
    v_programs := to_jsonb(v_application.programs_requested);
  ELSE
    v_programs := '[]'::jsonb;
  END IF;

  -- 5. Create partner record from application
  INSERT INTO partners (
    name,
    shop_name,
    owner_name,
    contact_email,
    phone,
    address_line1,
    city,
    state,
    zip,
    programs,
    status,
    approval_status,
    account_status,
    approved_at,
    approved_by,
    onboarding_completed
  )
  VALUES (
    v_application.shop_name,
    v_application.shop_name,
    v_application.owner_name,
    v_application.contact_email,
    v_application.phone,
    v_application.address_line1,
    v_application.city,
    v_application.state,
    v_application.zip,
    v_programs,
    'active',
    'approved_pending_user',
    'draft',
    now(),
    p_admin_user_id,
    false
  )
  RETURNING id INTO v_partner_id;

  -- 6. Mark application as approved_pending_user
  UPDATE partner_applications
  SET
    approval_status  = 'approved_pending_user',
    status           = 'approved',
    updated_at       = now(),
    state_updated_at = now()
  WHERE id = p_partner_application_id;

  RETURN jsonb_build_object(
    'success',    true,
    'idempotent', false,
    'partner_id', v_partner_id,
    'message',    'Partner created, pending user link'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM,
    'code',    SQLSTATE
  );
END;
$$;

-- rpc_link_partner_user
-- Called by: app/api/partner/applications/[id]/approve/route.ts (Phase 2)
--
-- Parameters (exact names from route):
--   p_partner_id        uuid
--   p_auth_user_id      uuid
--   p_email             text
--   p_idempotency_key   text
--
-- Returns jsonb:
--   { success: bool, idempotent: bool, message: text }
--
-- Guarantees:
--   - Idempotent: second call for same partner+user is a no-op
--   - Creates partner_users row (activates partner_users-based RLS)
--   - Creates/updates profiles row with partner role
--   - Finalizes partner approval_status to 'approved'

CREATE OR REPLACE FUNCTION public.rpc_link_partner_user(
  p_partner_id       uuid,
  p_auth_user_id     uuid,
  p_email            text,
  p_idempotency_key  text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_link uuid;
BEGIN
  -- 1. Idempotency: check if link already exists
  SELECT id INTO v_existing_link
  FROM partner_users
  WHERE partner_id = p_partner_id
    AND user_id    = p_auth_user_id;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success',    true,
      'idempotent', true,
      'message',    'User already linked to partner'
    );
  END IF;

  -- 2. Verify partner exists
  IF NOT EXISTS (SELECT 1 FROM partners WHERE id = p_partner_id) THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Partner not found',
      'code',    'NOT_FOUND'
    );
  END IF;

  -- 3. Upsert profile with partner role
  INSERT INTO profiles (id, email, role)
  VALUES (p_auth_user_id, p_email, 'partner')
  ON CONFLICT (id) DO UPDATE
    SET role       = 'partner',
        updated_at = now();

  -- 4. Create partner_users mapping (activates RLS identity path)
  INSERT INTO partner_users (user_id, partner_id, role, status)
  VALUES (p_auth_user_id, p_partner_id, 'partner_admin', 'active');

  -- 5. Finalize partner approval_status
  UPDATE partners
  SET
    approval_status = 'approved',
    account_status  = 'active',
    updated_at      = now()
  WHERE id = p_partner_id;

  RETURN jsonb_build_object(
    'success',    true,
    'idempotent', false,
    'message',    'User linked and partner activated'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM,
    'code',    SQLSTATE
  );
END;
$$;

-- Grant execute to authenticated role (service role already has full access)
GRANT EXECUTE ON FUNCTION public.rpc_approve_partner TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_link_partner_user TO authenticated;
