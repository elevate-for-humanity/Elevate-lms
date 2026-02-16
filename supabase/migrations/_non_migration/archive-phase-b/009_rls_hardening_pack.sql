-- ============================================
-- RLS HARDENING PACK (IDEMPOTENT)
-- - Fixes org_scoped policy patterns to use organization_users
-- - Removes permissive org_invites select
-- - Adds RPC for token-bound invite lookup (no enumeration)
-- ============================================

-- Helper: does a table exist?
CREATE OR REPLACE FUNCTION public._table_exists(t text)
RETURNS boolean
LANGUAGE sql
AS $$
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = t
  );
$$;

-- Helper: is user a member of org?
CREATE OR REPLACE FUNCTION public._is_org_member(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_users ou
    WHERE ou.organization_id = org_id
      AND ou.user_id = auth.uid()
  );
$$;

-- Helper: is user admin of org?
CREATE OR REPLACE FUNCTION public._is_org_admin(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_users ou
    WHERE ou.organization_id = org_id
      AND ou.user_id = auth.uid()
      AND ou.role IN ('org_admin','super_admin')
  );
$$;

-- Helper: is user super_admin anywhere?
CREATE OR REPLACE FUNCTION public._is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_users ou
    WHERE ou.user_id = auth.uid()
      AND ou.role = 'super_admin'
  );
$$;

-- ============================================
-- 1) ORG_INVITES HARDENING (NO ENUMERATION)
-- ============================================
DO $$
BEGIN
  IF public._table_exists('org_invites') THEN
    -- Ensure RLS is enabled
    EXECUTE 'ALTER TABLE public.org_invites ENABLE ROW LEVEL SECURITY';

    -- Drop permissive policies if present
    EXECUTE 'DROP POLICY IF EXISTS "anyone_can_view_own_invite" ON public.org_invites';
    EXECUTE 'DROP POLICY IF EXISTS "public_select" ON public.org_invites';

    -- Admins manage invites (keep/replace safely)
    EXECUTE 'DROP POLICY IF EXISTS "org_admins_manage_invites" ON public.org_invites';
    EXECUTE $pol$
      CREATE POLICY "org_admins_manage_invites"
      ON public.org_invites
      FOR ALL
      USING (public._is_org_admin(organization_id) OR public._is_super_admin())
    $pol$;

    -- Admins can SELECT invites in their org (explicit)
    EXECUTE 'DROP POLICY IF EXISTS "org_admins_view_invites" ON public.org_invites';
    EXECUTE $pol$
      CREATE POLICY "org_admins_view_invites"
      ON public.org_invites
      FOR SELECT
      USING (public._is_org_admin(organization_id) OR public._is_super_admin())
    $pol$;
  END IF;
END $$;

