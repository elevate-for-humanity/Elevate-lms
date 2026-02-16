-- System Errors Table
-- Captures system-level errors for monitoring and debugging

CREATE TABLE IF NOT EXISTS system_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  error_stack TEXT,
  context JSONB DEFAULT '{}'::jsonb,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  request_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying recent errors
CREATE INDEX IF NOT EXISTS idx_system_errors_created_at ON system_errors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_system_errors_type ON system_errors(error_type);
CREATE INDEX IF NOT EXISTS idx_system_errors_user_id ON system_errors(user_id) WHERE user_id IS NOT NULL;

-- RLS Policies
ALTER TABLE system_errors ENABLE ROW LEVEL SECURITY;

-- Only service role can insert
CREATE POLICY "service_role_insert_system_errors"
  ON system_errors
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Super admins can view all errors
CREATE POLICY "super_admin_view_system_errors"
  ON system_errors
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
  );

-- Comment
COMMENT ON TABLE system_errors IS 'System-level error logging for monitoring and debugging';
