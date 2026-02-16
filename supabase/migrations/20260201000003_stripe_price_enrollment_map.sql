-- Stripe Price to Enrollment Mapping Table
-- Maps Stripe price_ids and product_ids to program enrollment data
-- Used by webhook fallback when Payment Links lack metadata

CREATE TABLE IF NOT EXISTS stripe_price_enrollment_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  program_id UUID,
  program_slug TEXT NOT NULL,
  enrollment_type TEXT NOT NULL DEFAULT 'program',
  funding_source TEXT DEFAULT 'SELF_PAY',
  is_deposit BOOLEAN DEFAULT false,
  is_free_enrollment BOOLEAN DEFAULT false,
  auto_enroll BOOLEAN DEFAULT true,
  send_welcome_email BOOLEAN DEFAULT true,
  
  -- Metadata
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT price_or_product_required CHECK (
    stripe_price_id IS NOT NULL OR stripe_product_id IS NOT NULL
  )
);

-- Add missing columns to existing table
ALTER TABLE stripe_price_enrollment_map ADD COLUMN IF NOT EXISTS enrollment_type TEXT DEFAULT 'program';
ALTER TABLE stripe_price_enrollment_map ADD COLUMN IF NOT EXISTS funding_source TEXT DEFAULT 'SELF_PAY';
ALTER TABLE stripe_price_enrollment_map ADD COLUMN IF NOT EXISTS is_free_enrollment BOOLEAN DEFAULT false;
ALTER TABLE stripe_price_enrollment_map ADD COLUMN IF NOT EXISTS send_welcome_email BOOLEAN DEFAULT true;
ALTER TABLE stripe_price_enrollment_map ADD COLUMN IF NOT EXISTS program_id UUID;

-- Indexes for fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_map_price ON stripe_price_enrollment_map(stripe_price_id) WHERE stripe_price_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_map_product ON stripe_price_enrollment_map(stripe_product_id) WHERE stripe_product_id IS NOT NULL AND stripe_price_id IS NULL;
ALTER TABLE stripe_price_enrollment_map ADD COLUMN IF NOT EXISTS program_slug TEXT;
CREATE INDEX IF NOT EXISTS idx_stripe_map_program ON stripe_price_enrollment_map(program_slug);
ALTER TABLE stripe_price_enrollment_map ADD COLUMN IF NOT EXISTS is_active TEXT;
CREATE INDEX IF NOT EXISTS idx_stripe_map_active ON stripe_price_enrollment_map(is_active);

-- Enable RLS
ALTER TABLE stripe_price_enrollment_map ENABLE ROW LEVEL SECURITY;

-- Only admins can manage mappings
DROP POLICY IF EXISTS "Admins can manage stripe price mappings" ON stripe_price_enrollment_map;
CREATE POLICY "Admins can manage stripe price mappings" ON stripe_price_enrollment_map
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Service role can read for webhook processing
DROP POLICY IF EXISTS "Service role can read stripe mappings" ON stripe_price_enrollment_map;
CREATE POLICY "Service role can read stripe mappings" ON stripe_price_enrollment_map
  FOR SELECT USING (true);

-- Insert mappings for self-pay programs (full payment)
INSERT INTO stripe_price_enrollment_map (
  stripe_price_id, program_slug, enrollment_type, funding_source, is_deposit, is_free_enrollment, description
) VALUES
-- Barber Apprenticeship
('price_1Sw0MiIRNf5vPH3AQm0MtqGP', 'barber-apprenticeship', 'program', 'SELF_PAY', false, false, 'Barber Apprenticeship - Full Payment $4,980'),
('price_1Sw3XrIRNf5vPH3AV9CpXMQD', 'barber-apprenticeship', 'program', 'SELF_PAY', true, false, 'Barber Apprenticeship - 35% Deposit $1,743'),

-- CNA Certification
('price_1Sw0MjIRNf5vPH3AsbrosRzm', 'cna-certification', 'program', 'SELF_PAY', false, false, 'CNA Certification - Full Payment $1,200'),
('price_1Sw3XrIRNf5vPH3AYj5EUeqD', 'cna-certification', 'program', 'SELF_PAY', true, false, 'CNA Certification - 35% Deposit $420'),

-- Cosmetology
('price_1Sw0N8IRNf5vPH3ACCquL2DS', 'cosmetology-apprenticeship', 'program', 'SELF_PAY', false, false, 'Cosmetology Apprenticeship - Full Payment $4,999'),
('price_1Sw3Y2IRNf5vPH3AAJoD2ghz', 'cosmetology-apprenticeship', 'program', 'SELF_PAY', true, false, 'Cosmetology Apprenticeship - 35% Deposit $1,750'),

-- Esthetician
('price_1Sw0MvIRNf5vPH3AQmARwmN1', 'esthetician-apprenticeship', 'program', 'SELF_PAY', false, false, 'Esthetician Apprenticeship - Full Payment $2,800'),
('price_1Sw3Y3IRNf5vPH3Axy85e22q', 'esthetician-apprenticeship', 'program', 'SELF_PAY', true, false, 'Esthetician Apprenticeship - 35% Deposit $980'),

-- HVAC
('price_1Sw0MiIRNf5vPH3AtfgR47tM', 'hvac-technician', 'program', 'SELF_PAY', false, false, 'HVAC Technician - Full Payment $5,500'),
('price_1Sw3XsIRNf5vPH3ATDbqt5QL', 'hvac-technician', 'program', 'SELF_PAY', true, false, 'HVAC Technician - 35% Deposit $1,925'),

