-- Partner Inquiries Table
-- Stores all partnership inquiry submissions

CREATE TABLE IF NOT EXISTS partner_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  organization text,
  email text NOT NULL,
  phone text NOT NULL,
  relationship_type text NOT NULL,
  resources text NOT NULL,
  seeking text NOT NULL,
  written_agreement text NOT NULL,
  additional_info text,
  ip_acknowledged boolean DEFAULT true,
  status text DEFAULT 'pending', -- pending, reviewing, approved, declined
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  notes text,
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_inquiries_email ON partner_inquiries(email);
CREATE INDEX IF NOT EXISTS idx_partner_inquiries_status ON partner_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_partner_inquiries_submitted_at ON partner_inquiries(submitted_at DESC);

-- RLS Policies
ALTER TABLE partner_inquiries ENABLE ROW LEVEL SECURITY;

-- Only admins can view partner inquiries
CREATE POLICY "Admins can view partner inquiries"
  ON partner_inquiries
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Only admins can update partner inquiries
CREATE POLICY "Admins can update partner inquiries"
  ON partner_inquiries
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
CREATE POLICY "Anyone can submit partner inquiry"
  ON partner_inquiries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE partner_inquiries IS 'Partnership inquiry submissions with IP acknowledgment';
COMMENT ON COLUMN partner_inquiries.ip_acknowledged IS 'User acknowledged IP ownership before submission';
COMMENT ON COLUMN partner_inquiries.status IS 'pending, reviewing, approved, declined';
