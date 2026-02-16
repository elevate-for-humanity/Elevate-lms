-- Performance and Analytics System
-- Tables for tracking performance metrics, page views, and conversions

-- Performance Metrics Table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  value DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Page Views Table
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  path TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  referrer TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversions Table
CREATE TABLE IF NOT EXISTS conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  conversion_type TEXT NOT NULL CHECK (conversion_type IN (
    'application_submitted',
    'enrollment_completed',
    'payment_completed',
    'course_completed',
    'certificate_earned',
    'appointment_booked',
    'donation_made',
    'event_registered',
    'referral_completed'
  )),
  value DECIMAL(10,2),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_performance_metrics_date ON performance_metrics(date);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_category ON performance_metrics(category);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_page_views_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_page_views_user ON page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_session ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_page_views_created ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_conversions_user ON conversions(user_id);
CREATE INDEX IF NOT EXISTS idx_conversions_type ON conversions(conversion_type);
CREATE INDEX IF NOT EXISTS idx_conversions_created ON conversions(created_at);

-- RLS
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversions ENABLE ROW LEVEL SECURITY;

-- Admin can view all metrics
CREATE POLICY "Admin can view all metrics"
  ON performance_metrics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Admin can insert metrics
CREATE POLICY "Admin can insert metrics"
  ON performance_metrics FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Admin can view all page views
CREATE POLICY "Admin can view all page views"
  ON page_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Anyone can insert page views (for tracking)
CREATE POLICY "Anyone can insert page views"
  ON page_views FOR INSERT
  WITH CHECK (true);

-- Admin can view all conversions
CREATE POLICY "Admin can view all conversions"
  ON conversions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Users can view their own conversions
CREATE POLICY "Users can view own conversions"
  ON conversions FOR SELECT
  USING (user_id = auth.uid());

-- System can insert conversions
CREATE POLICY "System can insert conversions"
  ON conversions FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE performance_metrics IS 'Performance metrics tracking';
COMMENT ON TABLE page_views IS 'Page view analytics';
COMMENT ON TABLE conversions IS 'Conversion tracking';

-- Seed initial performance metrics
INSERT INTO performance_metrics (metric_name, value, date, category) VALUES
  ('total_students', 0, CURRENT_DATE, 'students'),
  ('active_enrollments', 0, CURRENT_DATE, 'enrollments'),
  ('completion_rate', 0, CURRENT_DATE, 'performance'),
  ('revenue', 0, CURRENT_DATE, 'financial'),
  ('applications_submitted', 0, CURRENT_DATE, 'applications')
ON CONFLICT DO NOTHING;
