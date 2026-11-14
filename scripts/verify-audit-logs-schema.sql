-- Verify audit_logs table schema
-- Run this to check if all required columns exist

-- Check table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'audit_logs'
ORDER BY ordinal_position;

-- Check indexes
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'audit_logs';

-- Add missing columns if needed (safe - only adds if not exists)
DO $$ 
BEGIN
    -- Add action_type if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'action_type'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN action_type TEXT;
    END IF;

    -- Add description if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'description'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN description TEXT;
    END IF;

    -- Add user_id if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN user_id UUID REFERENCES profiles(id);
    END IF;

    -- Add ip_address if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'ip_address'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN ip_address TEXT;
    END IF;

    -- Add details if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'audit_logs' AND column_name = 'details'
    ) THEN
        ALTER TABLE audit_logs ADD COLUMN details JSONB;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);

-- Verify final structure
SELECT 
    'audit_logs table is ready for monitoring' as status,
    COUNT(*) as total_columns
FROM information_schema.columns
WHERE table_name = 'audit_logs';
