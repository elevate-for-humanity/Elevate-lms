-- Fix Supabase lint 0003_auth_rls_initplan (safe edition)
-- Wraps auth.uid(), auth.role(), auth.jwt(), and current_setting() in subselects
-- to prevent initplan performance issues in RLS policies

DO $rls$
DECLARE
  r RECORD;
  roles_sql TEXT;
  new_qual TEXT;
  new_with_check TEXT;
BEGIN
  FOR r IN
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      AND (
        (qual       IS NOT NULL AND (qual       ILIKE '%auth.%' OR qual       ILIKE '%current_setting(%'))
        OR
        (with_check IS NOT NULL AND (with_check ILIKE '%auth.%' OR with_check ILIKE '%current_setting(%'))
      )
  LOOP
    SELECT COALESCE(string_agg(quote_ident(x), ', '), 'PUBLIC')
      INTO roles_sql
    FROM unnest(r.roles) AS x;

    new_qual := r.qual;
    IF new_qual IS NOT NULL THEN
      new_qual := replace(new_qual, 'auth.uid()',  '(select auth.uid())');
      new_qual := replace(new_qual, 'auth.role()', '(select auth.role())');
      new_qual := replace(new_qual, 'auth.jwt()',  '(select auth.jwt())');
      new_qual := regexp_replace(
        new_qual,
        '(^|[^a-zA-Z0-9_])current_setting\(([^)]*)\)',
        '\1(select current_setting(\2))',
        'g'
      );
    END IF;

    new_with_check := r.with_check;
    IF new_with_check IS NOT NULL THEN
      new_with_check := replace(new_with_check, 'auth.uid()',  '(select auth.uid())');
      new_with_check := replace(new_with_check, 'auth.role()', '(select auth.role())');
      new_with_check := replace(new_with_check, 'auth.jwt()',  '(select auth.jwt())');
      new_with_check := regexp_replace(
        new_with_check,
        '(^|[^a-zA-Z0-9_])current_setting\(([^)]*)\)',
        '\1(select current_setting(\2))',
        'g'
      );
    END IF;

    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON %I.%I;',
      r.policyname, r.schemaname, r.tablename
    );

    EXECUTE format(
      'CREATE POLICY %I ON %I.%I AS %s FOR %s TO %s%s%s;',
      r.policyname,
      r.schemaname,
      r.tablename,
      CASE WHEN r.permissive::text = 'true' THEN 'PERMISSIVE' ELSE 'RESTRICTIVE' END,
      r.cmd,
      (CASE WHEN roles_sql IS NULL OR roles_sql = '' THEN 'PUBLIC' ELSE roles_sql END),
      CASE WHEN new_qual IS NOT NULL THEN ' USING (' || new_qual || ')' ELSE '' END,
      CASE WHEN new_with_check IS NOT NULL THEN ' WITH CHECK (' || new_with_check || ')' ELSE '' END
    );
  END LOOP;
END;
$rls$;
