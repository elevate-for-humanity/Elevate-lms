-- Tables for direct phone system integration (no Twilio needed)

-- Phone call logs
CREATE TABLE IF NOT EXISTS phone_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action TEXT NOT NULL, -- click-to-call, schedule-callback, voicemail
  phone_number TEXT NOT NULL,
  message TEXT,
  caller_id TEXT,
  status TEXT NOT NULL DEFAULT 'initiated',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_logs_created_at
  ON phone_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_phone_logs_status
  ON phone_logs (status);

-- Callback requests (your team calls them back)
CREATE TABLE IF NOT EXISTS callback_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, cancelled
  requested_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  assigned_to TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_callback_requests_status
  ON callback_requests (status);

CREATE INDEX IF NOT EXISTS idx_callback_requests_requested_at
  ON callback_requests (requested_at DESC);

-- Voicemails (text messages from visitors)
CREATE TABLE IF NOT EXISTS voicemails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new', -- new, read, responded
  responded_at TIMESTAMPTZ,
  response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_voicemails_status
  ON voicemails (status);

CREATE INDEX IF NOT EXISTS idx_voicemails_created_at
  ON voicemails (created_at DESC);

-- Comments
COMMENT ON TABLE phone_logs IS 'Logs all phone-related actions without using Twilio';
COMMENT ON TABLE callback_requests IS 'Callback requests - your team calls them back manually';
COMMENT ON TABLE voicemails IS 'Text messages from visitors requesting callback';
