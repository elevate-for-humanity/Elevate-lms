-- notification_outbox: reliable outbox for email/SMS notifications with retry logic

CREATE TABLE IF NOT EXISTS notification_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  recipient_email TEXT,
  recipient_phone TEXT,
  subject TEXT,
  payload JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending',
  retry_count INT NOT NULL DEFAULT 0,
  max_retries INT NOT NULL DEFAULT 5,
  next_retry_at TIMESTAMPTZ,
  last_error TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notification_outbox_status_retry
  ON notification_outbox(status, next_retry_at)
  WHERE status = 'pending';

CREATE INDEX idx_notification_outbox_type
  ON notification_outbox(type);

ALTER TABLE notification_outbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON notification_outbox
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "admin_read" ON notification_outbox
  FOR SELECT USING (auth.role() = 'authenticated');

COMMENT ON TABLE notification_outbox IS
  'Outbox table for reliable notification delivery. Background workers poll pending rows, attempt delivery, and update status.';
