-- provision_provider(): canonical atomic orchestration for provider approval.
--
-- Replaces the inline TypeScript approval logic in the API route.
-- All business rules for provider provisioning live here, not in application code.
--
-- What it does (all in one transaction):
--   1. Validates application exists and is in an approvable state
--   2. Generates a unique tenant slug (retries with numeric suffix on collision)
--   3. Creates the tenant record (type = 'partner_provider')
--   4. Updates provider_applications: status='approved', tenant_id set
--   5. Writes to admin_audit_events
--
-- What it does NOT do (must happen in application layer after this returns):
--   - Create the Supabase auth user (requires admin API, not available in SQL)
--   - Send the magic link / welcome email
--   - Upsert the profile row (depends on auth user ID from step above)
--
-- Idempotency: if called again for an already-approved application, returns
-- the existing tenant_id without creating duplicates.
--
-- Race condition protection: uses SELECT ... FOR UPDATE on the application row
-- to prevent concurrent approvals.

CREATE OR REPLACE FUNCTION public.provision_provider(
  p_application_id  UUID,
  p_admin_user_id   UUID,
  p_review_notes    TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app             provider_applications%ROWTYPE;
  v_tenant_id       UUID;
  v_base_slug       TEXT;
  v_slug            TEXT;
  v_suffix          INT := 0;
  v_slug_exists     BOOLEAN;
BEGIN
  -- Lock the application row to prevent concurrent approvals
  SELECT * INTO v_app
  FROM provider_applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 'code', 'NOT_FOUND',
      'message', 'Application not found'
    );
  END IF;

  -- Idempotency: already approved
  IF v_app.status = 'approved' AND v_app.tenant_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true, 'idempotent', true,
      'tenant_id', v_app.tenant_id,
      'message', 'Already provisioned'
    );
  END IF;

  IF v_app.status NOT IN ('pending', 'under_review') THEN
    RETURN jsonb_build_object(
      'success', false, 'code', 'INVALID_STATUS',
      'message', format('Cannot approve application in status: %s', v_app.status)
    );
  END IF;

  -- Generate unique slug from org name
  -- Lowercase, collapse non-alphanumeric runs to hyphens, strip leading/trailing hyphens
  v_base_slug := regexp_replace(
    regexp_replace(lower(v_app.org_name), '[^a-z0-9]+', '-', 'g'),
    '^-|-$', '', 'g'
  );
  -- Truncate to 50 chars to leave room for suffix
  v_base_slug := left(v_base_slug, 50);

  -- Find a unique slug with numeric suffix on collision
  v_slug := v_base_slug;
  LOOP
    SELECT EXISTS(SELECT 1 FROM tenants WHERE slug = v_slug) INTO v_slug_exists;
    EXIT WHEN NOT v_slug_exists;
    v_suffix := v_suffix + 1;
    v_slug := v_base_slug || '-' || v_suffix::TEXT;
    -- Safety: bail after 100 attempts (should never happen in practice)
    IF v_suffix > 100 THEN
      v_slug := v_base_slug || '-' || extract(epoch FROM now())::BIGINT::TEXT;
      EXIT;
    END IF;
  END LOOP;

  -- Create tenant
  INSERT INTO tenants (name, slug, type, status, active, created_at, updated_at)
  VALUES (
    v_app.org_name,
    v_slug,
    'partner_provider',
    'active',
    true,
    now(),
    now()
  )
  RETURNING id INTO v_tenant_id;

  -- Seed onboarding checklist if the function exists (defined in 20260321000003).
  -- Guard prevents failure if migrations are run out of order or individually.
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'seed_provider_onboarding'
  ) THEN
    PERFORM seed_provider_onboarding(v_tenant_id);
  END IF;

  -- Mark application approved and link tenant
  UPDATE provider_applications
  SET
    status      = 'approved',
    tenant_id   = v_tenant_id,
    reviewed_by = p_admin_user_id,
    reviewed_at = now(),
    review_notes = p_review_notes,
    updated_at  = now()
  WHERE id = p_application_id;

  -- Audit trail
  INSERT INTO admin_audit_events (
    actor_user_id, action, target_type, target_id, metadata, created_at
  ) VALUES (
    p_admin_user_id,
    'provider_approved',
    'provider_application',
    p_application_id,
    jsonb_build_object(
      'org_name',      v_app.org_name,
      'org_type',      v_app.org_type,
      'contact_email', v_app.contact_email,
      'tenant_id',     v_tenant_id,
      'tenant_slug',   v_slug
    ),
    now()
  );

  RETURN jsonb_build_object(
    'success',       true,
    'idempotent',    false,
    'tenant_id',     v_tenant_id,
    'tenant_slug',   v_slug,
    'contact_email', v_app.contact_email,
    'contact_name',  v_app.contact_name,
    'org_name',      v_app.org_name
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false, 'code', 'DB_ERROR', 'message', SQLERRM
  );
