-- Enable RLS on signatures and add scoped policies.
--
-- The /api/signature/documents/[id]/sign route enforces signer_email = auth.email()
-- at the application layer. These policies add a DB-level backstop so no row can
-- be inserted with a signer_email that doesn't match the calling user's email,
-- and reads are scoped to the signer's own rows (admins see all).

ALTER TABLE public.signatures ENABLE ROW LEVEL SECURITY;

-- Service role bypasses RLS (Supabase default — explicit for clarity)
DROP POLICY IF EXISTS "Service role full access on signatures" ON public.signatures;
CREATE POLICY "Service role full access on signatures"
  ON public.signatures
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can insert a signature only for their own email
DROP POLICY IF EXISTS "Users can sign as themselves" ON public.signatures;
CREATE POLICY "Users can sign as themselves"
  ON public.signatures
  FOR INSERT
  TO authenticated
  WITH CHECK (
    signer_email IS NOT NULL
    AND lower(signer_email) = lower(auth.email())
  );

-- Users can read their own signatures
DROP POLICY IF EXISTS "Users can read own signatures" ON public.signatures;
CREATE POLICY "Users can read own signatures"
  ON public.signatures
  FOR SELECT
  TO authenticated
  USING (lower(signer_email) = lower(auth.email()));

-- Admins and staff can read all signatures
DROP POLICY IF EXISTS "Admins can read all signatures" ON public.signatures;
CREATE POLICY "Admins can read all signatures"
  ON public.signatures
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin', 'org_admin', 'staff')
    )
  );
