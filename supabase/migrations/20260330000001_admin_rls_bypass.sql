-- Admin RLS bypass: grant admin/super_admin/staff full read+write on all tables.

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin', 'staff')
  );
$$;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND rowsecurity = true
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl AND policyname = 'admin_bypass_select'
    ) THEN
      EXECUTE format('CREATE POLICY admin_bypass_select ON public.%I FOR SELECT TO authenticated USING (public.is_admin())', tbl);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl AND policyname = 'admin_bypass_insert'
    ) THEN
      EXECUTE format('CREATE POLICY admin_bypass_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_admin())', tbl);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl AND policyname = 'admin_bypass_update'
    ) THEN
      EXECUTE format('CREATE POLICY admin_bypass_update ON public.%I FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin())', tbl);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = tbl AND policyname = 'admin_bypass_delete'
    ) THEN
      EXECUTE format('CREATE POLICY admin_bypass_delete ON public.%I FOR DELETE TO authenticated USING (public.is_admin())', tbl);
    END IF;
  END LOOP;
END;
$$;
