-- Supersonic Starter only: jlqrfwxuhpzmuivdxvvz.
-- Apply through Supabase migration tooling, never the Elevate primary migration runner.
-- Preserve view definition, tables, records, trigger bodies and existing row policies.
ALTER VIEW public.sfc_tax_return_public_status SET (security_invoker = true);
ALTER FUNCTION public.handle_new_user() SET search_path = pg_catalog, public;
ALTER FUNCTION public.set_updated_at() SET search_path = pg_catalog, public;
ALTER FUNCTION public.sfc_set_updated_at() SET search_path = pg_catalog, public;
ALTER FUNCTION public.sfc_leads_set_updated_at() SET search_path = pg_catalog, public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
DO $verify$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relname='sfc_tax_return_public_status'
      AND c.reloptions @> ARRAY['security_invoker=true']
  ) THEN RAISE EXCEPTION 'Tax status view must enforce caller RLS'; END IF;
  IF has_function_privilege('anon','public.handle_new_user()','EXECUTE')
    OR has_function_privilege('authenticated','public.handle_new_user()','EXECUTE')
    OR has_function_privilege('anon','public.rls_auto_enable()','EXECUTE')
    OR has_function_privilege('authenticated','public.rls_auto_enable()','EXECUTE')
  THEN RAISE EXCEPTION 'Internal triggers must not be public RPCs'; END IF;
END
$verify$;

