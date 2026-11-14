-- Fix applications table RLS policy conflict that causes mirror failures.
--
-- Root cause: multiple overlapping RESTRICTIVE policies on `public.applications`
-- (applications_admin_all, applications_own_read, users_own, "Users can view own
-- applications") apply to the `authenticated` and `public` roles. When the
-- service_role client calls .insert().select('id'), Supabase executes the INSERT
-- then a SELECT to return the new row. If the service_role JWT is evaluated
-- against any RESTRICTIVE SELECT policy that requires user_id = auth.uid() (which
-- is NULL for service_role), the SELECT returns 0 rows — the insert succeeds but
-- .maybeSingle() returns null, producing the intake-${Date.now()} fallback ID.
--
-- Fix: drop all conflicting policies and replace with a clean, non-overlapping set:
--   1. service_role → unrestricted ALL (bypasses RLS entirely in practice, but
--      explicit policy ensures no RESTRICTIVE policy can interfere)
--   2. admin/staff  → ALL via is_admin() check
--   3. authenticated user → SELECT own rows only
--   4. public/anon  → INSERT only (intake form submissions)

-- ── Drop every existing policy on public.applications ────────────────────────
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='applications'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.applications', r.policyname);
  END LOOP;
END $$;

-- ── Re-enable RLS (idempotent) ───────────────────────────────────────────────
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- ── 1. Service role: full access, no restrictions ────────────────────────────
-- Explicit policy so RESTRICTIVE policies on other roles cannot bleed through.
CREATE POLICY "service_role_all"
  ON public.applications
  AS PERMISSIVE
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── 2. Admins and staff: full access ─────────────────────────────────────────
CREATE POLICY "admin_all"
  ON public.applications
  AS PERMISSIVE
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff', 'org_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff', 'org_admin')
    )
  );

-- ── 3. Authenticated users: read own applications ────────────────────────────
CREATE POLICY "user_read_own"
  ON public.applications
  AS PERMISSIVE
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

-- ── 4. Public / anon: insert only (intake form, apply form) ──────────────────
-- Email format check prevents junk submissions.
CREATE POLICY "public_insert"
  ON public.applications
  AS PERMISSIVE
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND length(email) <= 255
    AND email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'
  );
