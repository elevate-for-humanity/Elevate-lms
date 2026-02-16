-- Autopilot Phase 4: Health-Log Dashboard
-- Secure, RLS-protected health monitoring with admin access control

-- 1) Admin allowlist (who can view logs in the dashboard)
CREATE TABLE IF NOT EXISTS automation.admin_users (
  user_id UUID PRIMARY KEY,                 -- auth.users.id
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'viewer' CHECK (role IN ('viewer', 'admin', 'superadmin')),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id),
  last_access TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON automation.admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON automation.admin_users(role);

-- 2) Enhanced health log table (extends existing)
-- Drop and recreate with additional fields
DROP TABLE IF EXISTS automation.health_log CASCADE;

CREATE TABLE automation.health_log (
  id BIGSERIAL PRIMARY KEY,
  source TEXT NOT NULL CHECK (source IN ('self-heal', 'autopilot', 'worker', 'manual', 'cron', 'api')),
  kind TEXT NOT NULL CHECK (kind IN ('site', 'db', 'deploy', 'migration', 'rollback', 'health-check', 'backup')),
  status TEXT NOT NULL CHECK (status IN ('ok', 'warn', 'error', 'pending')),
  http_code INTEGER,
  response_time_ms INTEGER,
  detail TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamps
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_health_log_checked_at ON automation.health_log(checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_log_kind ON automation.health_log(kind);
CREATE INDEX IF NOT EXISTS idx_health_log_status ON automation.health_log(status);
CREATE INDEX IF NOT EXISTS idx_health_log_source ON automation.health_log(source);
CREATE INDEX IF NOT EXISTS idx_health_log_metadata ON automation.health_log USING gin(metadata);

-- 3) Hourly rollup view for charts (last 7 days)
CREATE OR REPLACE VIEW automation.health_log_rollup AS
SELECT
  DATE_TRUNC('hour', checked_at) AS hour,
  kind,
  status,
  COUNT(*)::INTEGER AS cnt,
  AVG(response_time_ms)::INTEGER AS avg_response_time,
  MIN(response_time_ms)::INTEGER AS min_response_time,
  MAX(response_time_ms)::INTEGER AS max_response_time
FROM automation.health_log
WHERE checked_at >= NOW() - INTERVAL '7 days'
GROUP BY 1, 2, 3
ORDER BY 1 DESC;

-- 4) Daily summary view
CREATE OR REPLACE VIEW automation.health_log_daily AS
SELECT
  DATE_TRUNC('day', checked_at) AS day,
  kind,
  COUNT(*) FILTER (WHERE status = 'ok')::INTEGER AS ok_count,
  COUNT(*) FILTER (WHERE status = 'warn')::INTEGER AS warn_count,
  COUNT(*) FILTER (WHERE status = 'error')::INTEGER AS error_count,
  COUNT(*)::INTEGER AS total_count,
  ROUND(COUNT(*) FILTER (WHERE status = 'ok') * 100.0 / NULLIF(COUNT(*), 0), 2) AS uptime_percentage,
  AVG(response_time_ms)::INTEGER AS avg_response_time
FROM automation.health_log
WHERE checked_at >= NOW() - INTERVAL '30 days'
GROUP BY 1, 2
ORDER BY 1 DESC, 2;

-- 5) Recent incidents view (errors and warnings in last 24h)
CREATE OR REPLACE VIEW automation.recent_incidents AS
SELECT
  id,
  source,
  kind,
  status,
  http_code,
  response_time_ms,
  detail,
  metadata,
  checked_at
FROM automation.health_log
WHERE checked_at >= NOW() - INTERVAL '24 hours'
  AND status IN ('error', 'warn')
ORDER BY checked_at DESC;

-- 6) System health summary (current status)
CREATE OR REPLACE VIEW automation.system_health_summary AS
SELECT
  kind,
  (SELECT status FROM automation.health_log h2 
   WHERE h2.kind = h1.kind 
   ORDER BY checked_at DESC LIMIT 1) AS current_status,
  (SELECT checked_at FROM automation.health_log h2 
   WHERE h2.kind = h1.kind 
   ORDER BY checked_at DESC LIMIT 1) AS last_check,
  COUNT(*) FILTER (WHERE checked_at >= NOW() - INTERVAL '24 hours' AND status = 'ok')::INTEGER AS ok_24h,
  COUNT(*) FILTER (WHERE checked_at >= NOW() - INTERVAL '24 hours' AND status = 'warn')::INTEGER AS warn_24h,
  COUNT(*) FILTER (WHERE checked_at >= NOW() - INTERVAL '24 hours' AND status = 'error')::INTEGER AS error_24h,
  ROUND(
    COUNT(*) FILTER (WHERE checked_at >= NOW() - INTERVAL '24 hours' AND status = 'ok') * 100.0 / 
    NULLIF(COUNT(*) FILTER (WHERE checked_at >= NOW() - INTERVAL '24 hours'), 0),
    2
  ) AS uptime_24h
