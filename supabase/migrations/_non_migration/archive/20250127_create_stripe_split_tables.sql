-- Migration: Create tables for Stripe split payouts
-- Created: 2025-01-27

-- Instructors table
CREATE TABLE IF NOT EXISTS instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  stripe_account_id TEXT UNIQUE,
  stripe_account_status TEXT DEFAULT 'pending',
  payout_percentage NUMERIC DEFAULT 80.00,
  bio TEXT,
  specialties TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Split payouts table
CREATE TABLE IF NOT EXISTS split_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_intent_id TEXT NOT NULL,
  program_id TEXT NOT NULL,
  instructor_id UUID REFERENCES instructors(id) ON DELETE SET NULL,
  total_amount INTEGER NOT NULL,
  efh_amount INTEGER NOT NULL,
  instructor_amount INTEGER NOT NULL,
  selfish_inc_amount INTEGER NOT NULL,
  platform_amount INTEGER NOT NULL,
  transfers JSONB DEFAULT '[]',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Instructor programs junction table
CREATE TABLE IF NOT EXISTS instructor_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID REFERENCES instructors(id) ON DELETE CASCADE,
  program_id TEXT NOT NULL,
  program_name TEXT NOT NULL,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_instructors_email ON instructors(email);
CREATE INDEX IF NOT EXISTS idx_instructors_stripe_account ON instructors(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_split_payouts_payment_intent ON split_payouts(payment_intent_id);
CREATE INDEX IF NOT EXISTS idx_split_payouts_instructor ON split_payouts(instructor_id);
CREATE INDEX IF NOT EXISTS idx_split_payouts_created_at ON split_payouts(created_at);
CREATE INDEX IF NOT EXISTS idx_split_payouts_status ON split_payouts(status);
CREATE INDEX IF NOT EXISTS idx_instructor_programs_instructor ON instructor_programs(instructor_id);
CREATE INDEX IF NOT EXISTS idx_instructor_programs_program ON instructor_programs(program_id);

-- Enable Row Level Security
ALTER TABLE instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE split_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE instructor_programs ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Instructors: Service role full access
CREATE POLICY "Service role full access on instructors"
  ON instructors
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Instructors: Authenticated users can view
CREATE POLICY "Authenticated users can view instructors"
  ON instructors
  FOR SELECT
  TO authenticated
  USING (true);

-- Split payouts: Service role full access
CREATE POLICY "Service role full access on split_payouts"
  ON split_payouts
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Instructor programs: Service role full access
CREATE POLICY "Service role full access on instructor_programs"
  ON instructor_programs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Instructor programs: Authenticated users can view
CREATE POLICY "Authenticated users can view instructor_programs"
  ON instructor_programs
  FOR SELECT
  TO authenticated
  USING (true);

-- Add updated_at triggers
CREATE TRIGGER update_instructors_updated_at
  BEFORE UPDATE ON instructors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_split_payouts_updated_at
  BEFORE UPDATE ON split_payouts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert sample instructors (optional - remove in production)
INSERT INTO instructors (first_name, last_name, email, payout_percentage, specialties) VALUES
  ('Sarah', 'Johnson', 'sarah.johnson@example.com', 80.00, ARRAY['Tax Preparation', 'Business Formation']),
  ('Michael', 'Davis', 'michael.davis@example.com', 80.00, ARRAY['Barbering', 'Cosmetology']),
  ('Jennifer', 'Martinez', 'jennifer.martinez@example.com', 80.00, ARRAY['Healthcare', 'CPR/First Aid']),
  ('Robert', 'Wilson', 'robert.wilson@example.com', 80.00, ARRAY['Construction', 'OSHA Safety'])
ON CONFLICT (email) DO NOTHING;
