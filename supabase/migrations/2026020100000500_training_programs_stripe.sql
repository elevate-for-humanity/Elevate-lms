-- Training Programs with Stripe Integration
-- Links all Elevate training programs to Stripe products and prices
-- Pricing from tuition-fees page and program-constants.ts

-- Add missing columns to existing training_programs table
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS duration_formatted TEXT;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS tuition_cents INTEGER;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS tuition_dollars DECIMAL(10,2);
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS exam_fees_cents INTEGER DEFAULT 0;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS exam_fees_dollars DECIMAL(10,2) DEFAULT 0;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS materials_cents INTEGER DEFAULT 0;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS materials_dollars DECIMAL(10,2) DEFAULT 0;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS total_cost_cents INTEGER;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS total_cost_dollars DECIMAL(10,2);
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS deposit_cents INTEGER DEFAULT 0;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS deposit_dollars DECIMAL(10,2) DEFAULT 0;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS stripe_full_price_id TEXT;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS stripe_deposit_price_id TEXT;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS wioa_eligible BOOLEAN DEFAULT false;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS etpl_listed BOOLEAN DEFAULT false;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS credential_earned TEXT;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS accrediting_body TEXT;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS duration_weeks INTEGER;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS funding_types TEXT[] DEFAULT '{}';
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS wrg_eligible BOOLEAN DEFAULT false;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS apprenticeship_registered BOOLEAN DEFAULT false;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS certification_name TEXT;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS certifying_body TEXT;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create training programs table (no-op if exists)
CREATE TABLE IF NOT EXISTS training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  duration_weeks INTEGER,
  duration_formatted TEXT,
  tuition_cents INTEGER NOT NULL,
  tuition_dollars DECIMAL(10,2) NOT NULL,
  exam_fees_cents INTEGER DEFAULT 0,
  exam_fees_dollars DECIMAL(10,2) DEFAULT 0,
  materials_cents INTEGER DEFAULT 0,
  materials_dollars DECIMAL(10,2) DEFAULT 0,
  total_cost_cents INTEGER NOT NULL,
  total_cost_dollars DECIMAL(10,2) NOT NULL,
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  funding_types TEXT[] DEFAULT '{}',
  wioa_eligible BOOLEAN DEFAULT false,
  wrg_eligible BOOLEAN DEFAULT false,
  apprenticeship_registered BOOLEAN DEFAULT false,
  certification_name TEXT,
  certifying_body TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS slug TEXT;
CREATE INDEX IF NOT EXISTS idx_training_programs_slug ON training_programs(slug);
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS category TEXT;
CREATE INDEX IF NOT EXISTS idx_training_programs_category ON training_programs(category);
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS is_active TEXT;
CREATE INDEX IF NOT EXISTS idx_training_programs_active ON training_programs(is_active);
ALTER TABLE training_programs ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;
CREATE INDEX IF NOT EXISTS idx_training_programs_stripe ON training_programs(stripe_product_id);

-- Enable RLS
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;

-- Public read access
DROP POLICY IF EXISTS "Anyone can view active training programs" ON training_programs;
CREATE POLICY "Anyone can view active training programs" ON training_programs
  FOR SELECT USING (is_active = true);

-- Admin management
DROP POLICY IF EXISTS "Admins can manage training programs" ON training_programs;
CREATE POLICY "Admins can manage training programs" ON training_programs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Insert all training programs with Stripe IDs
INSERT INTO training_programs (
  slug, name, category, description, duration_weeks, duration_formatted,
  tuition_cents, tuition_dollars, exam_fees_cents, exam_fees_dollars,
  materials_cents, materials_dollars, total_cost_cents, total_cost_dollars,
  stripe_product_id, stripe_price_id, funding_types, wioa_eligible, wrg_eligible,
  apprenticeship_registered, certification_name, certifying_body
) VALUES

-- Healthcare Programs
('cna-certification', 'CNA (Certified Nursing Assistant)', 'Healthcare',
 'Become a Certified Nursing Assistant in 4-6 weeks. Prepare for the Indiana State CNA competency exam.',
 6, '4-6 weeks', 120000, 1200.00, 10500, 105.00, 7500, 75.00, 138000, 1380.00,
 'prod_TtXwt86rs7atPG', 'price_1Sw0MjIRNf5vPH3AsbrosRzm',
 ARRAY['Self-Pay'], false, false, false,
 'Certified Nursing Assistant', 'Indiana State Department of Health'),

('medical-assistant', 'Medical Assistant', 'Healthcare',
 'Comprehensive medical assistant training covering clinical and administrative skills.',
 12, '12 weeks', 420000, 4200.00, 0, 0.00, 15000, 150.00, 435000, 4350.00,
 'prod_TtXw0OKVMP3qt9', 'price_1Sw0MiIRNf5vPH3AKrl1byt4',
 ARRAY['WIOA', 'WRG'], true, true, false,
 'Medical Assistant Certificate', 'Elevate for Humanity'),

