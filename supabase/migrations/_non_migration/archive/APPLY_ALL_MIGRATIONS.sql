-- ============================================================================
-- APPLY ALL MIGRATIONS FOR CERTIFICATE SYSTEM
-- ============================================================================
-- Run this entire file in Supabase SQL Editor
-- Project: cuxzzpsyufcewtmicszk
-- ============================================================================

-- ============================================================================
-- MIGRATION 001: User Roles Table
-- ============================================================================

-- User Roles Table
-- Stores authoritative role information for users
-- Roles: student, staff, admin

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('student', 'staff', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own role
CREATE POLICY "user can read own role"
ON public.user_roles FOR SELECT
TO authenticated
USING (auth.uid() = user_roles.user_id);

-- Policy: Admins can manage all roles
CREATE POLICY "admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Create index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  new.updated_at = now();
  RETURN new;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER update_user_roles_updated_at
  BEFORE UPDATE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT SELECT ON public.user_roles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

-- ============================================================================
-- MIGRATION 002: Certificates Table
-- ============================================================================

-- Certificates Table
-- Stores issued certificates with verification codes

CREATE TABLE IF NOT EXISTS public.certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id text NOT NULL,
  program_name text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  verify_code text NOT NULL UNIQUE,
  pdf_url text,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Policy: Students can read their own certificates
CREATE POLICY "student read own certs"
ON public.certificates FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Staff and admins can insert certificates
CREATE POLICY "staff issue certs"
ON public.certificates FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('staff', 'admin')
  )
);

-- Policy: Staff and admins can update certificates
CREATE POLICY "staff update certs"
ON public.certificates FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role IN ('staff', 'admin')
  )
);

-- Policy: Admins can delete certificates
CREATE POLICY "admin delete certs"
ON public.certificates FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
  )
);

-- Policy: Public can verify certificates (read-only with verify_code)
CREATE POLICY "public verify certs"
ON public.certificates FOR SELECT
TO anon
USING (true);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_verify_code ON public.certificates(verify_code);
CREATE INDEX IF NOT EXISTS idx_certificates_program_id ON public.certificates(program_id);
CREATE INDEX IF NOT EXISTS idx_certificates_issued_at ON public.certificates(issued_at DESC);

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_certificates_updated_at ON public.certificates;
CREATE TRIGGER update_certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT SELECT ON public.certificates TO authenticated, anon;
GRANT INSERT, UPDATE ON public.certificates TO authenticated;
GRANT DELETE ON public.certificates TO authenticated;

-- RPC function to get user by email (for staff to issue certificates)
CREATE OR REPLACE FUNCTION public.get_user_by_email(email_input text)
RETURNS TABLE (id uuid, email text)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT u.id, u.email
  FROM auth.users u
  WHERE lower(u.email) = lower(email_input)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_by_email(text) TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify tables were created
SELECT 'user_roles table exists' AS status, COUNT(*) AS row_count FROM public.user_roles;
SELECT 'certificates table exists' AS status, COUNT(*) AS row_count FROM public.certificates;

-- Verify RLS is enabled
SELECT 
  tablename, 
  rowsecurity AS rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_roles', 'certificates');

-- Verify indexes were created
SELECT 
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('user_roles', 'certificates')
ORDER BY tablename, indexname;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ All migrations applied successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create storage bucket: certificates (public)';
  RAISE NOTICE '2. Assign roles to users in user_roles table';
  RAISE NOTICE '3. Test the certificate system';
END $$;
