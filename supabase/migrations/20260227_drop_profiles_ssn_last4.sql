-- ============================================================
-- Drop ssn_last4 from profiles table
--
-- PREREQUISITE: Run ONLY after verifying:
--   1. secure_identity table is populated and working
--   2. No app code reads/writes profiles.ssn_last4
--   3. No BI tools or exports reference profiles.ssn_last4
--   4. At least 14 days of production validation
--
-- Verification query (run before applying):
--   SELECT count(*) FROM secure_identity WHERE ssn_last4 IS NOT NULL;
--   -- Should match:
--   SELECT count(*) FROM profiles WHERE ssn_last4 IS NOT NULL AND ssn_last4 != '';
--
-- To apply: remove the safety guard below and run the migration.
-- ============================================================

-- Safety guard: prevent accidental execution
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'secure_identity' AND schemaname = 'public'
  ) THEN
    RAISE EXCEPTION 'secure_identity table does not exist. Run 20260226_isolate_ssn_from_profiles.sql first.';
  END IF;

  -- Verify data was migrated
  IF (SELECT count(*) FROM public.secure_identity WHERE ssn_last4 IS NOT NULL) = 0
     AND (SELECT count(*) FROM public.profiles WHERE ssn_last4 IS NOT NULL AND ssn_last4 != '') > 0
  THEN
    RAISE EXCEPTION 'secure_identity has no data but profiles still has ssn_last4 values. Migration incomplete.';
  END IF;
END $$;

-- Null out the column first (data minimization before schema change)
UPDATE public.profiles SET ssn_last4 = NULL WHERE ssn_last4 IS NOT NULL;

-- Drop the column
ALTER TABLE public.profiles DROP COLUMN IF EXISTS ssn_last4;

-- Audit the schema change
INSERT INTO public.admin_audit_events (actor_id, action, entity_type, entity_id, metadata, created_at)
VALUES (
  'system',
  'SCHEMA_CHANGE',
  'profiles',
  'ssn_last4_dropped',
  '{"description": "Dropped ssn_last4 column from profiles table", "reason": "PII minimization — data moved to secure_identity"}'::jsonb,
  now()
);