-- Token lookup RPC (SECURITY DEFINER) for accept-invite flow
-- This avoids exposing SELECT on org_invites to non-admins.
DO $$
BEGIN
  IF public._table_exists('org_invites') THEN
    EXECUTE $fn$
      CREATE OR REPLACE FUNCTION public.get_org_invite_by_token(p_token text)
      RETURNS TABLE (
        id uuid,
        organization_id uuid,
        email text,
        role text,
        expires_at timestamptz,
        accepted_at timestamptz,
        organization_name text,
        organization_slug text,
        inviter_name text
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      SET search_path = public
      AS $body$
      BEGIN
        RETURN QUERY
        SELECT
          i.id,
          i.organization_id,
          i.email,
          i.role,
          i.expires_at,
          i.accepted_at,
          o.name AS organization_name,
          o.slug AS organization_slug,
          p.full_name AS inviter_name
        FROM public.org_invites i
        JOIN public.organizations o ON o.id = i.organization_id
        LEFT JOIN public.profiles p ON p.user_id = i.invited_by
        WHERE i.token = p_token
        LIMIT 1;
      END;
      $body$;
    $fn$;

    -- Allow authenticated users to EXECUTE RPC (not table select)
    EXECUTE 'REVOKE ALL ON FUNCTION public.get_org_invite_by_token(text) FROM PUBLIC';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_org_invite_by_token(text) TO authenticated';
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.get_org_invite_by_token(text) TO anon';
  END IF;
END $$;

-- ============================================
-- 2) STANDARD ORG-SCOPED POLICIES TEMPLATE
-- Apply to known sensitive tables IF they exist.
-- ============================================
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'organization_settings',
    'organization_subscriptions',
    'students',
    'enrollments',
    'lesson_progress',
    'certificates',
    'student_documents',
    'student_attendance',
    'student_grades',
    'student_notes',
    'hr_documents',
    'payroll_cards',
    'time_tracking',
    'purchases',
    'licenses',
    'invoices',
    'payment_splits',
    'notifications',
    'messages'
  ]
  LOOP
    IF public._table_exists(t) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

      -- Drop overly generic policies if they exist (safe attempt)
      EXECUTE format('DROP POLICY IF EXISTS "org_members_access" ON public.%I', t);
      EXECUTE format('DROP POLICY IF EXISTS "admins_full_access" ON public.%I', t);
      EXECUTE format('DROP POLICY IF EXISTS "users_own_records" ON public.%I', t);

      -- If table has organization_id column, enforce org scope
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name=t AND column_name='organization_id'
      ) THEN
        EXECUTE format('DROP POLICY IF EXISTS "org_member_select" ON public.%I', t);
        EXECUTE format($pol$
          CREATE POLICY "org_member_select"
          ON public.%I
          FOR SELECT
          USING (public._is_org_member(organization_id) OR public._is_super_admin())
        $pol$, t);

        EXECUTE format('DROP POLICY IF EXISTS "org_admin_write" ON public.%I', t);
        EXECUTE format($pol$
          CREATE POLICY "org_admin_write"
          ON public.%I
          FOR INSERT
          WITH CHECK (public._is_org_admin(organization_id) OR public._is_super_admin())
        $pol$, t);

        EXECUTE format('DROP POLICY IF EXISTS "org_admin_update" ON public.%I', t);
        EXECUTE format($pol$
          CREATE POLICY "org_admin_update"
          ON public.%I
          FOR UPDATE
          USING (public._is_org_admin(organization_id) OR public._is_super_admin())
        $pol$, t);

        EXECUTE format('DROP POLICY IF EXISTS "org_admin_delete" ON public.%I', t);
        EXECUTE format($pol$
          CREATE POLICY "org_admin_delete"
          ON public.%I
          FOR DELETE
          USING (public._is_org_admin(organization_id) OR public._is_super_admin())
        $pol$, t);
      END IF;

      -- If table has user_id column and no org_id, apply user-ownership select/write
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name=t AND column_name='user_id'
      ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name=t AND column_name='organization_id'
      ) THEN
        EXECUTE format('DROP POLICY IF EXISTS "user_owns_select" ON public.%I', t);
        EXECUTE format($pol$
          CREATE POLICY "user_owns_select"
          ON public.%I
          FOR SELECT
          USING (user_id = auth.uid() OR public._is_super_admin())
        $pol$, t);

        EXECUTE format('DROP POLICY IF EXISTS "user_owns_write" ON public.%I', t);
        EXECUTE format($pol$
          CREATE POLICY "user_owns_write"
          ON public.%I
          FOR INSERT
          WITH CHECK (user_id = auth.uid() OR public._is_super_admin())
        $pol$, t);

        EXECUTE format('DROP POLICY IF EXISTS "user_owns_update" ON public.%I', t);
        EXECUTE format($pol$
          CREATE POLICY "user_owns_update"
          ON public.%I
          FOR UPDATE
          USING (user_id = auth.uid() OR public._is_super_admin())
        $pol$, t);

        EXECUTE format('DROP POLICY IF EXISTS "user_owns_delete" ON public.%I', t);
        EXECUTE format($pol$
          CREATE POLICY "user_owns_delete"
          ON public.%I
          FOR DELETE
          USING (user_id = auth.uid() OR public._is_super_admin())
        $pol$, t);
      END IF;

    END IF;
  END LOOP;
END $$;

-- ============================================
-- 3) AUDIT_LOGS SPECIAL HANDLING
-- Service role insert, super admin view only
-- ============================================
DO $$
BEGIN
  IF public._table_exists('audit_logs') THEN
    EXECUTE 'ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY';
    
    EXECUTE 'DROP POLICY IF EXISTS "service_role_insert_audit_logs" ON public.audit_logs';
    EXECUTE $pol$
      CREATE POLICY "service_role_insert_audit_logs"
      ON public.audit_logs
      FOR INSERT
      TO service_role
      WITH CHECK (true)
    $pol$;

    EXECUTE 'DROP POLICY IF EXISTS "super_admin_view_audit_logs" ON public.audit_logs';
    EXECUTE $pol$
      CREATE POLICY "super_admin_view_audit_logs"
      ON public.audit_logs
      FOR SELECT
      USING (public._is_super_admin())
    $pol$;
  END IF;
END $$;

-- Drop helper function (no longer needed after migration)
DROP FUNCTION IF EXISTS public._table_exists(text);

-- Comments
COMMENT ON FUNCTION public._is_org_member(uuid) IS 'Check if current user is member of organization';
COMMENT ON FUNCTION public._is_org_admin(uuid) IS 'Check if current user is admin of organization';
COMMENT ON FUNCTION public._is_super_admin() IS 'Check if current user is super admin';
COMMENT ON FUNCTION public.get_org_invite_by_token(text) IS 'Token-bound invite lookup (no enumeration)';
