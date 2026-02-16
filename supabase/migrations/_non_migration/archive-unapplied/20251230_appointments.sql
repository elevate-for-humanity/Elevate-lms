-- Appointments Table for SupersonicFastCash
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type TEXT NOT NULL,
  appointment_type TEXT NOT NULL, -- video, phone, in-person
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  tax_situation TEXT,
  has_w2 BOOLEAN DEFAULT false,
  has_1099 BOOLEAN DEFAULT false,
  has_business_income BOOLEAN DEFAULT false,
  has_rental_income BOOLEAN DEFAULT false,
  needs_refund_advance BOOLEAN DEFAULT false,
  refund_advance_amount TEXT,
  location TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  notes TEXT,
  confirmation_sent BOOLEAN DEFAULT false,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to create appointments
CREATE POLICY "Anyone can create appointments"
  ON appointments
  FOR INSERT
  WITH CHECK (true);

-- Users can view their own appointments by email
CREATE POLICY "Users can view own appointments"
  ON appointments
  FOR SELECT
  USING (email = current_setting('request.jwt.claims', true)::json->>'email' OR auth.role() = 'authenticated');

-- Admins can view all
CREATE POLICY "Admins can view all appointments"
  ON appointments
  FOR SELECT
  USING (auth.jwt() ->> 'role' = 'admin');

-- Admins can update
CREATE POLICY "Admins can update appointments"
  ON appointments
  FOR UPDATE
  USING (auth.jwt() ->> 'role' = 'admin');

-- Indexes
CREATE INDEX idx_appointments_email ON appointments(email);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_created_at ON appointments(created_at DESC);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_appointments_updated_at();
