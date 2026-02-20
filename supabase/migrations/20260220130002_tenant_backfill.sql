-- ============================================================================
-- PHASE 1b: BACKFILL — Set tenant_id on all existing rows
-- ============================================================================
-- Uses the REAL Elevate tenant ID from the tenants table.
-- Only updates tables whose tenant_id FK references tenants(id).
-- Skips tables with tenant_id FK to other tables (lms_organizations, etc.)
-- ============================================================================

DO $$
DECLARE
  v_elevate_tenant_id uuid;
  v_elevate_org_id uuid;
BEGIN
  -- Get the real Elevate tenant
  SELECT id INTO v_elevate_tenant_id
  FROM tenants
  WHERE slug = 'elevate-for-humanity'
  LIMIT 1;

  IF v_elevate_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Elevate tenant not found in tenants table';
  END IF;

  RAISE NOTICE 'Using Elevate tenant_id: %', v_elevate_tenant_id;

  -- Get the Elevate organization (if exists)
  SELECT id INTO v_elevate_org_id
  FROM organizations
  LIMIT 1;

  -- ========================================
  -- Core LMS tables (newly added tenant_id)
  -- ========================================
  UPDATE training_courses SET tenant_id = v_elevate_tenant_id WHERE tenant_id IS NULL;
  UPDATE training_lessons SET tenant_id = v_elevate_tenant_id WHERE tenant_id IS NULL;

  -- These use DO blocks in part17 so they may or may not have tenant_id
  -- Use dynamic SQL to avoid errors if column doesn't exist
  BEGIN
    EXECUTE 'UPDATE modules SET tenant_id = $1 WHERE tenant_id IS NULL' USING v_elevate_tenant_id;
  EXCEPTION WHEN undefined_column THEN NULL;
  END;

  BEGIN
    EXECUTE 'UPDATE assignments SET tenant_id = $1 WHERE tenant_id IS NULL' USING v_elevate_tenant_id;
  EXCEPTION WHEN undefined_column THEN NULL;
  END;

  BEGIN
    EXECUTE 'UPDATE grades SET tenant_id = $1 WHERE tenant_id IS NULL' USING v_elevate_tenant_id;
  EXCEPTION WHEN undefined_column THEN NULL;
  END;

  BEGIN
    EXECUTE 'UPDATE job_placements SET tenant_id = $1 WHERE tenant_id IS NULL' USING v_elevate_tenant_id;
  EXCEPTION WHEN undefined_column THEN NULL;
  END;

  BEGIN
    EXECUTE 'UPDATE notifications SET tenant_id = $1 WHERE tenant_id IS NULL' USING v_elevate_tenant_id;
  EXCEPTION WHEN undefined_column THEN NULL;
  END;

  -- ========================================
  -- Tables that ALREADY have tenant_id (FK to tenants)
  -- ========================================
  UPDATE profiles SET tenant_id = v_elevate_tenant_id WHERE tenant_id IS NULL;
  UPDATE enrollments SET tenant_id = v_elevate_tenant_id WHERE tenant_id IS NULL;
  UPDATE certificates SET tenant_id = v_elevate_tenant_id WHERE tenant_id IS NULL;
  UPDATE programs SET tenant_id = v_elevate_tenant_id WHERE tenant_id IS NULL;
  UPDATE lesson_progress SET tenant_id = v_elevate_tenant_id WHERE tenant_id IS NULL;
  UPDATE cohorts SET tenant_id = v_elevate_tenant_id WHERE tenant_id IS NULL;
  UPDATE licenses SET tenant_id = v_elevate_tenant_id WHERE tenant_id IS NULL;
  UPDATE student_applications SET tenant_id = v_elevate_tenant_id WHERE tenant_id IS NULL;
  UPDATE shops SET tenant_id = v_elevate_tenant_id WHERE tenant_id IS NULL;
  UPDATE shop_staff SET tenant_id = v_elevate_tenant_id WHERE tenant_id IS NULL;
  UPDATE apprentice_placements SET tenant_id = v_elevate_tenant_id WHERE tenant_id IS NULL;
  UPDATE tenant_memberships SET tenant_id = v_elevate_tenant_id WHERE tenant_id IS NULL;
  UPDATE training_enrollments SET tenant_id = v_elevate_tenant_id WHERE tenant_id IS NULL;

  -- ========================================
  -- Backfill organization_id where applicable
  -- ========================================
  IF v_elevate_org_id IS NOT NULL THEN
    UPDATE profiles SET organization_id = v_elevate_org_id WHERE organization_id IS NULL;
    UPDATE programs SET organization_id = v_elevate_org_id WHERE organization_id IS NULL;
  END IF;

  RAISE NOTICE 'Backfill complete. Tenant: %, Org: %', v_elevate_tenant_id, v_elevate_org_id;
END $$;
