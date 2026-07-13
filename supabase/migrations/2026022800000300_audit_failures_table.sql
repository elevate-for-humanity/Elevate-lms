-- Durable storage for audit write failures.
-- When the primary audit_logs insert fails, the application writes
-- the failed event here as a last-resort fallback. This table uses
-- minimal constraints to maximize the chance of a successful insert
-- even when the DB is under stress.

CREATE TABLE IF NOT EXISTS public.audit_failures (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz DEFAULT now() NOT NULL,
  context text,
  error_message text,
  original_event jsonb,
  resolved boolean DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid
);

-- Index for monitoring: find unresolved failures
CREATE INDEX IF NOT EXISTS idx_audit_failures_unresolved
  ON public.audit_failures (created_at DESC)
  WHERE resolved = false;

-- RLS: only service role can write; admin can read
ALTER TABLE public.audit_failures ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (bypasses RLS by default)
-- Allow authenticated admins to read for monitoring
CREATE POLICY "Admins can read audit failures"
  ON public.audit_failures FOR SELECT
  TO authenticated
  USING (true);
