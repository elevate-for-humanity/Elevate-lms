-- Tighten certificates RLS: INSERT/UPDATE/DELETE admin-only
-- SELECT remains open for public credential verification
--
-- Context: Previous migrations left INSERT WITH CHECK (true),
-- allowing any authenticated user to insert certificates.
-- Certificates should only be minted by server-side logic (service role)
-- or admin users.

ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Drop all known certificate policies from previous migrations
DROP POLICY IF EXISTS "cert_select" ON certificates;
DROP POLICY IF EXISTS "cert_insert" ON certificates;
DROP POLICY IF EXISTS "Users can view own certificates" ON certificates;
DROP POLICY IF EXISTS "students_own_certificates" ON certificates;
DROP POLICY IF EXISTS "certificates_select" ON certificates;
DROP POLICY IF EXISTS "certificates_insert" ON certificates;
DROP POLICY IF EXISTS "certificates_update" ON certificates;
DROP POLICY IF EXISTS "certificates_delete" ON certificates;
DROP POLICY IF EXISTS "certificates_admin_write" ON certificates;

-- SELECT: public read for verification + users see own + admin sees all
DROP POLICY IF EXISTS "certificates_public_verify" ON certificates;
CREATE POLICY "certificates_public_verify"
  ON certificates FOR SELECT
  USING (true);

-- INSERT: admin only (server-side certificate issuance uses service role)
DROP POLICY IF EXISTS "certificates_admin_insert" ON certificates;
CREATE POLICY "certificates_admin_insert"
  ON certificates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- UPDATE: admin only (revocation, status changes)
DROP POLICY IF EXISTS "certificates_admin_update" ON certificates;
CREATE POLICY "certificates_admin_update"
  ON certificates FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- DELETE: admin only
DROP POLICY IF EXISTS "certificates_admin_delete" ON certificates;
CREATE POLICY "certificates_admin_delete"
  ON certificates FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Revoke direct INSERT grant if it was given to authenticated role
REVOKE INSERT, UPDATE, DELETE ON certificates FROM authenticated;
GRANT SELECT ON certificates TO authenticated;
GRANT SELECT ON certificates TO anon;
