-- Autopilot Logging System
-- Tracks all migration runs, rollbacks, and health checks

-- Create automation schema for internal tooling
CREATE SCHEMA IF NOT EXISTS automation;

-- Migration log table
CREATE TABLE IF NOT EXISTS automation.migration_log (
  id BIGSERIAL PRIMARY KEY,
  ran_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  commit_sha TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'failure', 'rollback', 'pending')),
  notes TEXT,
  backup_file TEXT,
  duration_ms INTEGER,
  error_message TEXT,
  triggered_by TEXT DEFAULT 'github_actions',
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_migration_log_ran_at ON automation.migration_log(ran_at DESC);
CREATE INDEX IF NOT EXISTS idx_migration_log_status ON automation.migration_log(status);
CREATE INDEX IF NOT EXISTS idx_migration_log_commit ON automation.migration_log(commit_sha);

-- Health check log table
CREATE TABLE IF NOT EXISTS automation.health_log (
  id BIGSERIAL PRIMARY KEY,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('healthy', 'degraded', 'unhealthy')),
  response_time_ms INTEGER,
  checks JSONB, -- Detailed check results
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for health monitoring
CREATE INDEX IF NOT EXISTS idx_health_log_checked_at ON automation.health_log(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_log_status ON automation.health_log(status);

-- Deployment log table
CREATE TABLE IF NOT EXISTS automation.deployment_log (
  id BIGSERIAL PRIMARY KEY,
  deployed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  platform TEXT NOT NULL, -- 'netlify', 'vercel', etc.
  deploy_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('triggered', 'building', 'success', 'failed')),
  url TEXT,
  notes TEXT,
  
  -- Link to migration that triggered this deploy
  migration_log_id BIGINT REFERENCES automation.migration_log(id),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for deployment tracking
CREATE INDEX IF NOT EXISTS idx_deployment_log_deployed_at ON automation.deployment_log(deployed_at DESC);
CREATE INDEX IF NOT EXISTS idx_deployment_log_status ON automation.deployment_log(status);
CREATE INDEX IF NOT EXISTS idx_deployment_log_migration ON automation.deployment_log(migration_log_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION automation.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER migration_log_updated_at
  BEFORE UPDATE ON automation.migration_log
  FOR EACH ROW
  EXECUTE FUNCTION automation.update_updated_at();

CREATE TRIGGER deployment_log_updated_at
  BEFORE UPDATE ON automation.deployment_log
  FOR EACH ROW
  EXECUTE FUNCTION automation.update_updated_at();

-- View for recent autopilot activity
CREATE OR REPLACE VIEW automation.recent_activity AS
SELECT
  'migration' AS event_type,
  ml.ran_at AS event_time,
  ml.status,
  ml.commit_sha,
  ml.notes,
  ml.duration_ms
FROM automation.migration_log ml
UNION ALL
SELECT
  'health_check' AS event_type,
  hl.checked_at AS event_time,
  hl.status,
  NULL AS commit_sha,
  hl.notes,
  hl.response_time_ms AS duration_ms
FROM automation.health_log hl
UNION ALL
SELECT
  'deployment' AS event_type,
  dl.deployed_at AS event_time,
  dl.status,
  NULL AS commit_sha,
  dl.platform || ': ' || COALESCE(dl.deploy_id, 'unknown') AS notes,
  NULL AS duration_ms
FROM automation.deployment_log dl
ORDER BY event_time DESC
LIMIT 100;

-- Grant permissions (adjust as needed for your RLS policies)
-- For service role access only:
GRANT USAGE ON SCHEMA automation TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA automation TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA automation TO service_role;

-- Comment for documentation
COMMENT ON SCHEMA automation IS 'Internal schema for autopilot logging and monitoring';
COMMENT ON TABLE automation.migration_log IS 'Tracks all database migration runs and rollbacks';
COMMENT ON TABLE automation.health_log IS 'Tracks system health check results';
COMMENT ON TABLE automation.deployment_log IS 'Tracks deployment triggers and results';
COMMENT ON VIEW automation.recent_activity IS 'Unified view of recent autopilot activity';
