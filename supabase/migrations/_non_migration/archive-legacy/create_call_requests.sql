-- Table for instant call requests
CREATE TABLE IF NOT EXISTS call_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  name TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_requests_status
  ON call_requests (status);

CREATE INDEX IF NOT EXISTS idx_call_requests_requested_at
  ON call_requests (requested_at DESC);
