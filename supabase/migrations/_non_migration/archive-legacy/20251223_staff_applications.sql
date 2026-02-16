CREATE TABLE IF NOT EXISTS staff_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('staff', 'instructor')),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  qualifications text NOT NULL,
  status text DEFAULT 'pending_review' CHECK (status IN ('pending_review', 'approved', 'rejected')),
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_staff_applications_tenant ON staff_applications(tenant_id);
CREATE INDEX idx_staff_applications_email ON staff_applications(email);
CREATE INDEX idx_staff_applications_status ON staff_applications(status);
CREATE INDEX idx_staff_applications_role ON staff_applications(role);

ALTER TABLE staff_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view staff applications"
  ON staff_applications FOR SELECT
  TO authenticated
  USING (
    tenant_id IN (
      SELECT tenant_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Anyone can submit staff applications"
  ON staff_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
