-- Fix RLS on license_agreement_acceptances so authenticated users can sign agreements.
-- The table had GRANT applied but the INSERT policy was either missing or
-- incorrectly scoped, causing 403 for all authenticated users.

-- Ensure RLS is enabled
ALTER TABLE public.license_agreement_acceptances ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start clean
DROP POLICY IF EXISTS "Users can view own signatures" ON public.license_agreement_acceptances;
DROP POLICY IF EXISTS "Users can insert own signatures" ON public.license_agreement_acceptances;
DROP POLICY IF EXISTS "Users can sign agreements" ON public.license_agreement_acceptances;
DROP POLICY IF EXISTS "Authenticated users can sign" ON public.license_agreement_acceptances;
DROP POLICY IF EXISTS "Users can read own acceptances" ON public.license_agreement_acceptances;
DROP POLICY IF EXISTS "Admins can read all acceptances" ON public.license_agreement_acceptances;

-- SELECT: users can read their own records; admins can read all
CREATE POLICY "Users can read own acceptances"
  ON public.license_agreement_acceptances
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all acceptances"
  ON public.license_agreement_acceptances
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- INSERT: authenticated users can insert their own records only
CREATE POLICY "Users can sign agreements"
  ON public.license_agreement_acceptances
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: users can update their own records (re-signing)
CREATE POLICY "Users can update own acceptances"
  ON public.license_agreement_acceptances
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Ensure the authenticated role has the necessary privileges
GRANT SELECT, INSERT, UPDATE ON public.license_agreement_acceptances TO authenticated;
GRANT SELECT ON public.license_agreement_acceptances TO anon;
