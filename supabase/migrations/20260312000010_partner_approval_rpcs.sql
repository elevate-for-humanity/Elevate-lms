-- Partner approval two-phase RPC functions.
-- These were previously created manually in Supabase and not tracked in migrations.
-- Signatures must match exactly what app/api/partner/applications/[id]/approve/route.ts calls.

-- Drop existing versions regardless of signature so CREATE OR REPLACE succeeds
DROP FUNCTION IF EXISTS public.rpc_approve_partner CASCADE;
DROP FUNCTION IF EXISTS public.rpc_link_partner_user CASCADE;

-- ============================================================
-- PHASE 1: DB-only approval (atomic)
-- Creates partner entity, program access, updates application.
-- Returns { success, idempotent, partner_id, message, code }
-- ============================================================
CREATE OR REPLACE FUNCTION public.rpc_approve_partner(
  p_partner_application_id UUID,
  p_admin_user_id           UUID,
  p_partner_email           TEXT,
  p_program_ids             UUID[],
  p_idempotency_key         TEXT
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
  -- Idempotency check
  SELECT id INTO v_partner_id
  FROM program_holders
  WHERE metadata->>'idempotency_key' = p_idempotency_key
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

  -- Guard: only approve pending applications
  IF v_application.status NOT IN ('pending', 'approved_pending_user') THEN
    RETURN jsonb_build_object(
      'success', false,
      'code',    'INVALID_STATUS',
      'message', format('Cannot approve application in status: %s', v_application.status)
    );
  END IF;

  -- Create program_holders record
  INSERT INTO program_holders (
    organization_name,
    name,
    contact_email,
    status,
    metadata,
    created_at
  ) VALUES (
    v_application.shop_name,
    v_application.shop_name,
    p_partner_email,
    'approved',
    jsonb_build_object(
      'idempotency_key',    p_idempotency_key,
      'application_id',     p_partner_application_id,
      'programs_requested', v_application.programs_requested,
      'approved_by',        p_admin_user_id,
      'approved_at',        now()
    ),
    now()
  )
  RETURNING id INTO v_partner_id;

  -- Update application status
  UPDATE partner_applications
  SET
    status      = 'approved_pending_user',
    reviewed_by = p_admin_user_id,
    reviewed_at = now(),
    partner_id  = v_partner_id
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

-- ============================================================
-- PHASE 2: Link auth user to partner (atomic)
-- Sets owner_user_id, creates profile, finalises status.
-- Returns { success, idempotent, message }
-- ============================================================
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
  v_existing_owner UUID;
BEGIN
  -- Idempotency: already linked to this user
  SELECT owner_user_id INTO v_existing_owner
  FROM program_holders
  WHERE id = p_partner_id;

  IF v_existing_owner = p_auth_user_id THEN
    RETURN jsonb_build_object(
      'success',    true,
      'idempotent', true,
      'message',    'Already linked'
    );
  END IF;

  -- Link auth user to partner
  UPDATE program_holders
  SET
    owner_user_id = p_auth_user_id,
    status        = 'approved',
    metadata      = COALESCE(metadata, '{}'::jsonb) ||
                    jsonb_build_object('link_idempotency_key', p_idempotency_key)
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
  WHERE partner_id = p_partner_id
    AND status = 'approved_pending_user';

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

-- Grant execute to authenticated users (admin check is in the API layer)
GRANT EXECUTE ON FUNCTION public.rpc_approve_partner TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_link_partner_user TO authenticated;
