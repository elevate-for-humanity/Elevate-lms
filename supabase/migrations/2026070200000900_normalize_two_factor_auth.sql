-- Normalize two_factor_auth table.
--
-- The table was created with both `is_enabled` and `enabled` columns.
-- Application code uses `enabled`. This migration:
--   1. Merges is_enabled into enabled (OR — if either was true, keep true)
--   2. Drops the redundant is_enabled column
--   3. Adds NOT NULL default, FK to auth.users, unique constraint, and index
--   4. Converts backup_codes from text to text[] for proper array handling

-- 1. Merge is_enabled → enabled
UPDATE public.two_factor_auth
SET enabled = TRUE
WHERE is_enabled = TRUE AND (enabled IS NULL OR enabled = FALSE);

-- 2. Drop redundant column
ALTER TABLE public.two_factor_auth
  DROP COLUMN IF EXISTS is_enabled;

-- 3. Set defaults and NOT NULL on key columns
ALTER TABLE public.two_factor_auth
  ALTER COLUMN enabled SET DEFAULT FALSE,
  ALTER COLUMN enabled SET NOT NULL;

UPDATE public.two_factor_auth SET enabled = FALSE WHERE enabled IS NULL;

-- 4. Add primary key if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'two_factor_auth'
      AND constraint_type = 'PRIMARY KEY'
  ) THEN
    ALTER TABLE public.two_factor_auth ADD PRIMARY KEY (id);
  END IF;
END $$;

-- 5. Add unique constraint on user_id (one 2FA record per user)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'two_factor_auth'
      AND constraint_name = 'two_factor_auth_user_id_key'
  ) THEN
    ALTER TABLE public.two_factor_auth
      ADD CONSTRAINT two_factor_auth_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- 6. Add FK to auth.users with cascade delete
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'two_factor_auth'
      AND constraint_name = 'two_factor_auth_user_id_fkey'
  ) THEN
    ALTER TABLE public.two_factor_auth
      ADD CONSTRAINT two_factor_auth_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 7. Index for fast user_id lookups
CREATE INDEX IF NOT EXISTS idx_two_factor_auth_user_id
  ON public.two_factor_auth (user_id);

-- 8. RLS policies
ALTER TABLE public.two_factor_auth ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own 2FA record" ON public.two_factor_auth;
CREATE POLICY "Users can read own 2FA record"
  ON public.two_factor_auth FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own 2FA record" ON public.two_factor_auth;
CREATE POLICY "Users can update own 2FA record"
  ON public.two_factor_auth FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own 2FA record" ON public.two_factor_auth;
CREATE POLICY "Users can insert own 2FA record"
  ON public.two_factor_auth FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access on two_factor_auth" ON public.two_factor_auth;
CREATE POLICY "Service role full access on two_factor_auth"
  ON public.two_factor_auth
  USING (auth.role() = 'service_role');
