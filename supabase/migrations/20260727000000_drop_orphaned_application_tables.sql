-- Migration: Drop orphaned application tables
-- These tables have no UI, no API, and are not referenced by any code
-- Created: 2026-07-27

-- Drop tables in correct order (respecting foreign keys)

-- Supersonic tables (already dropped per 20260627000011_drop_supersonic_tables.sql but verify)
DROP TABLE IF EXISTS public.supersonic_training_keys;
DROP TABLE IF EXISTS public.supersonic_tax_documents;
DROP TABLE IF EXISTS public.supersonic_careers;
DROP TABLE IF EXISTS public.supersonic_appointments;
DROP TABLE IF EXISTS public.supersonic_applications;

-- Cash advance tables
DROP TABLE IF EXISTS public.cash_advances;
DROP TABLE IF EXISTS public.cash_advance_applications;

-- Refund advance tables
DROP TABLE IF EXISTS public.refund_advance_applications;

-- Tax-related tables (not related to tax filing service)
DROP TABLE IF EXISTS public.tax_applications;

-- Tax filing tables
DROP TABLE IF EXISTS public.tax_filings;
DROP TABLE IF EXISTS public.tax_filing_applications;

-- Verify tables are dropped
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN (
      'supersonic_applications', 'supersonic_appointments', 'supersonic_careers',
      'supersonic_tax_documents', 'supersonic_training_keys',
      'cash_advances', 'cash_advance_applications',
      'refund_advance_applications',
      'tax_applications',
      'tax_filings', 'tax_filing_applications'
    )
  ) THEN
    RAISE WARNING 'Some orphaned tables may still exist';
  ELSE
    RAISE NOTICE 'All orphaned application tables dropped successfully';
  END IF;
END $$;
