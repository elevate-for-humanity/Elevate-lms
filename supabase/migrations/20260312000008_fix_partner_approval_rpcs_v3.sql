-- Final corrected partner approval RPCs.
-- Key fixes from v2:
-- - partner_applications.status is VARCHAR(20): use 'approved' not 'approved_pending_user'
-- - partner_applications has no approval_status, reviewed_by, reviewed_at, updated_at columns
-- - program_holders has no updated_at column

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
  v_partner_id  UUID;
  v_application partner_applications%ROWTYPE;
BEGIN
  -- Idempotency: already have an approved program_holder for this email
  SELECT id INTO v_partner_id
  FROM program_holders
  WHERE contact_email = p_partner_email
    AND status = 'approved'
  LIMIT 1;

  IF v_partner_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true, 'idempotent', true,
      'partner_id', v_partner_id, 'message', 'Already approved'
    );
  END IF;

  SELECT * INTO v_application FROM partner_applications WHERE id = p_partner_application_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'NOT_FOUND', 'message', 'Application not found');
  END IF;

  -- status column is VARCHAR(20); valid values that fit: 'pending','approved','rejected'
  IF v_application.status NOT IN ('pending', 'approved') THEN
    RETURN jsonb_build_object('success', false, 'code', 'INVALID_STATUS',
      'message', format('Cannot approve in status: %s', v_application.status));
  END IF;

  -- Create program_holders record (no updated_at column)
  INSERT INTO program_holders (organization_name, name, contact_email, status, created_at)
  VALUES (v_application.shop_name, v_application.shop_name, p_partner_email, 'approved', now())
  RETURNING id INTO v_partner_id;

  -- Update application — only columns that exist, status fits VARCHAR(20)
  UPDATE partner_applications
  SET status = 'approved'
  WHERE id = p_partner_application_id;

  RETURN jsonb_build_object(
    'success', true, 'idempotent', false,
    'partner_id', v_partner_id, 'message', 'Partner approved'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'code', 'DB_ERROR', 'message', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_link_partner_user(
  p_partner_id      UUID,
  p_auth_user_id    UUID,
  p_email           TEXT,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing UUID;
BEGIN
  SELECT user_id INTO v_existing FROM program_holders WHERE id = p_partner_id;

  IF v_existing = p_auth_user_id THEN
    RETURN jsonb_build_object('success', true, 'idempotent', true, 'message', 'Already linked');
  END IF;

  UPDATE program_holders SET user_id = p_auth_user_id WHERE id = p_partner_id;

  INSERT INTO profiles (id, email, role, created_at, updated_at)
  VALUES (p_auth_user_id, p_email, 'partner', now(), now())
  ON CONFLICT (id) DO UPDATE SET role = 'partner', updated_at = now();

  RETURN jsonb_build_object('success', true, 'idempotent', false, 'message', 'User linked');

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_approve_partner TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_link_partner_user TO authenticated;
