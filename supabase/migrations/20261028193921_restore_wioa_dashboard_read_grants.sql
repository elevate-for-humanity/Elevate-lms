-- Restore the read contract already enforced by each table's existing RLS policies.
-- No anonymous access, write permissions, policy changes, or MFA bypass.
DO $$
DECLARE
  target text;
BEGIN
  FOREACH target IN ARRAY ARRAY['wioa_participants', 'wioa_compliance_reports', 'compliance_alerts']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relname = target AND c.relrowsecurity
    ) OR NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = target
        AND policyname = 'require_privileged_aal2' AND permissive = 'RESTRICTIVE'
    ) THEN
      RAISE EXCEPTION 'Refusing to restore read access without RLS and restrictive MFA on %', target;
    END IF;
    EXECUTE format('GRANT SELECT ON TABLE public.%I TO authenticated', target);
  END LOOP;
END $$;
