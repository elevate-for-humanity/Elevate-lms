-- Create program_enrollments table
CREATE TABLE IF NOT EXISTS program_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  program_id TEXT NOT NULL,
  funding_source TEXT NOT NULL CHECK (funding_source IN ('SELF_PAY', 'EMPLOYER', 'WRG', 'WIOA', 'SCHOLARSHIP')),
  status TEXT NOT NULL CHECK (status IN ('INTAKE', 'AWAITING_FUNDING', 'AWAITING_SEATS', 'READY_TO_START', 'IN_PROGRESS', 'COMPLETED', 'SUSPENDED')),
  stripe_ref_id TEXT,
  payment_mode TEXT CHECK (payment_mode IN ('full', 'plan')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_program_enrollments_student_id ON program_enrollments(student_id);
CREATE INDEX idx_program_enrollments_program_id ON program_enrollments(program_id);
CREATE INDEX idx_program_enrollments_status ON program_enrollments(status);
CREATE INDEX idx_program_enrollments_created_at ON program_enrollments(created_at DESC);

-- Enable Row Level Security
ALTER TABLE program_enrollments ENABLE ROW LEVEL SECURITY;

-- Policy: Students can view their own enrollments
CREATE POLICY "Students can view own enrollments"
  ON program_enrollments FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Policy: Staff can view all enrollments
CREATE POLICY "Staff can view all enrollments"
  ON program_enrollments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Policy: System can insert enrollments (for webhook)
CREATE POLICY "System can insert enrollments"
  ON program_enrollments FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Policy: Staff can update enrollments
CREATE POLICY "Staff can update enrollments"
  ON program_enrollments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Create partner_seat_orders table
CREATE TABLE IF NOT EXISTS partner_seat_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES program_enrollments(id) ON DELETE CASCADE,
  partner_course_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'ORDERED', 'FULFILLED', 'FAILED')) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for partner_seat_orders
CREATE INDEX idx_partner_seat_orders_enrollment_id ON partner_seat_orders(enrollment_id);
CREATE INDEX idx_partner_seat_orders_status ON partner_seat_orders(status);

-- Enable RLS for partner_seat_orders
ALTER TABLE partner_seat_orders ENABLE ROW LEVEL SECURITY;

-- Policy: Staff can view all seat orders
CREATE POLICY "Staff can view all seat orders"
  ON partner_seat_orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Policy: System can insert seat orders
CREATE POLICY "System can insert seat orders"
  ON partner_seat_orders FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Policy: Staff can update seat orders
CREATE POLICY "Staff can update seat orders"
  ON partner_seat_orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_program_enrollments_updated_at
  BEFORE UPDATE ON program_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_partner_seat_orders_updated_at
  BEFORE UPDATE ON partner_seat_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
