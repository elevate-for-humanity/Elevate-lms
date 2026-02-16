-- Payment Plans Support - Hours-Based Pricing
-- Price is calculated based on hours needed (after transfer credits)

-- Add payment tracking columns to student_enrollments
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS hours_needed integer DEFAULT 1500;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS price_per_hour numeric DEFAULT 3.00;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS milady_fee numeric DEFAULT 386;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS training_cost numeric;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS total_program_fee numeric;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS down_payment numeric DEFAULT 0;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS amount_paid numeric DEFAULT 0;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS balance_remaining numeric;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS payment_plan_months integer DEFAULT 0;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS monthly_payment_amount numeric;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS next_payment_date date;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS vendor_paid boolean DEFAULT false;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS vendor_paid_at timestamptz;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS vendor_payment_amount numeric;

-- Payment history table
CREATE TABLE IF NOT EXISTS enrollment_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL,
  student_id uuid NOT NULL,
  amount numeric NOT NULL,
  payment_number integer,
  total_payments integer,
  stripe_payment_intent_id text,
  stripe_invoice_id text,
  status text DEFAULT 'pending',
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_enrollment_payments_enrollment ON enrollment_payments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_payments_student ON enrollment_payments(student_id);

ALTER TABLE enrollment_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payments" ON enrollment_payments;
CREATE POLICY "Users can view own payments" ON enrollment_payments FOR SELECT USING (auth.uid() = student_id);

GRANT SELECT ON enrollment_payments TO authenticated;

-- Vendor payments tracking (Elevate paying Milady)
CREATE TABLE IF NOT EXISTS vendor_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id uuid NOT NULL,
  vendor_name text NOT NULL,
  amount numeric NOT NULL,
  status text DEFAULT 'pending',
  payment_method text,
  invoice_id text,
  paid_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_payments_enrollment ON vendor_payments(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_vendor ON vendor_payments(vendor_name);
CREATE INDEX IF NOT EXISTS idx_vendor_payments_status ON vendor_payments(status);

ALTER TABLE vendor_payments ENABLE ROW LEVEL SECURITY;

-- Only admins can see vendor payments
DROP POLICY IF EXISTS "Admins can view vendor payments" ON vendor_payments;
CREATE POLICY "Admins can view vendor payments" ON vendor_payments FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin', 'super_admin'))
);

SELECT 'Payment plan tables created!' as result;
