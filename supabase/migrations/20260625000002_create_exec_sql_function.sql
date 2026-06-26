-- Migration: Create exec_sql RPC function for migration runner
-- Applied: 2026-06-25
-- Purpose: Required by scripts/db/runMigrations.js to execute SQL via REST API

-- Create in extensions schema if it exists, otherwise public
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'extensions') THEN
    CREATE OR REPLACE FUNCTION extensions.exec_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog, extensions
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  ELSE
    CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = pg_catalog
    AS $$
    BEGIN
      EXECUTE sql;
    END;
    $$;
  END IF;
END
$$;

-- Grant access to service_role
GRANT EXECUTE ON FUNCTION extensions.exec_sql(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;

-- Record this migration
INSERT INTO public.efh_migrations (filename, executed_at)
VALUES ('20260625000002_create_exec_sql_function.sql', NOW())
ON CONFLICT (filename) DO NOTHING;