END;
$$;

-- deny_provider(): atomic denial with audit trail.
CREATE OR REPLACE FUNCTION public.deny_provider(
  p_application_id UUID,
  p_admin_user_id  UUID,
  p_reason         TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_app provider_applications%ROWTYPE;
BEGIN
  SELECT * INTO v_app
  FROM provider_applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'NOT_FOUND', 'message', 'Application not found');
  END IF;

  IF v_app.status = 'denied' THEN
    RETURN jsonb_build_object('success', true, 'idempotent', true, 'message', 'Already denied');
  END IF;

  IF v_app.status NOT IN ('pending', 'under_review') THEN
    RETURN jsonb_build_object(
      'success', false, 'code', 'INVALID_STATUS',
      'message', format('Cannot deny application in status: %s', v_app.status)
    );
  END IF;

  UPDATE provider_applications
  SET
    status       = 'denied',
    status_reason = p_reason,
    review_notes = p_reason,
    reviewed_by  = p_admin_user_id,
    reviewed_at  = now(),
    updated_at   = now()
  WHERE id = p_application_id;

  INSERT INTO admin_audit_events (
    actor_user_id, action, target_type, target_id, metadata, created_at
  ) VALUES (
    p_admin_user_id,
    'provider_denied',
    'provider_application',
    p_application_id,
    jsonb_build_object(
      'org_name',      v_app.org_name,
      'contact_email', v_app.contact_email,
      'reason',        p_reason
    ),
    now()
  );

  RETURN jsonb_build_object('success', true, 'idempotent', false, 'message', 'Application denied');

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'code', 'DB_ERROR', 'message', SQLERRM);
END;
$$;

-- mark_provider_under_review(): moves pending → under_review with audit.
CREATE OR REPLACE FUNCTION public.mark_provider_under_review(
  p_application_id UUID,
  p_admin_user_id  UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE provider_applications
  SET status = 'under_review', updated_at = now()
  WHERE id = p_application_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Application not found or not in pending status');
  END IF;

  INSERT INTO admin_audit_events (
    actor_user_id, action, target_type, target_id, created_at
  ) VALUES (
    p_admin_user_id, 'provider_under_review', 'provider_application', p_application_id, now()
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- suspend_provider(): disables a tenant and blocks program publishing.
CREATE OR REPLACE FUNCTION public.suspend_provider(
  p_tenant_id     UUID,
  p_admin_user_id UUID,
  p_reason        TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE tenants
  SET status = 'suspended', active = false, updated_at = now()
  WHERE id = p_tenant_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'NOT_FOUND', 'message', 'Tenant not found');
  END IF;

  -- Unpublish all active programs for this tenant
  UPDATE programs
  SET published = false, is_active = false
  WHERE tenant_id = p_tenant_id AND (published = true OR is_active = true);

  INSERT INTO admin_audit_events (
    actor_user_id, action, target_type, target_id, metadata, created_at
  ) VALUES (
    p_admin_user_id, 'provider_suspended', 'tenant', p_tenant_id,
    jsonb_build_object('reason', p_reason), now()
  );

  RETURN jsonb_build_object('success', true);

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'code', 'DB_ERROR', 'message', SQLERRM);
END;
$$;

-- Grants: service role only for provision/deny/suspend (admin-initiated).
-- mark_under_review is safe for authenticated admins via API.
REVOKE EXECUTE ON FUNCTION public.provision_provider FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.deny_provider FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.suspend_provider FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mark_provider_under_review FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.provision_provider TO service_role;
GRANT EXECUTE ON FUNCTION public.deny_provider TO service_role;
GRANT EXECUTE ON FUNCTION public.suspend_provider TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_provider_under_review TO service_role;
