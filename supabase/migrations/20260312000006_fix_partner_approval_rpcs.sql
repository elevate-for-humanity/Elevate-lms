-- Fix rpc_approve_partner and rpc_link_partner_user to match actual
-- production schema for partners and program_holders tables.
-- Replaces the incorrect version in 20260312000003.

CREATE OR REPLACE FUNCTION public.rpc_approve_partner(
  p_partner_application_id UUID,
  p_admin_user_id           UUID,
  p_partner_email           TEXT,
  p_program_ids             UUID[],
  p_idempotency_key         TEXT,
  p_profile                 JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner_id   UUID;
  v_application  partner_applications%ROWTYPE;
BEGIN
  -- Idempotency: check if already approved via approval_status + contact_email
  SELECT id INTO v_partner_id
  FROM partners
  WHERE contact_email = p_partner_email
    AND approval_status = 'approved'
  LIMIT 1;

  IF v_partner_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success',    true,
      'idempotent', true,
      'partner_id', v_partner_id,
      'message',    'Already approved'
    );
  END IF;

  -- Fetch application
  SELECT * INTO v_application
  FROM partner_applications
  WHERE id = p_partner_application_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code',    'NOT_FOUND',
      'message', 'Application not found'
    );
  END IF;

  IF v_application.status NOT IN ('pending', 'approved_pending_user') THEN
    RETURN jsonb_build_object(
      'success', false,
      'code',    'INVALID_STATUS',
      'message', format('Cannot approve application in status: %s', v_application.status)
    );
  END IF;

  -- Create program_holders record using actual columns
  INSERT INTO program_holders (
    organization_name,
    name,
    contact_email,
    status,
    created_at
  ) VALUES (
    v_application.shop_name,
    v_application.shop_name,
    p_partner_email,
    'approved',
    now()
  )
  RETURNING id INTO v_partner_id;

  -- Update application status
  UPDATE partner_applications
  SET
    status          = 'approved_pending_user',
    approval_status = 'approved',
    reviewed_by     = p_admin_user_id,
    reviewed_at     = now()
  WHERE id = p_partner_application_id;

  RETURN jsonb_build_object(
    'success',    true,
    'idempotent', false,
    'partner_id', v_partner_id,
    'message',    'Partner approved'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'code',    'DB_ERROR',
    'message', SQLERRM
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_link_partner_user(
  p_partner_id       UUID,
  p_auth_user_id     UUID,
  p_email            TEXT,
  p_idempotency_key  TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_user_id UUID;
BEGIN
  -- Idempotency: already linked
  SELECT user_id INTO v_existing_user_id
  FROM program_holders
  WHERE id = p_partner_id;

  IF v_existing_user_id = p_auth_user_id THEN
    RETURN jsonb_build_object(
      'success',    true,
      'idempotent', true,
      'message',    'Already linked'
    );
  END IF;

  -- Link auth user to program_holder
  UPDATE program_holders
  SET user_id = p_auth_user_id
  WHERE id = p_partner_id;

  -- Upsert profile with partner role
  INSERT INTO profiles (id, email, role, created_at, updated_at)
  VALUES (p_auth_user_id, p_email, 'partner', now(), now())
  ON CONFLICT (id) DO UPDATE
    SET role       = 'partner',
        updated_at = now();

  -- Finalise application status
  UPDATE partner_applications
  SET status = 'approved'
  WHERE id IN (
    SELECT id FROM partner_applications
    WHERE contact_email = p_email
      AND status = 'approved_pending_user'
    LIMIT 1
  );

  RETURN jsonb_build_object(
    'success',    true,
    'idempotent', false,
    'message',    'User linked to partner'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'message', SQLERRM
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_approve_partner TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_link_partner_user TO authenticated;
