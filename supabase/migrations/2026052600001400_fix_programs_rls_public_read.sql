-- Fix programs public read policy.
--
-- The original policy (20260214000006) used USING (status = 'active') but
-- migration 20260623000001 set all published programs to status = 'published'.
-- This meant the anon/static client could only see programs still on the old
-- 'active' status — typically only CDL — blocking the apply form program list
-- and any public-facing program queries.
--
-- Fix: allow SELECT on rows where status IN ('active', 'published').
-- 'archived' programs remain hidden from public.

DROP POLICY IF EXISTS "programs_public_read" ON public.programs;

CREATE POLICY "programs_public_read" ON public.programs
  FOR SELECT
  USING (status IN ('active', 'published'));
