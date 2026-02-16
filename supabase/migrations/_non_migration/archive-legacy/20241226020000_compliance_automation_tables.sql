-- Indiana Compliance Automation Tables
-- Creates tables for tracking alerts, reports, and enforcement actions

-- Indiana report submissions
CREATE TABLE IF NOT EXISTS indiana_report_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_holder_id UUID REFERENCES program_holder_applications(id) ON DELETE CASCADE,
  report_type TEXT NOT NULL,
  due_date DATE NOT NULL,
  submitted_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'overdue', 'late')),
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_submissions_holder ON indiana_report_submissions(program_holder_id);
CREATE INDEX IF NOT EXISTS idx_report_submissions_type ON indiana_report_submissions(report_type);
CREATE INDEX IF NOT EXISTS idx_report_submissions_status ON indiana_report_submissions(status);

-- Indiana performance metrics
CREATE TABLE IF NOT EXISTS indiana_performance_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_holder_id UUID REFERENCES program_holder_applications(id) ON DELETE CASCADE,
  quarter TEXT NOT NULL,
  employment_rate DECIMAL(5,4),
  credential_rate DECIMAL(5,4),
  wage_gain DECIMAL(10,2),
  enrollment_count INTEGER,
  data_quality_score DECIMAL(5,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_holder ON indiana_performance_metrics(program_holder_id);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_quarter ON indiana_performance_metrics(quarter);

-- Indiana alerts sent
CREATE TABLE IF NOT EXISTS indiana_alerts_sent (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_holder_id UUID REFERENCES program_holder_applications(id) ON DELETE CASCADE,
  alert_level TEXT NOT NULL CHECK (alert_level IN ('info', 'reminder', 'warning', 'urgent', 'critical', 'final')),
  alert_type TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  channels TEXT[] NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_alerts_holder ON indiana_alerts_sent(program_holder_id);
CREATE INDEX IF NOT EXISTS idx_alerts_level ON indiana_alerts_sent(alert_level);
CREATE INDEX IF NOT EXISTS idx_alerts_sent_at ON indiana_alerts_sent(sent_at);

-- Indiana enforcement actions
CREATE TABLE IF NOT EXISTS indiana_enforcement_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_holder_id UUID REFERENCES program_holder_applications(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('block_enrollments', 'issue_strike', 'suspend_license', 'remove_from_etpl')),
  reason TEXT NOT NULL,
  effective_date DATE NOT NULL,
  notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enforcement_holder ON indiana_enforcement_actions(program_holder_id);
CREATE INDEX IF NOT EXISTS idx_enforcement_action ON indiana_enforcement_actions(action);

-- RLS Policies
ALTER TABLE indiana_report_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE indiana_performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE indiana_alerts_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE indiana_enforcement_actions ENABLE ROW LEVEL SECURITY;

-- Program holders can view their own data
CREATE POLICY "Program holders can view own reports"
  ON indiana_report_submissions FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM program_holder_applications WHERE id = program_holder_id
  ));

CREATE POLICY "Program holders can view own metrics"
  ON indiana_performance_metrics FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM program_holder_applications WHERE id = program_holder_id
  ));

CREATE POLICY "Program holders can view own alerts"
  ON indiana_alerts_sent FOR SELECT
  USING (auth.uid() IN (
    SELECT user_id FROM program_holder_applications WHERE id = program_holder_id
  ));

CREATE POLICY "Program holders can acknowledge alerts"
  ON indiana_alerts_sent FOR UPDATE
  USING (auth.uid() IN (
    SELECT user_id FROM program_holder_applications WHERE id = program_holder_id
  ))
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM program_holder_applications WHERE id = program_holder_id
  ));

-- Admins can view all
CREATE POLICY "Admins can view all reports"
  ON indiana_report_submissions FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all metrics"
  ON indiana_performance_metrics FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all alerts"
  ON indiana_alerts_sent FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Admins can view all enforcement"
  ON indiana_enforcement_actions FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Service role can do everything (for Edge Function)
CREATE POLICY "Service role full access reports"
  ON indiana_report_submissions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access metrics"
  ON indiana_performance_metrics FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access alerts"
  ON indiana_alerts_sent FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access enforcement"
  ON indiana_enforcement_actions FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for report submissions
CREATE TRIGGER update_report_submissions_updated_at
  BEFORE UPDATE ON indiana_report_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE indiana_report_submissions IS 'Tracks Indiana DWD report submissions and deadlines';
COMMENT ON TABLE indiana_performance_metrics IS 'Stores quarterly performance metrics for ETPL compliance';
COMMENT ON TABLE indiana_alerts_sent IS 'Logs all compliance alerts sent to program holders';
COMMENT ON TABLE indiana_enforcement_actions IS 'Records enforcement actions taken for non-compliance';
