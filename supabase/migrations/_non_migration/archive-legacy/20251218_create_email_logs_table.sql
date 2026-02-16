-- Create email_logs table for monitoring email delivery
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  to TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('sent', 'failed', 'pending')),
  provider TEXT NOT NULL CHECK (provider IN ('resend', 'sendgrid', 'fallback')),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON email_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_provider ON email_logs(provider);
CREATE INDEX IF NOT EXISTS idx_email_logs_to ON email_logs(to);

-- Enable RLS
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all email logs"
  ON email_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "System can insert email logs"
  ON email_logs FOR INSERT
  WITH CHECK (true);

-- Add updated_at trigger
CREATE TRIGGER update_email_logs_updated_at
  BEFORE UPDATE ON email_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create view for email statistics
CREATE OR REPLACE VIEW email_stats_24h AS
SELECT 
  COUNT(*) as total_emails,
  COUNT(*) FILTER (WHERE status = 'sent') as sent,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'sent') / NULLIF(COUNT(*), 0), 2) as success_rate,
  COUNT(*) FILTER (WHERE provider = 'resend') as resend_count,
  COUNT(*) FILTER (WHERE provider = 'sendgrid') as sendgrid_count
FROM email_logs
WHERE created_at > NOW() - INTERVAL '24 hours';
