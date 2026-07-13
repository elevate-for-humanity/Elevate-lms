-- Drop all Supersonic Fast Cash tables.
-- These were part of a separate tax prep business (SupersonicFastCash / SupersonicFasterMoney)
-- that has been fully removed from the Elevate LMS codebase. No application code references
-- these tables anymore.
--
-- Run in Supabase Dashboard → SQL Editor.

DROP TABLE IF EXISTS public.supersonic_training_keys CASCADE;
DROP TABLE IF EXISTS public.supersonic_tax_documents CASCADE;
DROP TABLE IF EXISTS public.supersonic_careers CASCADE;
DROP TABLE IF EXISTS public.supersonic_appointments CASCADE;
DROP TABLE IF EXISTS public.supersonic_applications CASCADE;
