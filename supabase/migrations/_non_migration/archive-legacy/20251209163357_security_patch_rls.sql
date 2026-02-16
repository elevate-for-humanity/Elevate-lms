-- Security Patch: Add RLS policies for applications table
-- Date: 2025-12-09

-- Drop existing policies if any
DROP POLICY IF EXISTS "Public can submit applications" ON applications;
DROP POLICY IF EXISTS "Admins can view all applications" ON applications;
DROP POLICY IF EXISTS "Users can view own applications" ON applications;
DROP POLICY IF EXISTS "Admins can update applications" ON applications;

-- Allow public to insert applications (for form submissions)
CREATE POLICY "Public can submit applications"
  ON applications FOR INSERT
  WITH CHECK (true);

-- Only admins can view all applications
CREATE POLICY "Admins can view all applications"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Users can view their own applications by email
CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

-- Only admins can update applications
CREATE POLICY "Admins can update applications"
  ON applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Only admins can delete applications
CREATE POLICY "Admins can delete applications"
  ON applications FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email);

-- Log the security patch
INSERT INTO migration_log (migration_name, applied_at, description)
VALUES (
  'security_patch_rls',
  NOW(),
  'Added RLS policies for applications table - Security Audit 2025-12-09'
) ON CONFLICT DO NOTHING;
