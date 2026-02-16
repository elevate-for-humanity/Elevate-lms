-- Fix referral_codes table if it exists without enabled column
DO $$ 
BEGIN
  -- Check if referral_codes table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'referral_codes') THEN
    -- Check if enabled column exists
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'referral_codes' 
      AND column_name = 'enabled'
    ) THEN
      -- Add enabled column if it doesn't exist
      ALTER TABLE referral_codes ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;
      RAISE NOTICE 'Added enabled column to referral_codes table';
    END IF;
    
    -- Ensure index exists
    IF NOT EXISTS (
      SELECT FROM pg_indexes 
      WHERE schemaname = 'public'
      AND tablename = 'referral_codes' 
      AND indexname = 'idx_referral_codes_enabled'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_referral_codes_enabled ON referral_codes(enabled);
      RAISE NOTICE 'Created index on referral_codes.enabled';
    END IF;
  ELSE
    RAISE NOTICE 'referral_codes table does not exist, skipping';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error fixing referral_codes: %', SQLERRM;
END $$;

-- Fix webhooks table if it exists without enabled column
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'webhooks') THEN
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'webhooks' 
      AND column_name = 'enabled'
    ) THEN
      ALTER TABLE webhooks ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;
      RAISE NOTICE 'Added enabled column to webhooks table';
    END IF;
    
    IF NOT EXISTS (
      SELECT FROM pg_indexes 
      WHERE schemaname = 'public'
      AND tablename = 'webhooks' 
      AND indexname = 'idx_webhooks_enabled'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_webhooks_enabled ON webhooks(enabled);
      RAISE NOTICE 'Created index on webhooks.enabled';
    END IF;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error fixing webhooks: %', SQLERRM;
END $$;

-- Fix moderation_rules table if it exists without enabled column
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'moderation_rules') THEN
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = 'moderation_rules' 
      AND column_name = 'enabled'
    ) THEN
      ALTER TABLE moderation_rules ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true;
      RAISE NOTICE 'Added enabled column to moderation_rules table';
    END IF;
    
    IF NOT EXISTS (
      SELECT FROM pg_indexes 
      WHERE schemaname = 'public'
      AND tablename = 'moderation_rules' 
      AND indexname = 'idx_moderation_rules_enabled'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_moderation_rules_enabled ON moderation_rules(enabled);
      RAISE NOTICE 'Created index on moderation_rules.enabled';
    END IF;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error fixing moderation_rules: %', SQLERRM;
END $$;

-- Fix any other tables that might have enabled column issues
DO $$
DECLARE
  table_record RECORD;
BEGIN
  -- Find all tables that should have an enabled column based on existing migrations
  FOR table_record IN 
    SELECT DISTINCT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('api_keys', 'feature_flags', 'notification_preferences', 'integrations')
  LOOP
    -- Check if enabled column exists
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public'
      AND table_name = table_record.table_name
      AND column_name = 'enabled'
    ) THEN
      EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS enabled BOOLEAN DEFAULT true', table_record.table_name);
      RAISE NOTICE 'Added enabled column to % table', table_record.table_name;
    END IF;
  END LOOP;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error in batch fix: %', SQLERRM;
END $$;
