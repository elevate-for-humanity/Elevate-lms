-- Phase 11 governance schema.
--
-- Three additions:
--   1. provider_compliance_artifacts — documents proving compliance status
--      (MOU, insurance, W-9, license, state approval). Separate from
--      tenant_compliance_records which tracks status; this tracks the evidence.
--   2. provider_onboarding_steps — machine-readable checklist per tenant.
--      Drives the provider dashboard onboarding widget and admin visibility.
--   3. program_catalog_index — denormalized, search-friendly table across all
--      providers. Refreshed by trigger on programs publish/unpublish. Enables
--      hub-wide routing without cross-tenant joins.
--
-- Also extends:
--   - organizations: logo_url, tagline, support_email, service_area_counties,
--     suspension_reason, suspended_at, offboarded_at
--   - tenant_compliance_records: expires_at, artifact_id FK

-- =============================================================================
-- 1. provider_compliance_artifacts
-- =============================================================================

CREATE TABLE IF NOT EXISTS provider_compliance_artifacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  artifact_type   TEXT NOT NULL CHECK (artifact_type IN (
                    'mou', 'insurance', 'w9', 'state_license',
                    'etpl_approval', 'accreditation', 'other'
                  )),
  label           TEXT NOT NULL,           -- human-readable name, e.g. "Certificate of Insurance 2025"
  storage_path    TEXT,                    -- Supabase Storage path (private bucket)
  external_url    TEXT,                    -- alternative: link to external doc
  issued_at       DATE,
  expires_at      DATE,                    -- NULL = does not expire
  issuer          TEXT,                    -- e.g. "Indiana DWD", "State Farm"

  -- Upload provenance (for grant auditor chain of custody)
  uploaded_by     UUID REFERENCES auth.users(id),
  artifact_hash   TEXT,   -- SHA-256 of file content, set by upload handler

  -- Review state
  verified        BOOLEAN NOT NULL DEFAULT false,
  verified_by     UUID REFERENCES auth.users(id),
  verified_at     TIMESTAMPTZ,
  notes           TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pca_tenant_idx      ON provider_compliance_artifacts (tenant_id);
CREATE INDEX IF NOT EXISTS pca_type_idx        ON provider_compliance_artifacts (artifact_type);
CREATE INDEX IF NOT EXISTS pca_expires_idx     ON provider_compliance_artifacts (expires_at)
  WHERE expires_at IS NOT NULL;

CREATE OR REPLACE FUNCTION pca_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS pca_updated_at ON provider_compliance_artifacts;
CREATE TRIGGER pca_updated_at
  BEFORE UPDATE ON provider_compliance_artifacts
  FOR EACH ROW EXECUTE FUNCTION pca_set_updated_at();

ALTER TABLE provider_compliance_artifacts ENABLE ROW LEVEL SECURITY;

-- Provider admin: full access to own tenant's artifacts
CREATE POLICY "pca_provider_admin"
  ON provider_compliance_artifacts FOR ALL
  TO authenticated
  USING (
    tenant_id = get_my_tenant_id()
    AND is_provider_admin()
  )
  WITH CHECK (
    tenant_id = get_my_tenant_id()
    AND is_provider_admin()
  );

-- Admin/staff: full access to all
CREATE POLICY "pca_admin_all"
  ON provider_compliance_artifacts FOR ALL
  TO authenticated
  USING (is_admin_role())
  WITH CHECK (is_admin_role());

-- =============================================================================
-- 2. provider_onboarding_steps
-- =============================================================================
-- One row per tenant per step. Populated by triggers and API actions.
-- Steps in order: profile_complete, mou_signed, first_program_submitted,
--   first_program_approved, first_enrollment.

CREATE TABLE IF NOT EXISTS provider_onboarding_steps (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  step        TEXT NOT NULL CHECK (step IN (
                'profile_complete',
                'mou_signed',
                'first_program_submitted',
                'first_program_approved',
                'first_enrollment'
              )),
  completed   BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),  -- NULL = system-completed
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (tenant_id, step)
);

CREATE INDEX IF NOT EXISTS pos_tenant_idx ON provider_onboarding_steps (tenant_id);

ALTER TABLE provider_onboarding_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pos_provider_read"
  ON provider_onboarding_steps FOR SELECT
  TO authenticated
  USING (tenant_id = get_my_tenant_id());

CREATE POLICY "pos_admin_all"
  ON provider_onboarding_steps FOR ALL
  TO authenticated
  USING (is_admin_role())
  WITH CHECK (is_admin_role());