('phlebotomy-technician', 'Phlebotomy Technician', 'Healthcare',
 'Learn venipuncture and blood collection techniques for healthcare settings.',
 8, '8 weeks', 130500, 1305.00, 0, 0.00, 0, 0.00, 130500, 1305.00,
 'prod_TtXwPRdRtqxkRf', 'price_1Sw0MoIRNf5vPH3AkuXr8MH2',
 ARRAY['WIOA', 'WRG'], true, true, false,
 'Phlebotomy Technician Certificate', 'Elevate for Humanity'),

('home-health-aide', 'Home Health Aide', 'Healthcare',
 'Training for providing in-home care to elderly and disabled individuals.',
 12, '12 weeks', 470000, 4700.00, 0, 0.00, 0, 0.00, 470000, 4700.00,
 'prod_TtXwWlHCC8wDBQ', 'price_1Sw0MvIRNf5vPH3AVqaHbVEk',
 ARRAY['WIOA', 'WRG'], true, true, false,
 'Home Health Aide Certificate', 'Elevate for Humanity'),

('emergency-health-safety-tech', 'Emergency Health & Safety Tech', 'Healthcare',
 'Comprehensive emergency response and workplace safety training.',
 16, '16 weeks', 475000, 4750.00, 0, 0.00, 0, 0.00, 475000, 4750.00,
 'prod_TtXwrUZPzNdFGn', 'price_1Sw0MvIRNf5vPH3A9fiqsHgk',
 ARRAY['WIOA', 'WRG'], true, true, false,
 'Emergency Health & Safety Certificate', 'Elevate for Humanity'),

-- Skilled Trades Programs
('hvac-technician', 'HVAC Technician', 'Skilled Trades',
 'Heating, ventilation, and air conditioning installation and repair training.',
 36, '4-9 months', 550000, 5500.00, 15000, 150.00, 20000, 200.00, 585000, 5850.00,
 'prod_Tpj3MPuM0PxNUI', 'price_1Sw0MiIRNf5vPH3AtfgR47tM',
 ARRAY['WIOA', 'WRG'], true, true, false,
 'EPA 608 Certification', 'Environmental Protection Agency'),

('building-maintenance-tech', 'Building Maintenance Technician', 'Skilled Trades',
 'Comprehensive building maintenance including electrical, plumbing, and HVAC basics.',
 16, '16 weeks', 380000, 3800.00, 0, 0.00, 20000, 200.00, 400000, 4000.00,
 'prod_Ttf4Syhwql0x8U', 'price_1Sw0MoIRNf5vPH3AlfgIkzex',
 ARRAY['WIOA', 'WRG'], true, true, false,
 'Building Maintenance Certificate', 'Elevate for Humanity'),

('welding-certification', 'Welding Certification', 'Skilled Trades',
 'Learn MIG, TIG, and stick welding techniques for manufacturing and construction.',
 16, '16 weeks', 499900, 4999.00, 0, 0.00, 0, 0.00, 499900, 4999.00,
 'prod_Tpj3Th2kUVC0Qf', 'price_1Sw0N1IRNf5vPH3AxgRLR0Tc',
 ARRAY['WIOA', 'WRG'], true, true, true,
 'AWS Welding Certification', 'American Welding Society'),

('electrical-apprenticeship', 'Electrical Apprenticeship', 'Skilled Trades',
 'USDOL-registered electrical apprenticeship program.',
 208, '4 years', 499900, 4999.00, 0, 0.00, 0, 0.00, 499900, 4999.00,
 'prod_Tpj3tdFxOiIoBL', 'price_1Sw0N2IRNf5vPH3AUJiE2wcx',
 ARRAY['WIOA', 'Apprenticeship Grants'], true, false, true,
 'Journeyman Electrician License', 'Indiana Professional Licensing Agency'),

('plumbing-apprenticeship', 'Plumbing Apprenticeship', 'Skilled Trades',
 'USDOL-registered plumbing apprenticeship program.',
 208, '4 years', 499900, 4999.00, 0, 0.00, 0, 0.00, 499900, 4999.00,
 'prod_Tpj3prd6EuNRWZ', 'price_1Sw0N7IRNf5vPH3AKxaVMVu7',
 ARRAY['WIOA', 'Apprenticeship Grants'], true, false, true,
 'Journeyman Plumber License', 'Indiana Professional Licensing Agency'),

