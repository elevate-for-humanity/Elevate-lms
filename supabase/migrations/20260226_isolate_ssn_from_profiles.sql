-- ============================================================
-- Isolate ssn_last4 from profiles into a dedicated secure table
--
-- profiles is broadly queried by many app features. Storing
-- ssn_last4 there creates unnecessary PII exposure surface.
-- This migration moves it to a restricted table accessible
-- only by service_role and super_admin.
-- ============================================================

-- 1. Create secure_identity table
CREATE TABLE IF NOT EXISTS public.secure_identity (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ssn_last4 TEXT,
  ssn_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.secure_identity ENABLE ROW LEVEL SECURITY;

-- 3. Policies: service_role has full access implicitly.
--    Super_admin can read. Users can read their own.
--    No public/anon access.
CREATE POLICY "super_admin_read_secure_identity"
  ON public.secure_identity FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "user_read_own_secure_identity"
  ON public.secure_identity FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_upsert_own_secure_identity"
  ON public.secure_identity FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_update_own_secure_identity"
  ON public.secure_identity FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- No delete policy — SSN records are retained per compliance requirements

-- 4. Migrate existing data from profiles
INSERT INTO public.secure_identity (user_id, ssn_last4, created_at, updated_at)
SELECT id, ssn_last4, now(), now()
FROM public.profiles
WHERE ssn_last4 IS NOT NULL AND ssn_last4 != ''
ON CONFLICT (user_id) DO NOTHING;

-- 5. Drop ssn_last4 from profiles
-- NOTE: Run this AFTER verifying the migration succeeded and app code is updated.
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS ssn_last4;
-- Keeping the column temporarily for backward compatibility.
-- It will be dropped in a follow-up migration after deployment verification.

-- 6. Add index for hash lookups (used by tax filing dedup)
CREATE INDEX IF NOT EXISTS idx_secure_identity_ssn_hash
  ON public.secure_identity(ssn_hash)
  WHERE ssn_hash IS NOT NULL;

-- 7. Log the migration in audit trail
INSERT INTO public.admin_audit_events (actor_id, action, entity_type, entity_id, metadata, created_at)
VALUES (
  'system',
  'SSN_ISOLATION_MIGRATION',
  'secure_identity',
  'migration',
  '{"description": "Migrated ssn_last4 from profiles to secure_identity table", "reason": "PII minimization"}'::jsonb,
  now()
);
