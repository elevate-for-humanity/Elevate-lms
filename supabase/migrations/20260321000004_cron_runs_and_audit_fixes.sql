-- Migration 20260321000004
--
-- 1. cron_runs: durable audit table for all cron job executions.
--    Without this, silent cron failures are undetectable.
--
-- 2. Fix provision_provider() audit event: write target_id = tenant_id
--    (not application_id) so /admin/providers/[tenantId] audit log works.
--    Also write a second event with target_id = tenant_id for the tenant record.

-- =============================================================================
-- 1. cron_runs
-- =============================================================================

CREATE TABLE IF NOT EXISTS cron_runs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name     TEXT NOT NULL,
  ran_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  status       TEXT NOT NULL CHECK (status IN ('success', 'error', 'skipped')),
  duration_ms  INTEGER,
  records_affected INTEGER,
  error        TEXT,
  metadata     JSONB
);

CREATE INDEX IF NOT EXISTS cron_runs_job_idx    ON cron_runs (job_name);
CREATE INDEX IF NOT EXISTS cron_runs_ran_at_idx ON cron_runs (ran_at DESC);

-- Immutable: cron history should never be modified
ALTER TABLE cron_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cron_runs_admin_read"
  ON cron_runs FOR SELECT
  TO authenticated
  USING (is_admin_role());

CREATE POLICY "cron_runs_service_write"
  ON cron_runs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- =============================================================================
-- 2. Fix provision_provider() — write audit event with target_id = tenant_id
--    so /admin/providers/[tenantId] audit log shows approval events.
-- =============================================================================

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
  SELECT * INTO v_app
  FROM provider_applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false, 'code', 'NOT_FOUND', 'message', 'Application not found'
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

  -- Generate unique slug
  v_base_slug := left(
    regexp_replace(
      regexp_replace(lower(v_app.org_name), '[^a-z0-9]+', '-', 'g'),
      '^-|-$', '', 'g'
    ), 50
  );

  v_slug := v_base_slug;
  LOOP
    SELECT EXISTS(SELECT 1 FROM tenants WHERE slug = v_slug) INTO v_slug_exists;
    EXIT WHEN NOT v_slug_exists;
    v_suffix := v_suffix + 1;
    v_slug := v_base_slug || '-' || v_suffix::TEXT;
    IF v_suffix > 100 THEN
      v_slug := v_base_slug || '-' || extract(epoch FROM now())::BIGINT::TEXT;
      EXIT;
    END IF;
  END LOOP;

  -- Create tenant
  INSERT INTO tenants (name, slug, type, status, active, created_at, updated_at)
  VALUES (v_app.org_name, v_slug, 'partner_provider', 'active', true, now(), now())
  RETURNING id INTO v_tenant_id;

  -- Seed onboarding checklist if function exists
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'seed_provider_onboarding'
  ) THEN
    PERFORM seed_provider_onboarding(v_tenant_id);
  END IF;

  -- Mark application approved
  UPDATE provider_applications
  SET
    status       = 'approved',
    tenant_id    = v_tenant_id,
    reviewed_by  = p_admin_user_id,
    reviewed_at  = now(),
    review_notes = p_review_notes,
    updated_at   = now()
  WHERE id = p_application_id;

  -- Audit event 1: on the application record (for application audit trail)
  INSERT INTO admin_audit_events (
    actor_user_id, action, target_type, target_id, metadata, created_at
  ) VALUES (
    p_admin_user_id, 'provider_approved', 'provider_application', p_application_id,
    jsonb_build_object(
      'org_name',      v_app.org_name,
      'org_type',      v_app.org_type,
      'contact_email', v_app.contact_email,
      'tenant_id',     v_tenant_id,
      'tenant_slug',   v_slug
    ),
    now()
  );

  -- Audit event 2: on the tenant record so /admin/providers/[tenantId] shows it
  INSERT INTO admin_audit_events (
    actor_user_id, action, target_type, target_id, metadata, created_at
  ) VALUES (
    p_admin_user_id, 'provider_approved', 'tenant', v_tenant_id,
    jsonb_build_object(
      'org_name',        v_app.org_name,
      'contact_email',   v_app.contact_email,
      'application_id',  p_application_id
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