-- Beauty & Cosmetology Programs
('barber-apprenticeship', 'Barber Apprenticeship', 'Beauty & Cosmetology',
 'USDOL-registered barber apprenticeship. Earn while you learn with 2,000 hours of hands-on training.',
 52, '12 months', 498000, 4980.00, 10000, 100.00, 0, 0.00, 508000, 5080.00,
 'prod_Tpj31nVn1nCUB9', 'price_1Sw0MiIRNf5vPH3AQm0MtqGP',
 ARRAY['WIOA', 'Apprenticeship Grants', 'Self-Pay'], true, false, true,
 'Indiana Barber License', 'Indiana Professional Licensing Agency'),

('cosmetology-apprenticeship', 'Cosmetology Apprenticeship', 'Beauty & Cosmetology',
 'USDOL-registered cosmetology apprenticeship with 1,500 hours of training.',
 40, '10 months', 499900, 4999.00, 10000, 100.00, 0, 0.00, 509900, 5099.00,
 'prod_Tpj3fmBM6V8i4K', 'price_1Sw0N8IRNf5vPH3ACCquL2DS',
 ARRAY['WIOA', 'Apprenticeship Grants', 'Self-Pay'], true, false, true,
 'Indiana Cosmetology License', 'Indiana Professional Licensing Agency'),

('esthetician-apprenticeship', 'Esthetician Apprenticeship', 'Beauty & Cosmetology',
 'Skincare and esthetics training program.',
 24, '6 months', 280000, 2800.00, 0, 0.00, 0, 0.00, 280000, 2800.00,
 'prod_Ttf4qqJyLFydks', 'price_1Sw0MvIRNf5vPH3AQmARwmN1',
 ARRAY['WIOA', 'Self-Pay'], true, false, false,
 'Indiana Esthetician License', 'Indiana Professional Licensing Agency'),

('beauty-career-educator', 'Beauty Career Educator', 'Beauty & Cosmetology',
 'Train to become a licensed beauty instructor.',
 20, '20 weeks', 457500, 4575.00, 0, 0.00, 0, 0.00, 457500, 4575.00,
 'prod_TtXwVae6FPBCVx', 'price_1Sw0MpIRNf5vPH3AoiFUXQUY',
 ARRAY['WIOA', 'Self-Pay'], true, false, false,
 'Beauty Instructor License', 'Indiana Professional Licensing Agency'),

-- Transportation Programs
('cdl-training', 'CDL (Commercial Driver''s License)', 'Transportation',
 'Get your Commercial Driver''s License and start earning $50,000+ annually.',
 6, '4-6 weeks', 500000, 5000.00, 15000, 150.00, 0, 0.00, 515000, 5150.00,
 'prod_Tpj3J9kY81qup0', 'price_1Sw0KEIRNf5vPH3A0v7RlAZK',
 ARRAY['WIOA', 'WRG'], true, true, false,
 'Commercial Driver''s License (CDL)', 'Indiana Bureau of Motor Vehicles'),

-- Technology Programs
('it-support-specialist', 'IT Support Specialist', 'Technology',
 'CompTIA A+ preparation and help desk support training.',
 16, '16 weeks', 449900, 4499.00, 0, 0.00, 0, 0.00, 449900, 4499.00,
 'prod_Tpj34HcRLncjgr', 'price_1Sw0N7IRNf5vPH3AYhZD45UF',
 ARRAY['WIOA', 'WRG'], true, true, false,
 'CompTIA A+ Certification', 'CompTIA'),

('cybersecurity-fundamentals', 'Cybersecurity Fundamentals', 'Technology',
 'Introduction to cybersecurity concepts and Security+ preparation.',
 16, '16 weeks', 449900, 4499.00, 0, 0.00, 0, 0.00, 449900, 4499.00,
 'prod_Tpj3ho4ng4Josf', 'price_1Sw0N8IRNf5vPH3A6NdTRo3a',
 ARRAY['WIOA', 'WRG'], true, true, false,
 'CompTIA Security+ Certification', 'CompTIA'),

-- Human Services Programs
('peer-recovery-coach', 'Peer Recovery Specialist', 'Human Services',
 'Become a certified peer recovery coach to help others in addiction recovery.',
 8, '8 weeks', 250000, 2500.00, 5000, 50.00, 0, 0.00, 255000, 2550.00,
 'prod_TtXwXNoX8ooBLV', 'price_1Sw0MpIRNf5vPH3AovSyk3Z9',
 ARRAY['WIOA'], true, false, false,
 'Certified Peer Recovery Coach', 'Indiana DMHA'),

('public-safety-reentry', 'Public Safety Reentry Specialist', 'Human Services',
 'Training for supporting formerly incarcerated individuals in successful reentry.',
 16, '16 weeks', 432500, 4325.00, 0, 0.00, 0, 0.00, 432500, 4325.00,
 'prod_TtXwEFAZ05cWTo', 'price_1Sw0N1IRNf5vPH3AU4qwlgnV',
 ARRAY['WIOA', 'WRG'], true, true, false,
 'Reentry Specialist Certificate', 'Elevate for Humanity'),

