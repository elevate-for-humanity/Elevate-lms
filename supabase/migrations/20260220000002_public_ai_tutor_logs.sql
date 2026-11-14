-- Logging table for public AI tutor requests.
-- Stores no PII — only hashed IP, message lengths, and block reasons.
CREATE TABLE IF NOT EXISTS public_ai_tutor_logs (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  question_length INTEGER NOT NULL,
  response_length INTEGER NOT NULL DEFAULT 0,
  blocked_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for querying abuse patterns by IP hash
CREATE INDEX IF NOT EXISTS idx_public_ai_tutor_logs_ip_hash
  ON public_ai_tutor_logs (ip_hash, created_at DESC);

-- Index for time-based queries (monitoring dashboards)
CREATE INDEX IF NOT EXISTS idx_public_ai_tutor_logs_created
  ON public_ai_tutor_logs (created_at DESC);

-- Auto-cleanup: drop rows older than 30 days (run via cron or manual)
-- SELECT count(*) FROM public_ai_tutor_logs WHERE created_at < NOW() - INTERVAL '30 days';
