-- Async job queue for certificate side effects and other background work.
--
-- Design:
--   Core writes (certificate issuance, enrollment) stay synchronous.
--   Side effects (email, notifications, verification index) are enqueued here
--   and processed by /api/jobs/process on a cron schedule.
--
-- Idempotency:
--   job_queue_dedupe_idx prevents duplicate jobs for the same certificate.
--   If issuance retries, the second enqueue is silently ignored.
--
-- Retry policy (enforced in application layer):
--   attempts <= 5: status = 'pending', run_after = now() + 5 minutes
--   attempts >  5: status = 'failed' (requires manual intervention)

CREATE TABLE IF NOT EXISTS job_queue (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  type         TEXT        NOT NULL,
  payload      JSONB       NOT NULL DEFAULT '{}',
  status       TEXT        NOT NULL DEFAULT 'pending',
                           CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  attempts     INTEGER     NOT NULL DEFAULT 0,
  run_after    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  last_error   TEXT
);

-- Hot path: worker fetches pending jobs ordered by run_after
CREATE INDEX IF NOT EXISTS job_queue_pending_idx
  ON job_queue (status, run_after)
  WHERE status = 'pending';

-- Dedupe: one pending/processing job per (type, certificateId).
-- Covers the retry case where issuance runs twice before the job is processed.
-- Only applies when payload contains a certificateId — other job types are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS job_queue_dedupe_idx
  ON job_queue (type, (payload->>'certificateId'))
  WHERE payload->>'certificateId' IS NOT NULL
    AND status IN ('pending', 'processing');

-- Support lookups by status for the admin monitoring page
CREATE INDEX IF NOT EXISTS job_queue_status_created_idx
  ON job_queue (status, created_at DESC);

-- RLS: only service role can read/write job_queue (no learner access)
ALTER TABLE job_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_only" ON job_queue
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

COMMENT ON TABLE job_queue IS
  'Background job queue. Side effects (email, notifications) are enqueued here '
  'after core writes complete. Processed by /api/jobs/process.';

COMMENT ON COLUMN job_queue.type IS
  'Job type identifier. Currently defined: certificate_issued.';

COMMENT ON COLUMN job_queue.payload IS
  'Job-specific data. For certificate_issued: {certificateId, learnerId, programId?, courseId?}.';

COMMENT ON COLUMN job_queue.run_after IS
  'Earliest time the job should be processed. Used for retry backoff.';