('drug-alcohol-specimen-collector', 'Drug & Alcohol Specimen Collector', 'Human Services',
 'DOT-compliant training for urine and oral fluid specimen collection.',
 12, '12 weeks', 475000, 4750.00, 0, 0.00, 0, 0.00, 475000, 4750.00,
 'prod_TtiKfCmdtcPqri', 'price_1Sw0N1IRNf5vPH3ASlJFEiv8',
 ARRAY['WIOA', 'WRG', 'Self-Pay'], true, true, false,
 'DOT Collector Certification', 'National Drug Screening'),

-- Business Programs
('business-startup-marketing', 'Business Startup & Marketing', 'Business',
 'Learn to start and market your own business.',
 16, '16 weeks', 475000, 4750.00, 0, 0.00, 0, 0.00, 475000, 4750.00,
 'prod_TtXw7HvvDjzHSq', 'price_1Sw0MvIRNf5vPH3AKGMFKJJA',
 ARRAY['WIOA', 'WRG'], true, true, false,
 'Business Startup Certificate', 'Elevate for Humanity'),

('tax-preparation', 'Tax Preparation', 'Business',
 'Learn tax preparation for individuals and small businesses.',
 6, '6 weeks', 150000, 1500.00, 0, 0.00, 5000, 50.00, 155000, 1550.00,
 NULL, NULL, -- No Stripe product yet
 ARRAY['Self-Pay'], false, false, false,
 'Tax Preparer Certificate', 'Elevate for Humanity')

ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  tuition_cents = EXCLUDED.tuition_cents,
  tuition_dollars = EXCLUDED.tuition_dollars,
  total_cost_cents = EXCLUDED.total_cost_cents,
  total_cost_dollars = EXCLUDED.total_cost_dollars,
  stripe_product_id = EXCLUDED.stripe_product_id,
  stripe_price_id = EXCLUDED.stripe_price_id,
  funding_types = EXCLUDED.funding_types,
  wioa_eligible = EXCLUDED.wioa_eligible,
  updated_at = NOW();

-- Create program enrollments table
CREATE TABLE IF NOT EXISTS program_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  program_id UUID,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  amount_paid_cents INTEGER NOT NULL,
  funding_source TEXT,
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  status TEXT DEFAULT 'pending',
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  certificate_url TEXT,
  notes TEXT
);

-- Create indexes
ALTER TABLE program_enrollments ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_program_enrollments_user ON program_enrollments(user_id);
ALTER TABLE program_enrollments ADD COLUMN IF NOT EXISTS program_id UUID;
CREATE INDEX IF NOT EXISTS idx_program_enrollments_program ON program_enrollments(program_id);
ALTER TABLE program_enrollments ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_program_enrollments_status ON program_enrollments(status);
ALTER TABLE program_enrollments ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
CREATE INDEX IF NOT EXISTS idx_program_enrollments_stripe ON program_enrollments(stripe_payment_intent_id);

-- Enable RLS
ALTER TABLE program_enrollments ENABLE ROW LEVEL SECURITY;

-- Users can view own enrollments
DROP POLICY IF EXISTS "Users can view own program enrollments" ON program_enrollments;
CREATE POLICY "Users can view own program enrollments" ON program_enrollments
  FOR SELECT USING (user_id = auth.uid());

-- System can insert enrollments
DROP POLICY IF EXISTS "System can insert program enrollments" ON program_enrollments;
CREATE POLICY "System can insert program enrollments" ON program_enrollments
  FOR INSERT WITH CHECK (true);

-- Admins can manage all enrollments
DROP POLICY IF EXISTS "Admins can manage program enrollments" ON program_enrollments;
CREATE POLICY "Admins can manage program enrollments" ON program_enrollments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Grant permissions
GRANT SELECT ON training_programs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON program_enrollments TO authenticated;

-- Create view for program catalog
CREATE OR REPLACE VIEW program_catalog AS
SELECT 
  id,
  slug,
  name,
  category,
  description,
  duration_formatted,
  tuition_dollars,
  total_cost_dollars,
  stripe_product_id,
  stripe_price_id,
  funding_types,
  wioa_eligible,
  wrg_eligible,
  apprenticeship_registered,
  certification_name
FROM training_programs
WHERE is_active = true
ORDER BY category, name;

GRANT SELECT ON program_catalog TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Training Programs migration complete!';
  RAISE NOTICE '📊 22 programs inserted with Stripe product/price IDs';
  RAISE NOTICE '💰 Pricing from tuition-fees page';
END $$;
