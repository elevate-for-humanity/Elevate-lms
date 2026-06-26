-- Migration: Create exec_sql RPC function for migration runner
-- Applied: 2026-06-25
-- Purpose: Required by scripts/db/runMigrations.js to execute SQL via REST API

CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO service_role;
