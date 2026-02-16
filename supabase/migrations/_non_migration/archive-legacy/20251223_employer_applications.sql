CREATE TABLE IF NOT EXISTS employer_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  industry text,
  company_size text,
  contact_first_name text NOT NULL,
  contact_last_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  hiring_needs text,
  status text DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'verified', 'rejected')),
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_employer_applications_tenant ON employer_applications(tenant_id);
CREATE INDEX idx_employer_applications_email ON employer_applications(contact_email);
CREATE INDEX idx_employer_applications_status ON employer_applications(status);

ALTER TABLE employer_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view employer applications"
  ON employer_applications FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Anyone can submit employer applications"
  ON employer_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
