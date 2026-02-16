-- Autopilot Phase 5: Custom Alerting Rules Engine
-- Intelligent alerting with configurable thresholds and escalation

-- Alert rules table
CREATE TABLE IF NOT EXISTS automation.alert_rules (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  enabled BOOLEAN DEFAULT true,
  
  -- Rule configuration
  metric_name TEXT NOT NULL,
  condition TEXT NOT NULL CHECK (condition IN ('>', '<', '>=', '<=', '==', '!=')),
  threshold NUMERIC NOT NULL,
  duration_minutes INTEGER DEFAULT 5,
  
  -- Severity and escalation
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  escalation_level INTEGER DEFAULT 1 CHECK (escalation_level BETWEEN 1 AND 3),
  
  -- Notification settings
  notify_slack BOOLEAN DEFAULT true,
  notify_email BOOLEAN DEFAULT false,
  notify_pagerduty BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Alert history table
CREATE TABLE IF NOT EXISTS automation.alert_history (
  id BIGSERIAL PRIMARY KEY,
  rule_id BIGINT REFERENCES automation.alert_rules(id) ON DELETE CASCADE,
  
  -- Alert details
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('firing', 'resolved', 'acknowledged')) DEFAULT 'firing',
  
  -- Values
  metric_value NUMERIC NOT NULL,
  threshold_value NUMERIC NOT NULL,
  
  -- Context
  labels JSONB DEFAULT '{}'::jsonb,
  annotations JSONB DEFAULT '{}'::jsonb,
  
  -- Actions taken
  notifications_sent JSONB DEFAULT '[]'::jsonb,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alert suppression rules (prevent alert fatigue)
CREATE TABLE IF NOT EXISTS automation.alert_suppressions (
  id BIGSERIAL PRIMARY KEY,
  rule_id BIGINT REFERENCES automation.alert_rules(id) ON DELETE CASCADE,
  
  -- Suppression window
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  reason TEXT,
  
  -- Created by
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT valid_suppression_window CHECK (end_time > start_time)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_alert_rules_enabled ON automation.alert_rules(enabled) WHERE enabled = true;
CREATE INDEX IF NOT EXISTS idx_alert_history_status ON automation.alert_history(status) WHERE status = 'firing';
CREATE INDEX IF NOT EXISTS idx_alert_history_triggered ON automation.alert_history(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_suppressions_window ON automation.alert_suppressions(start_time, end_time);

-- Function to evaluate alert rules
CREATE OR REPLACE FUNCTION automation.evaluate_alert_rules()
RETURNS TABLE(
  rule_id BIGINT,
  rule_name TEXT,
  should_fire BOOLEAN,
  current_value NUMERIC,
  threshold_value NUMERIC
) AS $$
DECLARE
  rule RECORD;
  metric_value NUMERIC;
  should_alert BOOLEAN;
BEGIN
  -- Loop through all enabled rules
  FOR rule IN 
    SELECT * FROM automation.alert_rules 
    WHERE enabled = true
  LOOP
    -- Get current metric value based on rule configuration
    EXECUTE format(
      'SELECT COALESCE(AVG(CASE 
        WHEN metric_name = %L THEN value 
        ELSE NULL 
      END), 0) 
      FROM (
        SELECT 
          CASE 
            WHEN %L = ''autopilot_uptime_percentage'' THEN 
              (COUNT(*) FILTER (WHERE status = ''ok'') * 100.0 / NULLIF(COUNT(*), 0))
            WHEN %L = ''autopilot_error_rate'' THEN 
              COUNT(*) FILTER (WHERE status = ''error'')::NUMERIC
            WHEN %L = ''autopilot_response_time'' THEN 
              AVG(response_time_ms)
            ELSE 0
          END as value,
          %L as metric_name
        FROM automation.health_log
        WHERE checked_at > NOW() - INTERVAL ''%s minutes''
      ) metrics',
      rule.metric_name,
      rule.metric_name,
      rule.metric_name,
      rule.metric_name,
      rule.metric_name,
      rule.duration_minutes
    ) INTO metric_value;
    
    -- Evaluate condition
    EXECUTE format(
      'SELECT %s %s %s',
      metric_value,
      rule.condition,
      rule.threshold
    ) INTO should_alert;
    
    -- Check if rule is suppressed
    IF should_alert THEN
      should_alert := NOT EXISTS (
        SELECT 1 FROM automation.alert_suppressions
        WHERE rule_id = rule.id
        AND NOW() BETWEEN start_time AND end_time
      );
    END IF;
    
    -- Return result
    RETURN QUERY SELECT 
      rule.id,
      rule.name,
      should_alert,
      metric_value,
      rule.threshold;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to fire an alert
CREATE OR REPLACE FUNCTION automation.fire_alert(
  p_rule_id BIGINT,
  p_metric_value NUMERIC,
  p_threshold_value NUMERIC,
  p_labels JSONB DEFAULT '{}'::jsonb,
  p_annotations JSONB DEFAULT '{}'::jsonb
)
RETURNS BIGINT AS $$
DECLARE
  v_alert_id BIGINT;
  v_rule RECORD;
  v_existing_alert_id BIGINT;
BEGIN
  -- Get rule details
  SELECT * INTO v_rule FROM automation.alert_rules WHERE id = p_rule_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Alert rule not found: %', p_rule_id;
  END IF;
  
  -- Check if there's already a firing alert for this rule
  SELECT id INTO v_existing_alert_id
  FROM automation.alert_history
  WHERE rule_id = p_rule_id
  AND status = 'firing'
  ORDER BY triggered_at DESC
  LIMIT 1;
  
  -- If alert already exists, don't create duplicate
  IF v_existing_alert_id IS NOT NULL THEN
    RETURN v_existing_alert_id;
  END IF;
  
  -- Create new alert
  INSERT INTO automation.alert_history (
    rule_id,
    metric_value,
    threshold_value,
    labels,
    annotations,
    status
  ) VALUES (
    p_rule_id,
    p_metric_value,
    p_threshold_value,
    p_labels,
    p_annotations,
    'firing'
  )
  RETURNING id INTO v_alert_id;
  
  -- Log the alert
  INSERT INTO automation.health_log (
    source,
    kind,
    status,
    detail,
    metadata
  ) VALUES (
    'alerting',
    'alert',
    'error',
    format('Alert fired: %s (value: %s, threshold: %s)', v_rule.name, p_metric_value, p_threshold_value),
    jsonb_build_object(
      'rule_id', p_rule_id,
      'rule_name', v_rule.name,
      'severity', v_rule.severity,
      'alert_id', v_alert_id
    )
  );
  
  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to resolve an alert
CREATE OR REPLACE FUNCTION automation.resolve_alert(p_alert_id BIGINT)
RETURNS BOOLEAN AS $$
DECLARE
  v_rule_name TEXT;
BEGIN
  -- Update alert status
  UPDATE automation.alert_history
  SET 
    status = 'resolved',
    resolved_at = NOW()
  WHERE id = p_alert_id
  AND status = 'firing'
  RETURNING (
    SELECT name FROM automation.alert_rules WHERE id = rule_id
  ) INTO v_rule_name;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Log resolution
  INSERT INTO automation.health_log (
    source,
    kind,
    status,
    detail,
    metadata
  ) VALUES (
    'alerting',
    'alert',
    'ok',
    format('Alert resolved: %s', v_rule_name),
    jsonb_build_object('alert_id', p_alert_id)
  );
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- View for active alerts
CREATE OR REPLACE VIEW automation.active_alerts AS
SELECT 
  ah.id as alert_id,
  ar.name as rule_name,
  ar.severity,
  ah.triggered_at,
  ah.metric_value,
  ah.threshold_value,
  ah.labels,
  ah.annotations,
  ah.status,
  EXTRACT(EPOCH FROM (NOW() - ah.triggered_at)) / 60 as duration_minutes
FROM automation.alert_history ah
JOIN automation.alert_rules ar ON ah.rule_id = ar.id
WHERE ah.status = 'firing'
ORDER BY ar.severity DESC, ah.triggered_at DESC;

-- Seed default alert rules
INSERT INTO automation.alert_rules (name, description, metric_name, condition, threshold, duration_minutes, severity, notify_slack) VALUES
('Low Uptime', 'Alert when system uptime drops below 95%', 'autopilot_uptime_percentage', '<', 95, 10, 'warning', true),
('Critical Uptime', 'Alert when system uptime drops below 90%', 'autopilot_uptime_percentage', '<', 90, 5, 'critical', true),
('High Error Rate', 'Alert when error rate exceeds 10 per hour', 'autopilot_error_rate', '>', 10, 5, 'warning', true),
('Migration Failure', 'Alert when migration fails', 'autopilot_migration_success_rate', '<', 100, 1, 'critical', true),
('Slow Response Time', 'Alert when response time exceeds 5 seconds', 'autopilot_response_time', '>', 5000, 10, 'warning', true),
('Critical Response Time', 'Alert when response time exceeds 10 seconds', 'autopilot_response_time', '>', 10000, 5, 'critical', true)
ON CONFLICT (name) DO NOTHING;

-- Grant permissions
GRANT SELECT ON automation.alert_rules TO authenticated;
GRANT SELECT ON automation.alert_history TO authenticated;
GRANT SELECT ON automation.alert_suppressions TO authenticated;
GRANT SELECT ON automation.active_alerts TO authenticated;
GRANT EXECUTE ON FUNCTION automation.evaluate_alert_rules TO service_role;
GRANT EXECUTE ON FUNCTION automation.fire_alert TO service_role;
GRANT EXECUTE ON FUNCTION automation.resolve_alert TO service_role;

-- Comments
COMMENT ON TABLE automation.alert_rules IS 'Configurable alert rules with thresholds and escalation';
COMMENT ON TABLE automation.alert_history IS 'History of all fired alerts';
COMMENT ON TABLE automation.alert_suppressions IS 'Temporary suppression of alerts (maintenance windows)';
COMMENT ON FUNCTION automation.evaluate_alert_rules IS 'Evaluates all enabled alert rules and returns which should fire';
COMMENT ON FUNCTION automation.fire_alert IS 'Creates a new alert in firing state';
COMMENT ON FUNCTION automation.resolve_alert IS 'Resolves a firing alert';
