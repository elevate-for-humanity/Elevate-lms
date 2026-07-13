-- Final corrected partner approval RPCs against actual production schema.
-- partner_applications: id, shop_name, owner_name, contact_email, phone,
--   address_line1, city, state, zip, programs_requested, agreed_to_terms,
--   status, created_at, updated_at, intake, state_updated_at, email,
--   approval_status
-- program_holders: id, organization_name, name, status, created_at,
--   updated_at, user_id, contact_email, mou_signed, mou_signed_at, mou_status

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
  -- Idempotency: already approved for this email
  SELECT id INTO v_partner_id
  FROM program_holders
  WHERE contact_email = p_partner_email
    AND status = 'approved'
  LIMIT 1;

  IF v_partner_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success',    true,
      'idempotent', true,
      'partner_id', v_partner_id,
      'message',    'Already approved'
    );
  END IF;

  SELECT * INTO v_application
  FROM partner_applications
  WHERE id = p_partner_application_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'NOT_FOUND',
      'message', 'Application not found');
  END IF;

  IF v_application.status NOT IN ('pending', 'approved_pending_user') THEN
    RETURN jsonb_build_object('success', false, 'code', 'INVALID_STATUS',
      'message', format('Cannot approve in status: %s', v_application.status));
  END IF;

  -- Create program_holders record
  INSERT INTO program_holders (organization_name, name, contact_email, status, created_at)
  VALUES (v_application.shop_name, v_application.shop_name, p_partner_email, 'approved', now())
  RETURNING id INTO v_partner_id;

  -- Update application using only columns that exist
  UPDATE partner_applications
  SET status          = 'approved_pending_user',
      approval_status = 'approved',
      updated_at      = now()
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

  UPDATE partner_applications
  SET status = 'approved', updated_at = now()
  WHERE contact_email = p_email AND status = 'approved_pending_user';

  RETURN jsonb_build_object('success', true, 'idempotent', false, 'message', 'User linked');

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'message', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_approve_partner TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_link_partner_user TO authenticated;
