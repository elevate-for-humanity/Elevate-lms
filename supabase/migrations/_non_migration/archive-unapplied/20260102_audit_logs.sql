-- Audit Logging System
-- Tracks security-sensitive operations for compliance and debugging

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  user_role TEXT,
  tenant_id UUID,
  resource_type TEXT,
  resource_id TEXT,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_success ON audit_logs(success) WHERE success = false;

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Only admins and super_admins can view audit logs
CREATE POLICY "Admins can view all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Service role can insert audit logs (for server-side logging)
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Authenticated users can insert their own audit logs (for client-side events)
CREATE POLICY "Users can insert their own audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- No one can update or delete audit logs (immutable)
-- (No policies = no access)

-- Comments
COMMENT ON TABLE audit_logs IS 'Immutable audit log for security and compliance tracking';
COMMENT ON COLUMN audit_logs.event_type IS 'Type of event (auth.login, dashboard.access, etc.)';
COMMENT ON COLUMN audit_logs.user_id IS 'User who performed the action';
COMMENT ON COLUMN audit_logs.tenant_id IS 'Tenant context for multi-tenant operations';
COMMENT ON COLUMN audit_logs.action IS 'Specific action performed';
COMMENT ON COLUMN audit_logs.details IS 'Additional context as JSON';
COMMENT ON COLUMN audit_logs.success IS 'Whether the action succeeded';
