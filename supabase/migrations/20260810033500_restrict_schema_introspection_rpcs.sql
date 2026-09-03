-- Schema-inspection helpers are administrative tooling, not public APIs.
-- Restrict execution to service_role and pin a safe search_path so SECURITY
-- DEFINER execution cannot resolve attacker-controlled objects first.

REVOKE EXECUTE ON FUNCTION public.get_table_columns(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_table_columns(text[]) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_table_indexes(text[]) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_table_policies(text[]) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_view_def(text) FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_table_columns(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_table_columns(text[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_table_indexes(text[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_table_policies(text[]) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_view_def(text) TO service_role;

ALTER FUNCTION public.get_table_columns(text) SET search_path = pg_catalog, public;
ALTER FUNCTION public.get_table_columns(text[]) SET search_path = pg_catalog, public;
ALTER FUNCTION public.get_table_indexes(text[]) SET search_path = pg_catalog, public;
ALTER FUNCTION public.get_table_policies(text[]) SET search_path = pg_catalog, public;
ALTER FUNCTION public.get_view_def(text) SET search_path = pg_catalog, public;
