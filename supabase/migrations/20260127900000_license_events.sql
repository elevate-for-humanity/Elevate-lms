-- License Events Table for Webhook Logging
-- Tracks all license state changes for audit and debugging

CREATE TABLE IF NOT EXISTS license_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
ALTER TABLE license_events ADD COLUMN IF NOT EXISTS license_id TEXT;
CREATE INDEX IF NOT EXISTS idx_license_events_license ON license_events(license_id);
ALTER TABLE license_events ADD COLUMN IF NOT EXISTS event_type TEXT;
CREATE INDEX IF NOT EXISTS idx_license_events_type ON license_events(event_type);
CREATE INDEX IF NOT EXISTS idx_license_events_created ON license_events(created_at DESC);

-- RLS
ALTER TABLE license_events ENABLE ROW LEVEL SECURITY;

-- Only admins can view license events
DROP POLICY IF EXISTS "Admins can view license events" ON license_events;
CREATE POLICY "Admins can view license events"
  ON license_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- System can insert events (via service role)
DROP POLICY IF EXISTS "System can insert license events" ON license_events;
CREATE POLICY "System can insert license events"
  ON license_events FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE license_events IS 'Audit log for license state changes from Stripe webhooks';
