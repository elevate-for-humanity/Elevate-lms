-- LOCKDOWN PART 2: Enable RLS in Batches
-- Run this second - processes 50 tables at a time with commits

DO $$
DECLARE
  r RECORD;
  counter INTEGER := 0;
BEGIN
  FOR r IN
    SELECT schemaname, tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    counter := counter + 1;
    
    -- Enable RLS
    EXECUTE format('ALTER TABLE %I.%I ENABLE ROW LEVEL SECURITY;', r.schemaname, r.tablename);
    
    -- Force RLS
    EXECUTE format('ALTER TABLE %I.%I FORCE ROW LEVEL SECURITY;', r.schemaname, r.tablename);
    
    -- Create deny-all policy if not exists
    IF NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = r.schemaname
        AND tablename = r.tablename
        AND policyname = 'deny_all_default'
    ) THEN
      EXECUTE format($sql$
        CREATE POLICY deny_all_default
        ON %I.%I
        FOR ALL
        TO public
        USING (false)
        WITH CHECK (false);
      $sql$, r.schemaname, r.tablename);
    END IF;
    
    -- Commit every 50 tables to avoid timeout
    IF counter % 50 = 0 THEN
      COMMIT;
    END IF;
  END LOOP;
  
  COMMIT;
END $$;
