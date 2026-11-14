
-- Automation Tables Migration
-- Created: 2026-08-16
-- Purpose: Add automation tasks and health log tables for system monitoring

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- automation.tasks table
CREATE TABLE IF NOT EXISTS automation.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_name VARCHAR(255) NOT NULL,
    task_type VARCHAR(50) NOT NULL,
    task_group VARCHAR(100),
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    priority INTEGER DEFAULT 0,
    schedule_expression VARCHAR(255),
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failed_at TIMESTAMPTZ,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    timeout_seconds INTEGER DEFAULT 3600,
    payload JSONB,
    result JSONB,
    error_message TEXT,
    error_details JSONB,
    metadata JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON automation.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled_at ON automation.tasks(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_tasks_task_type ON automation.tasks(task_type);

COMMENT ON TABLE automation.tasks IS 'Stores automation task definitions and execution history';

-- automation.task_logs table
CREATE TABLE IF NOT EXISTS automation.task_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES automation.tasks(id) ON DELETE CASCADE,
    log_level VARCHAR(20) NOT NULL DEFAULT 'info',
    log_message TEXT NOT NULL,
    log_data JSONB,
    step_name VARCHAR(255),
    execution_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_task_logs_task_id ON automation.task_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_task_logs_created_at ON automation.task_logs(created_at DESC);

-- automation.health_log table
CREATE TABLE IF NOT EXISTS automation.health_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    component VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL,
    check_type VARCHAR(100) NOT NULL,
    response_time_ms INTEGER,
    is_critical BOOLEAN DEFAULT false,
    message TEXT,
    details JSONB,
    error_code VARCHAR(100),
    error_message TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_component ON automation.health_log(component);
CREATE INDEX IF NOT EXISTS idx_health_status ON automation.health_log(status);
CREATE INDEX IF NOT EXISTS idx_health_created_at ON automation.health_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_unresolved ON automation.health_log(component, status) WHERE resolved_at IS NULL;

COMMENT ON TABLE automation.health_log IS 'System health monitoring and incident tracking';

-- automation.alert_rules table
CREATE TABLE IF NOT EXISTS automation.alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    component VARCHAR(255) NOT NULL,
    condition_type VARCHAR(50) NOT NULL,
    condition_value JSONB NOT NULL,
    severity VARCHAR(20) NOT NULL,
    notification_channels JSONB DEFAULT '[]',
    is_enabled BOOLEAN DEFAULT true,
    cooldown_minutes INTEGER DEFAULT 30,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_rules_component ON automation.alert_rules(component);
CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled ON automation.alert_rules(is_enabled) WHERE is_enabled = true;

-- automation.schedules table
CREATE TABLE IF NOT EXISTS automation.schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    cron_expression VARCHAR(255) NOT NULL,
    timezone VARCHAR(100) DEFAULT 'UTC',
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- automation.task_dependencies table
CREATE TABLE IF NOT EXISTS automation.task_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES automation.tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID NOT NULL REFERENCES automation.tasks(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) DEFAULT 'blocking',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(task_id, depends_on_task_id)
);

CREATE INDEX IF NOT EXISTS idx_task_deps_task_id ON automation.task_dependencies(task_id);
CREATE INDEX IF NOT EXISTS idx_task_deps_depends_on ON automation.task_dependencies(depends_on_task_id);

-- Functions and triggers
CREATE OR REPLACE FUNCTION automation.update_updated_at() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_tasks_updated_at BEFORE UPDATE ON automation.tasks FOR EACH ROW EXECUTE FUNCTION automation.update_updated_at();
CREATE TRIGGER trigger_alert_rules_updated_at BEFORE UPDATE ON automation.alert_rules FOR EACH ROW EXECUTE FUNCTION automation.update_updated_at();
CREATE TRIGGER trigger_schedules_updated_at BEFORE UPDATE ON automation.schedules FOR EACH ROW EXECUTE FUNCTION automation.update_updated_at();

-- Row Level Security
ALTER TABLE automation.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation.task_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation.health_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation.schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation.task_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_role_all ON automation.tasks FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON automation.task_logs FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON automation.health_log FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON automation.alert_rules FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON automation.schedules FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY service_role_all ON automation.task_dependencies FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Initial data
INSERT INTO automation.schedules (name, description, cron_expression, timezone) VALUES
    ('Every Minute', 'Runs every minute', '* * * * *', 'UTC'),
    ('Every 5 Minutes', 'Runs every 5 minutes', '*/5 * * * *', 'UTC'),
    ('Every 15 Minutes', 'Runs every 15 minutes', '*/15 * * * *', 'UTC'),
    ('Hourly', 'Runs at the start of every hour', '0 * * * *', 'UTC'),
    ('Daily Midnight', 'Runs at midnight every day', '0 0 * * *', 'UTC')
ON CONFLICT (name) DO NOTHING;

INSERT INTO automation.alert_rules (name, description, component, condition_type, condition_value, severity, notification_channels, is_enabled) VALUES
    ('Database Unhealthy', 'Alert when database is unhealthy', 'database', 'status_change', '{"status": "unhealthy"}', 'critical', '["email", "slack"]', true),
    ('API High Latency', 'Alert when API response time exceeds threshold', 'api_gateway', 'response_time', '{"threshold_ms": 5000}', 'high', '["slack"]', true)
ON CONFLICT DO NOTHING;

-- Views
CREATE OR REPLACE VIEW automation.task_status_summary AS
SELECT status, COUNT(*) as count FROM automation.tasks WHERE created_at > NOW() - INTERVAL '24 hours' GROUP BY status;

CREATE OR REPLACE VIEW automation.recent_failures AS
SELECT id, task_name, task_type, task_group, error_message, retry_count, failed_at FROM automation.tasks WHERE status = 'failed' AND failed_at > NOW() - INTERVAL '24 hours' ORDER BY failed_at DESC;

CREATE OR REPLACE VIEW automation.health_summary AS
SELECT component, status, COUNT(*) as check_count, MAX(created_at) as last_check, AVG(response_time_ms) as avg_response_time_ms FROM automation.health_log WHERE created_at > NOW() - INTERVAL '1 hour' GROUP BY component, status;

-- Grant permissions
GRANT USAGE ON SCHEMA automation TO authenticated;
GRANT SELECT ON automation.task_status_summary TO authenticated;
GRANT SELECT ON automation.recent_failures TO authenticated;
GRANT SELECT ON automation.health_summary TO authenticated;
GRANT ALL ON SCHEMA automation TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA automation TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA automation TO service_role;

COMMENT ON SCHEMA automation IS 'Automation and monitoring tables for scheduled tasks, health checks, and alerting';
