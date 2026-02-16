-- Web Vitals Monitoring Table
-- Stores performance metrics for monitoring and analysis

CREATE TABLE IF NOT EXISTS web_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, -- CLS, FID, FCP, LCP, TTFB
  value NUMERIC NOT NULL,
  rating TEXT NOT NULL CHECK (rating IN ('good', 'needs-improvement', 'poor')),
  delta NUMERIC NOT NULL,
  metric_id TEXT NOT NULL,
  navigation_type TEXT,
  user_agent TEXT,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_web_vitals_name ON web_vitals(name);
CREATE INDEX IF NOT EXISTS idx_web_vitals_rating ON web_vitals(rating);
CREATE INDEX IF NOT EXISTS idx_web_vitals_created_at ON web_vitals(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_web_vitals_url ON web_vitals(url);

-- Enable Row Level Security
ALTER TABLE web_vitals ENABLE ROW LEVEL SECURITY;

-- Policy: Allow insert for all authenticated users
CREATE POLICY "Allow insert web vitals" ON web_vitals
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow select for admins only
CREATE POLICY "Allow select web vitals for admins" ON web_vitals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Comments
COMMENT ON TABLE web_vitals IS 'Stores Web Vitals performance metrics for monitoring';
COMMENT ON COLUMN web_vitals.name IS 'Metric name: CLS, FID, FCP, LCP, TTFB';
COMMENT ON COLUMN web_vitals.value IS 'Metric value in milliseconds or ratio';
COMMENT ON COLUMN web_vitals.rating IS 'Performance rating: good, needs-improvement, poor';
COMMENT ON COLUMN web_vitals.delta IS 'Change from previous measurement';
COMMENT ON COLUMN web_vitals.metric_id IS 'Unique identifier for this metric instance';
