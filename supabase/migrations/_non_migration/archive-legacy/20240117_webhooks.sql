-- Create webhooks table
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  url TEXT NOT NULL,
  events TEXT[] NOT NULL,
  secret TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  description TEXT,
  headers JSONB,
  retry_count INTEGER DEFAULT 0,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create webhook_deliveries table
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  webhook_id UUID NOT NULL REFERENCES webhooks(id) ON DELETE CASCADE,
  event TEXT NOT NULL,
  payload JSONB NOT NULL,
  response_status INTEGER,
  response_body TEXT,
  error TEXT,
  delivered_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_webhooks_enabled ON webhooks(enabled);
CREATE INDEX IF NOT EXISTS idx_webhooks_created_by ON webhooks(created_by);
CREATE INDEX IF NOT EXISTS idx_webhooks_last_triggered ON webhooks(last_triggered_at);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook_id ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_event ON webhook_deliveries(event);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created_at ON webhook_deliveries(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_delivered_at ON webhook_deliveries(delivered_at);

-- Enable Row Level Security
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for webhooks

-- Admins can manage webhooks
CREATE POLICY "Admins can manage webhooks"
  ON webhooks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for webhook_deliveries

-- Admins can view deliveries
CREATE POLICY "Admins can view webhook deliveries"
  ON webhook_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- System can insert deliveries
CREATE POLICY "System can insert webhook deliveries"
  ON webhook_deliveries FOR INSERT
  WITH CHECK (true);

-- Comments
COMMENT ON TABLE webhooks IS 'Webhook configurations for external integrations';
COMMENT ON TABLE webhook_deliveries IS 'Log of webhook delivery attempts';

COMMENT ON COLUMN webhooks.url IS 'Endpoint URL to send webhook requests';
COMMENT ON COLUMN webhooks.events IS 'Array of events this webhook listens to';
COMMENT ON COLUMN webhooks.secret IS 'Secret key for signing webhook payloads';
COMMENT ON COLUMN webhooks.headers IS 'Custom headers to include in webhook requests';
COMMENT ON COLUMN webhooks.retry_count IS 'Number of consecutive failed deliveries';

COMMENT ON COLUMN webhook_deliveries.payload IS 'The webhook payload that was sent';
COMMENT ON COLUMN webhook_deliveries.response_status IS 'HTTP status code from the endpoint';
COMMENT ON COLUMN webhook_deliveries.response_body IS 'Response body from the endpoint';
COMMENT ON COLUMN webhook_deliveries.error IS 'Error message if delivery failed';