-- Function: seed onboarding steps when a tenant is provisioned.
-- Called from provision_provider() after tenant insert, or manually.
CREATE OR REPLACE FUNCTION seed_provider_onboarding(p_tenant_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO provider_onboarding_steps (tenant_id, step)
  VALUES
    (p_tenant_id, 'profile_complete'),
    (p_tenant_id, 'mou_signed'),
    (p_tenant_id, 'first_program_submitted'),
    (p_tenant_id, 'first_program_approved'),
    (p_tenant_id, 'first_enrollment')
  ON CONFLICT (tenant_id, step) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION seed_provider_onboarding TO service_role;

-- Function: get onboarding completion percentage for a tenant.
CREATE OR REPLACE FUNCTION get_provider_onboarding_status(p_tenant_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total     INT;
  v_done      INT;
  v_next_step TEXT;
BEGIN
  SELECT COUNT(*), COUNT(*) FILTER (WHERE completed = true)
  INTO v_total, v_done
  FROM provider_onboarding_steps
  WHERE tenant_id = p_tenant_id;

  SELECT step INTO v_next_step
  FROM provider_onboarding_steps
  WHERE tenant_id = p_tenant_id AND completed = false
  ORDER BY created_at ASC
  LIMIT 1;

  RETURN jsonb_build_object(
    'total',      v_total,
    'completed',  v_done,
    'percent',    CASE WHEN v_total = 0 THEN 0 ELSE round((v_done::NUMERIC / v_total) * 100) END,
    'next_step',  v_next_step,
    'done',       v_done = v_total AND v_total > 0
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_provider_onboarding_status TO authenticated, service_role;

-- =============================================================================
-- 3. program_catalog_index
-- =============================================================================
-- Denormalized search table. One row per published program.
-- Refreshed by trigger on programs.published / programs.is_active changes.
-- Enables hub-wide catalog queries without cross-tenant joins or RLS bypass.

CREATE TABLE IF NOT EXISTS program_catalog_index (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id          UUID NOT NULL UNIQUE REFERENCES programs(id) ON DELETE CASCADE,
  tenant_id           UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Provider identity (denormalized for catalog queries)
  provider_name       TEXT NOT NULL,
  provider_slug       TEXT NOT NULL,

  -- Program identity
  title               TEXT NOT NULL,
  slug                TEXT,
  category            TEXT,
  program_type        TEXT,

  -- Funding eligibility (denormalized for filter queries)
  wioa_eligible       BOOLEAN NOT NULL DEFAULT false,
  jri_eligible        BOOLEAN NOT NULL DEFAULT false,
  wrg_eligible        BOOLEAN NOT NULL DEFAULT false,
  funding_tags        TEXT[] NOT NULL DEFAULT '{}',

  -- Credential
  credential_type     TEXT,
  credential_name     TEXT,
  credential_authority TEXT,

  -- Scheduling
  duration_weeks      INTEGER,
  next_start_date     DATE,
  seats_available     INTEGER,
  delivery_mode       TEXT,   -- 'in_person' | 'online' | 'hybrid'

  -- Geography
  service_area        TEXT,
  city                TEXT,
  state               TEXT NOT NULL DEFAULT 'IN',

  -- Outcomes (from programs table)
  completion_rate     NUMERIC(5,2),
  placement_rate      NUMERIC(5,2),

  -- Search
  search_vector       TSVECTOR,

  indexed_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at        TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS pci_tenant_idx       ON program_catalog_index (tenant_id);
CREATE INDEX IF NOT EXISTS pci_category_idx     ON program_catalog_index (category);
CREATE INDEX IF NOT EXISTS pci_wioa_idx         ON program_catalog_index (wioa_eligible) WHERE wioa_eligible = true;
CREATE INDEX IF NOT EXISTS pci_start_date_idx   ON program_catalog_index (next_start_date);
CREATE INDEX IF NOT EXISTS pci_search_idx       ON program_catalog_index USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS pci_state_idx        ON program_catalog_index (state);

-- No RLS: catalog is public read. Writes are service_role only (via trigger/function).
ALTER TABLE program_catalog_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pci_public_read"
  ON program_catalog_index FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "pci_service_write"
  ON program_catalog_index FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function: upsert one program into the catalog index.
CREATE OR REPLACE FUNCTION upsert_program_catalog_entry(p_program_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prog  programs%ROWTYPE;
  v_tenant tenants%ROWTYPE;
BEGIN
  SELECT * INTO v_prog FROM programs WHERE id = p_program_id;
  IF NOT FOUND THEN RETURN; END IF;

  -- Only index published, active programs with a tenant
  IF v_prog.tenant_id IS NULL OR NOT (v_prog.published AND v_prog.is_active) THEN
    DELETE FROM program_catalog_index WHERE program_id = p_program_id;
    RETURN;
  END IF;

  SELECT * INTO v_tenant FROM tenants WHERE id = v_prog.tenant_id;
  IF NOT FOUND OR v_tenant.status != 'active' THEN
    DELETE FROM program_catalog_index WHERE program_id = p_program_id;
    RETURN;
  END IF;

  INSERT INTO program_catalog_index (
    program_id, tenant_id, provider_name, provider_slug,
    title, slug, category, program_type,
    wioa_eligible, funding_tags,
    credential_type, credential_name,
    duration_weeks, next_start_date, seats_available,
    service_area, state,
    completion_rate, placement_rate,
    search_vector, indexed_at, published_at
  ) VALUES (
    v_prog.id,
    v_prog.tenant_id,
    v_tenant.name,
    v_tenant.slug,
    COALESCE(v_prog.title, v_prog.name, ''),
    v_prog.slug,
    v_prog.category,
    v_prog.type,
    COALESCE(v_prog.wioa_approved, v_prog.funding_eligible, false),
    COALESCE(v_prog.funding_tags, '{}'),
    v_prog.credential_type,
    v_prog.credential_name,
    COALESCE(v_prog.estimated_weeks, v_prog.duration_weeks),
    v_prog.next_start_date,
    v_prog.seats_available,
    NULL,  -- service_area populated from organizations if needed
    COALESCE(v_prog.state_code, 'IN'),
    v_prog.completion_rate,
    v_prog.placement_rate,
    to_tsvector('english',
      coalesce(v_prog.title, v_prog.name, '') || ' ' ||
      coalesce(v_prog.description, '') || ' ' ||
      coalesce(v_prog.category, '') || ' ' ||
      coalesce(v_prog.credential_name, '') || ' ' ||
      coalesce(v_tenant.name, '')
    ),
    now(),
    now()
  )
  ON CONFLICT (program_id) DO UPDATE SET
    provider_name    = EXCLUDED.provider_name,
    provider_slug    = EXCLUDED.provider_slug,
    title            = EXCLUDED.title,
    slug             = EXCLUDED.slug,
    category         = EXCLUDED.category,
    program_type     = EXCLUDED.program_type,
    wioa_eligible    = EXCLUDED.wioa_eligible,
    funding_tags     = EXCLUDED.funding_tags,
    credential_type  = EXCLUDED.credential_type,
    credential_name  = EXCLUDED.credential_name,
    duration_weeks   = EXCLUDED.duration_weeks,
    next_start_date  = EXCLUDED.next_start_date,
    seats_available  = EXCLUDED.seats_available,
    state            = EXCLUDED.state,
    completion_rate  = EXCLUDED.completion_rate,
    placement_rate   = EXCLUDED.placement_rate,
    search_vector    = EXCLUDED.search_vector,
    indexed_at       = now();
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_program_catalog_entry TO service_role;

-- Trigger: keep catalog index in sync when programs are published/unpublished.
CREATE OR REPLACE FUNCTION trg_sync_program_catalog()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Fire on insert, or when published/is_active/tenant_id changes
  IF TG_OP = 'INSERT'
    OR OLD.published IS DISTINCT FROM NEW.published
    OR OLD.is_active IS DISTINCT FROM NEW.is_active
    OR OLD.tenant_id IS DISTINCT FROM NEW.tenant_id
    OR OLD.title IS DISTINCT FROM NEW.title
    OR OLD.next_start_date IS DISTINCT FROM NEW.next_start_date
    OR OLD.seats_available IS DISTINCT FROM NEW.seats_available
  THEN
    PERFORM upsert_program_catalog_entry(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_program_catalog ON programs;
CREATE TRIGGER sync_program_catalog
  AFTER INSERT OR UPDATE ON programs
  FOR EACH ROW EXECUTE FUNCTION trg_sync_program_catalog();

DROP TRIGGER IF EXISTS remove_program_catalog ON programs;
CREATE OR REPLACE FUNCTION trg_remove_program_catalog()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM program_catalog_index WHERE program_id = OLD.id;
  RETURN OLD;
END;
$$;
CREATE TRIGGER remove_program_catalog
  AFTER DELETE ON programs
  FOR EACH ROW EXECUTE FUNCTION trg_remove_program_catalog();

-- =============================================================================
-- 4. Extend organizations table
-- =============================================================================

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS logo_url            TEXT,
  ADD COLUMN IF NOT EXISTS tagline             TEXT,
  ADD COLUMN IF NOT EXISTS support_email       TEXT,
  ADD COLUMN IF NOT EXISTS service_area_counties TEXT[],
  ADD COLUMN IF NOT EXISTS suspension_reason   TEXT,
  ADD COLUMN IF NOT EXISTS suspended_at        TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS offboarded_at       TIMESTAMPTZ;

-- =============================================================================
-- 5. Extend tenant_compliance_records
-- =============================================================================

ALTER TABLE tenant_compliance_records
  ADD COLUMN IF NOT EXISTS expires_at   DATE,
  ADD COLUMN IF NOT EXISTS artifact_id  UUID REFERENCES provider_compliance_artifacts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS tcr_expires_idx ON tenant_compliance_records (expires_at)
  WHERE expires_at IS NOT NULL;

-- =============================================================================
-- 6. Seed onboarding steps for existing partner_provider tenants
-- =============================================================================

DO $$
DECLARE v_tid UUID;
BEGIN
  FOR v_tid IN
    SELECT id FROM tenants WHERE type = 'partner_provider'
  LOOP
    PERFORM seed_provider_onboarding(v_tid);
  END LOOP;
END;
$$;
