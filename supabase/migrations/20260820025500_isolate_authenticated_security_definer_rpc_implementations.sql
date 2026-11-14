-- Government-audit RPC architecture: no SECURITY DEFINER implementation remains
-- directly exposed through the public PostgREST schema. Existing caller checks stay
-- inside the implementation; public RPC signatures become SECURITY INVOKER wrappers.
CREATE SCHEMA IF NOT EXISTS rpc_private AUTHORIZATION postgres;
REVOKE ALL ON SCHEMA rpc_private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA rpc_private TO authenticated, service_role;

DO $audit$
DECLARE
  r record;
  arg_refs text;
  volatility_sql text;
  body_sql text;
  create_sql text;
BEGIN
  FOR r IN
    SELECT
      p.oid,
      p.proname,
      pg_get_function_identity_arguments(p.oid) AS identity_args,
      pg_get_function_arguments(p.oid) AS full_args,
      pg_get_function_result(p.oid) AS result_type,
      p.pronargs,
      p.proretset,
      p.provolatile
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      AND p.prosecdef
      AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
    ORDER BY p.proname, pg_get_function_identity_arguments(p.oid)
  LOOP
    SELECT string_agg('$' || i::text, ', ' ORDER BY i)
      INTO arg_refs
    FROM generate_series(1, r.pronargs) AS g(i);
    arg_refs := coalesce(arg_refs, '');

    volatility_sql := CASE r.provolatile
      WHEN 'i' THEN 'IMMUTABLE'
      WHEN 's' THEN 'STABLE'
      ELSE 'VOLATILE'
    END;

    EXECUTE format(
      'ALTER FUNCTION public.%I(%s) SET SCHEMA rpc_private',
      r.proname,
      r.identity_args
    );

    EXECUTE format(
      'REVOKE ALL ON FUNCTION rpc_private.%I(%s) FROM PUBLIC, anon',
      r.proname,
      r.identity_args
    );
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION rpc_private.%I(%s) TO authenticated, service_role',
      r.proname,
      r.identity_args
    );

    IF r.proretset THEN
      body_sql := format('SELECT * FROM rpc_private.%I(%s)', r.proname, arg_refs);
    ELSE
      body_sql := format('SELECT rpc_private.%I(%s)', r.proname, arg_refs);
    END IF;

    create_sql := format(
      'CREATE FUNCTION public.%I(%s) RETURNS %s LANGUAGE sql %s SECURITY INVOKER SET search_path TO pg_catalog, public, rpc_private AS %L',
      r.proname,
      r.full_args,
      r.result_type,
      volatility_sql,
      body_sql
    );
    EXECUTE create_sql;

    EXECUTE format(
      'REVOKE ALL ON FUNCTION public.%I(%s) FROM PUBLIC, anon',
      r.proname,
      r.identity_args
    );
    EXECUTE format(
      'GRANT EXECUTE ON FUNCTION public.%I(%s) TO authenticated, service_role',
      r.proname,
      r.identity_args
    );
  END LOOP;
END
$audit$;