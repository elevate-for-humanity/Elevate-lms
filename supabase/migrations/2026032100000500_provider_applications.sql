-- Provider applications: self-service onboarding for external training organizations.
-- Separate from partner_applications (barbershop-specific).
-- On approval, admin calls rpc_approve_partner() then rpc_link_partner_user().

CREATE TABLE IF NOT EXISTS provider_applications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Organization
  org_name              TEXT NOT NULL,
  org_type              TEXT NOT NULL CHECK (org_type IN (
                          'training_provider', 'workforce_agency', 'employer', 'community_org'
                        )),
  ein                   TEXT,
  website               TEXT,

  -- Contact
  contact_name          TEXT NOT NULL,
  contact_title         TEXT,
  contact_email         TEXT NOT NULL,
  contact_phone         TEXT NOT NULL,

  -- Address
  address_line1         TEXT NOT NULL,
  address_line2         TEXT,
  city                  TEXT NOT NULL,
  state                 TEXT NOT NULL DEFAULT 'IN',
  zip                   TEXT NOT NULL,

  -- Program details
  program_types         TEXT[] NOT NULL DEFAULT '{}',
  service_area          TEXT,
  annual_enrollment     INTEGER,
  credential_authorities TEXT[],

  -- Compliance
  wioa_eligible         BOOLEAN DEFAULT false,
  etpl_listed           BOOLEAN DEFAULT false,
  etpl_state            TEXT,
  accreditation         TEXT,

  -- Narrative
  mission_statement     TEXT,
  outcomes_description  TEXT,
  partnership_goals     TEXT,

  -- Agreement
  agreed_to_terms       BOOLEAN NOT NULL DEFAULT false,
  agreed_at             TIMESTAMPTZ,

  -- Workflow
  status                TEXT NOT NULL DEFAULT 'pending',
                          CHECK (status IN ('pending', 'under_review', 'approved', 'denied', 'withdrawn')),
  status_reason         TEXT,
  reviewed_by           UUID REFERENCES auth.users(id),
  reviewed_at           TIMESTAMPTZ,
  review_notes          TEXT,

  -- Link to created tenant on approval
  tenant_id             UUID REFERENCES tenants(id),

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent duplicate pending applications from the same email
CREATE UNIQUE INDEX IF NOT EXISTS provider_applications_email_pending_idx
  ON provider_applications (contact_email)
  WHERE status IN ('pending', 'under_review');

CREATE INDEX IF NOT EXISTS provider_applications_status_idx ON provider_applications (status);
CREATE INDEX IF NOT EXISTS provider_applications_created_idx ON provider_applications (created_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION provider_applications_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS provider_applications_updated_at ON provider_applications;
CREATE TRIGGER provider_applications_updated_at
  BEFORE UPDATE ON provider_applications
  FOR EACH ROW EXECUTE FUNCTION provider_applications_set_updated_at();

-- RLS
ALTER TABLE provider_applications ENABLE ROW LEVEL SECURITY;

-- Public can insert (unauthenticated applicants)
CREATE POLICY "provider_applications_public_insert"
  ON provider_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Applicant can read their own submission by email match (authenticated only)
CREATE POLICY "provider_applications_own_read"
  ON provider_applications FOR SELECT
  TO authenticated
  USING (contact_email = (SELECT email FROM profiles WHERE id = auth.uid() LIMIT 1));

-- Admin/staff can read and update all
CREATE POLICY "provider_applications_admin_all"
  ON provider_applications FOR ALL
  TO authenticated
  USING (is_admin_role())
  WITH CHECK (is_admin_role());