-- CDL
('price_1Sw0KEIRNf5vPH3A0v7RlAZK', 'cdl-training', 'program', 'SELF_PAY', false, false, 'CDL Training - Full Payment $4,999'),
('price_1Sw3XsIRNf5vPH3AHXKqZ6OI', 'cdl-training', 'program', 'SELF_PAY', true, false, 'CDL Training - 35% Deposit $1,750'),

-- Medical Assistant
('price_1Sw0MiIRNf5vPH3AKrl1byt4', 'medical-assistant', 'program', 'SELF_PAY', false, false, 'Medical Assistant - Full Payment $4,200'),
('price_1Sw3Y3IRNf5vPH3AXRggDlJi', 'medical-assistant', 'program', 'SELF_PAY', true, false, 'Medical Assistant - 35% Deposit $1,470'),

-- Welding
('price_1Sw0N1IRNf5vPH3AxgRLR0Tc', 'welding-certification', 'program', 'SELF_PAY', false, false, 'Welding Certification - Full Payment $4,999'),
('price_1Sw3Y3IRNf5vPH3A30fWmtg3', 'welding-certification', 'program', 'SELF_PAY', true, false, 'Welding Certification - 35% Deposit $1,750'),

-- Electrical
('price_1Sw0N2IRNf5vPH3AUJiE2wcx', 'electrical-apprenticeship', 'program', 'SELF_PAY', false, false, 'Electrical Apprenticeship - Full Payment $4,999'),
('price_1Sw3YEIRNf5vPH3AY5GRReaX', 'electrical-apprenticeship', 'program', 'SELF_PAY', true, false, 'Electrical Apprenticeship - 35% Deposit $1,750'),

-- Plumbing
('price_1Sw0N7IRNf5vPH3AKxaVMVu7', 'plumbing-apprenticeship', 'program', 'SELF_PAY', false, false, 'Plumbing Apprenticeship - Full Payment $4,999'),
('price_1Sw3YEIRNf5vPH3AIeqemem8', 'plumbing-apprenticeship', 'program', 'SELF_PAY', true, false, 'Plumbing Apprenticeship - 35% Deposit $1,750'),

-- IT Support
('price_1Sw0N7IRNf5vPH3AYhZD45UF', 'it-support-specialist', 'program', 'SELF_PAY', false, false, 'IT Support Specialist - Full Payment $4,499'),
('price_1Sw3YFIRNf5vPH3AULx56Eyc', 'it-support-specialist', 'program', 'SELF_PAY', true, false, 'IT Support Specialist - 35% Deposit $1,575'),

-- Cybersecurity
('price_1Sw0N8IRNf5vPH3A6NdTRo3a', 'cybersecurity', 'program', 'SELF_PAY', false, false, 'Cybersecurity - Full Payment $4,499'),
('price_1Sw3YFIRNf5vPH3AqtXyw81e', 'cybersecurity', 'program', 'SELF_PAY', true, false, 'Cybersecurity - 35% Deposit $1,575'),

-- Building Maintenance
('price_1Sw0MoIRNf5vPH3AlfgIkzex', 'building-maintenance', 'program', 'SELF_PAY', false, false, 'Building Maintenance - Full Payment $3,800'),
('price_1Sw3YFIRNf5vPH3AxAChyphR', 'building-maintenance', 'program', 'SELF_PAY', true, false, 'Building Maintenance - 35% Deposit $1,330')

ON CONFLICT DO NOTHING;

-- Function to lookup enrollment mapping by price or product ID
DROP FUNCTION IF EXISTS lookup_stripe_enrollment_map(TEXT, TEXT);
CREATE OR REPLACE FUNCTION lookup_stripe_enrollment_map(
  p_price_id TEXT DEFAULT NULL,
  p_product_id TEXT DEFAULT NULL
)
RETURNS TABLE (
  program_slug TEXT,
  program_id UUID,
  enrollment_type TEXT,
  funding_source TEXT,
  is_deposit BOOLEAN,
  is_free_enrollment BOOLEAN,
  auto_enroll BOOLEAN,
  send_welcome_email BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Try price_id first (more specific)
  IF p_price_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      m.program_slug,
      m.program_id,
      m.enrollment_type,
      m.funding_source,
      m.is_deposit,
      m.is_free_enrollment,
      m.auto_enroll,
      m.send_welcome_email
    FROM stripe_price_enrollment_map m
    WHERE m.stripe_price_id = p_price_id
      AND m.is_active = true
    LIMIT 1;
    
    IF FOUND THEN
      RETURN;
    END IF;
  END IF;
  
  -- Fall back to product_id
  IF p_product_id IS NOT NULL THEN
    RETURN QUERY
    SELECT 
      m.program_slug,
      m.program_id,
      m.enrollment_type,
      m.funding_source,
      m.is_deposit,
      m.is_free_enrollment,
      m.auto_enroll,
      m.send_welcome_email
    FROM stripe_price_enrollment_map m
    WHERE m.stripe_product_id = p_product_id
      AND m.is_active = true
    LIMIT 1;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION lookup_stripe_enrollment_map TO service_role;

COMMENT ON TABLE stripe_price_enrollment_map IS 'Maps Stripe prices/products to enrollment configuration. Used by webhook fallback for Payment Links without metadata.';
COMMENT ON FUNCTION lookup_stripe_enrollment_map IS 'Looks up enrollment configuration by Stripe price_id or product_id. Returns NULL if no mapping found.';
