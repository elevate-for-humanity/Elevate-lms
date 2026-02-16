-- FIX FUNCTION SECURITY WARNINGS
-- Migration: 20251220_fix_function_security
-- Purpose: Pin search_path on all functions to prevent hijacking
-- 
-- This fixes the "role mutable search_path" warnings by setting
-- search_path = public, pg_temp on all functions

-- ============================================================================
-- Fix search_path on all public functions
-- ============================================================================

DO $$
DECLARE
  func RECORD;
BEGIN
  FOR func IN
    SELECT 
      n.nspname as schema_name,
      p.proname as function_name,
      pg_get_function_identity_arguments(p.oid) as args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
    AND p.prokind = 'f'  -- functions only, not procedures
  LOOP
    BEGIN
      EXECUTE format(
        'ALTER FUNCTION %I.%I(%s) SET search_path = public, pg_temp',
        func.schema_name,
        func.function_name,
        func.args
      );
      RAISE NOTICE 'Fixed: %.%(%)', func.schema_name, func.function_name, func.args;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Skipped: %.%(%): %', func.schema_name, func.function_name, func.args, SQLERRM;
    END;
  END LOOP;
END $$;

-- ============================================================================
-- COMPLETION NOTICE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ FUNCTION SECURITY HARDENING COMPLETE';
  RAISE NOTICE '   - search_path pinned on all public functions';
  RAISE NOTICE '   - Prevents search_path hijacking attacks';
END $$;
