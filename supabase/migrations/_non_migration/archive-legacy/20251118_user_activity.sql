-- ============================================================================
-- User Activity Tracking for Analytics
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_payload JSONB DEFAULT '{}'::jsonb,
  path TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_user_activity_tenant_time
  ON user_activity_events (tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_user_time
  ON user_activity_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_event_type
  ON user_activity_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_activity_path
  ON user_activity_events (path, created_at DESC);

-- Enable RLS
ALTER TABLE user_activity_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY user_activity_admin_read ON user_activity_events
  FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'admin' OR
    tenant_id IN (
      SELECT tenant_id FROM user_tenants 
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY user_activity_insert ON user_activity_events
  FOR INSERT
  WITH CHECK (true); -- Allow all inserts (from client-side tracking)

COMMENT ON TABLE user_activity_events IS 'Track user behavior for analytics and product improvements';
COMMENT ON COLUMN user_activity_events.event_type IS 'Type of event (page_view, button_click, course_start, etc.)';
COMMENT ON COLUMN user_activity_events.event_payload IS 'Additional event data (course_id, button_name, etc.)';
