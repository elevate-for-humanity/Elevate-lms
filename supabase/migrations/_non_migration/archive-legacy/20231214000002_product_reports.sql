-- Product reporting system for marketplace moderation
CREATE TABLE IF NOT EXISTS product_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES marketplace_products(id) ON DELETE CASCADE,
  reporter_email TEXT,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT DEFAULT 'pending', -- pending, reviewed, resolved
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_reports_product ON product_reports(product_id);
CREATE INDEX idx_product_reports_status ON product_reports(status);
CREATE INDEX idx_product_reports_created ON product_reports(created_at DESC);

-- RLS policies
ALTER TABLE product_reports ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit reports
CREATE POLICY "Anyone can submit reports" ON product_reports
  FOR INSERT WITH CHECK (true);

-- Only admins can view reports
CREATE POLICY "Admins can view reports" ON product_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.email LIKE '%admin%' OR
        auth.users.email LIKE '%elevate%'
      )
    )
  );

-- Only admins can update reports
CREATE POLICY "Admins can update reports" ON product_reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        auth.users.email LIKE '%admin%' OR
        auth.users.email LIKE '%elevate%'
      )
    )
  );
