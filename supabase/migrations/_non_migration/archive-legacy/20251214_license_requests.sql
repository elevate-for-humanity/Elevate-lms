-- License Requests Table
-- Stores all licensing inquiry submissions

CREATE TABLE IF NOT EXISTS license_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  organization text,
  phone text,
  desired_tier text NOT NULL,
  launch_goal text NOT NULL,
  agreement_ack text NOT NULL,
  status text DEFAULT 'submitted', -- submitted, reviewed, declined, advanced
  internal_notes text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_license_requests_email ON license_requests(email);
CREATE INDEX IF NOT EXISTS idx_license_requests_status ON license_requests(status);
CREATE INDEX IF NOT EXISTS idx_license_requests_created_at ON license_requests(created_at DESC);

-- RLS Policies
ALTER TABLE license_requests ENABLE ROW LEVEL SECURITY;

-- Only admins can view license requests
CREATE POLICY "Admins can view license requests"
  ON license_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Only admins can update license requests
CREATE POLICY "Admins can update license requests"
  ON license_requests
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Anyone can insert (public form submission)
CREATE POLICY "Anyone can submit license request"
  ON license_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE license_requests IS 'Platform licensing inquiry submissions';
COMMENT ON COLUMN license_requests.status IS 'submitted, reviewed, declined, advanced';