FROM automation.health_log h1
WHERE checked_at >= NOW() - INTERVAL '24 hours'
GROUP BY kind
ORDER BY kind;

-- 7) Enable RLS on all tables
ALTER TABLE automation.health_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation.admin_users ENABLE ROW LEVEL SECURITY;

-- 8) RLS Policies for health_log

-- Service role can do anything (for edge functions)
CREATE POLICY "service_role_all_health_log"
ON automation.health_log
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Admins can read all health logs
CREATE POLICY "admin_read_health_log"
ON automation.health_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM automation.admin_users a 
    WHERE a.user_id = auth.uid()
  )
);

-- No direct inserts from clients (only via edge functions)
-- This is enforced by not having an INSERT policy for authenticated/anon

-- 9) RLS Policies for admin_users

-- Service role can manage admin users
CREATE POLICY "service_role_all_admin_users"
ON automation.admin_users
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Admins can read the admin list
CREATE POLICY "admin_read_admin_users"
ON automation.admin_users
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM automation.admin_users a 
    WHERE a.user_id = auth.uid()
  )
);

-- Superadmins can insert/update admin users
CREATE POLICY "superadmin_manage_admin_users"
ON automation.admin_users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM automation.admin_users a 
    WHERE a.user_id = auth.uid() 
    AND a.role = 'superadmin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM automation.admin_users a 
    WHERE a.user_id = auth.uid() 
    AND a.role = 'superadmin'
  )
);

-- 10) Function to update last_access timestamp
CREATE OR REPLACE FUNCTION automation.update_admin_last_access()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE automation.admin_users
  SET last_access = NOW()
  WHERE user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11) Function to log health events (callable from edge functions)
CREATE OR REPLACE FUNCTION automation.log_health_event(
  p_source TEXT,
  p_kind TEXT,
  p_status TEXT,
  p_http_code INTEGER DEFAULT NULL,
  p_response_time_ms INTEGER DEFAULT NULL,
  p_detail TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS BIGINT AS $$
DECLARE
  v_log_id BIGINT;
BEGIN
  INSERT INTO automation.health_log (
    source,
    kind,
    status,
    http_code,
    response_time_ms,
    detail,
    metadata
  ) VALUES (
    p_source,
    p_kind,
    p_status,
    p_http_code,
    p_response_time_ms,
    p_detail,
    p_metadata
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12) Grant permissions
GRANT USAGE ON SCHEMA automation TO service_role, authenticated, anon;
GRANT SELECT ON automation.health_log TO authenticated;
GRANT SELECT ON automation.health_log_rollup TO authenticated;
GRANT SELECT ON automation.health_log_daily TO authenticated;
GRANT SELECT ON automation.recent_incidents TO authenticated;
GRANT SELECT ON automation.system_health_summary TO authenticated;
GRANT SELECT ON automation.admin_users TO authenticated;
GRANT EXECUTE ON FUNCTION automation.log_health_event TO service_role;

-- 13) Comments for documentation
COMMENT ON TABLE automation.admin_users IS 'Users authorized to view health dashboard';
COMMENT ON TABLE automation.health_log IS 'Comprehensive health check and event log';
COMMENT ON VIEW automation.health_log_rollup IS 'Hourly aggregated health metrics for charts';
COMMENT ON VIEW automation.health_log_daily IS 'Daily health summary with uptime percentages';
COMMENT ON VIEW automation.recent_incidents IS 'Recent errors and warnings (last 24h)';
COMMENT ON VIEW automation.system_health_summary IS 'Current system health status by component';
COMMENT ON FUNCTION automation.log_health_event IS 'Securely log health events from edge functions';

-- 14) Sample data for testing (optional - remove in production)
-- Uncomment to insert test data:
/*
INSERT INTO automation.health_log (source, kind, status, http_code, response_time_ms, detail, checked_at)
SELECT
  (ARRAY['self-heal', 'autopilot', 'cron'])[floor(random() * 3 + 1)],
  (ARRAY['site', 'db', 'deploy'])[floor(random() * 3 + 1)],
  (ARRAY['ok', 'ok', 'ok', 'ok', 'warn', 'error'])[floor(random() * 6 + 1)],
  (ARRAY[200, 200, 200, 500, 503])[floor(random() * 5 + 1)],
  floor(random() * 1000 + 50)::INTEGER,
  'Test health check',
  NOW() - (random() * INTERVAL '7 days')
FROM generate_series(1, 1000);
*/

-- 15) Seed first admin user (REPLACE WITH YOUR AUTH USER ID)
-- Get your user_id from: SELECT id, email FROM auth.users;
-- Then uncomment and run:
/*
INSERT INTO automation.admin_users (user_id, email, role)
VALUES (
  '00000000-0000-0000-0000-000000000000',  -- Replace with your auth.users.id
  'admin@elevateforhumanity.org',           -- Replace with your email
  'superadmin'
)
ON CONFLICT (user_id) DO NOTHING;
*/
