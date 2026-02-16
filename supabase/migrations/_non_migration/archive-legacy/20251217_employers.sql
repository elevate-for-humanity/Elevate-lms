-- Employers System
-- Links students to employers for apprenticeship hour approval

CREATE TABLE IF NOT EXISTS public.employers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_email text,
  contact_phone text,
  address text,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add employer_id to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS employer_id uuid REFERENCES public.employers(id);

-- Add employer_id to enrollments
ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS employer_id uuid REFERENCES public.employers(id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_employer ON user_profiles(employer_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_employer ON enrollments(employer_id);
CREATE INDEX IF NOT EXISTS idx_employers_active ON employers(active);

-- RLS Policies
ALTER TABLE employers ENABLE ROW LEVEL SECURITY;

-- Employers can view their own info
CREATE POLICY "Employers can view their info"
  ON employers
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT employer_id FROM user_profiles WHERE user_id = auth.uid()
    )
  );

-- Admins can view all employers
CREATE POLICY "Admins can view all employers"
  ON employers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Admins can manage employers
CREATE POLICY "Admins can manage employers"
  ON employers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Service role can manage everything
CREATE POLICY "Service role can manage employers"
  ON employers
  FOR ALL
  TO service_role
  USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_employers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employers_updated_at
  BEFORE UPDATE ON employers
  FOR EACH ROW
  EXECUTE FUNCTION update_employers_updated_at();

-- Comments
COMMENT ON TABLE employers IS 'Employers who supervise apprentices and approve hours';
COMMENT ON COLUMN user_profiles.employer_id IS 'Links students to their supervising employer';
COMMENT ON COLUMN enrollments.employer_id IS 'Links enrollments to supervising employer';

-- Seed example employer (optional)
INSERT INTO employers (name, contact_email)
VALUES ('Example Barber Shop', 'shop@example.com')
ON CONFLICT DO NOTHING;
