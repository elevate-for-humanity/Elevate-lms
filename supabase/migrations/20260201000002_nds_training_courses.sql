-- NDS Training Courses Migration
-- Links NDS/MyDrugTestTraining courses to Stripe products with correct 50/50 markup pricing
-- Pricing: Elevate Price = NDS Wholesale Cost × 2 (50/50 revenue share)

-- Ensure partner_lms_providers table exists and has NDS
-- Ensure NDS provider exists (upsert without unique constraint)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM partner_lms_providers WHERE provider_type = 'nds') THEN
    INSERT INTO partner_lms_providers (provider_name, provider_type, website_url, active, api_config)
    VALUES ('National Drug Screening', 'nds', 'https://mydrugtesttraining.com', true, '{"base_url":"https://mydrugtesttraining.com"}'::jsonb);
  ELSE
    UPDATE partner_lms_providers SET
      provider_name = 'National Drug Screening',
      website_url = 'https://mydrugtesttraining.com',
      active = true
    WHERE provider_type = 'nds';
  END IF;
END $$;

-- Create NDS training courses table if not exists
CREATE TABLE IF NOT EXISTS nds_training_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code TEXT UNIQUE NOT NULL,
  course_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  duration_hours DECIMAL(4,1),
  nds_wholesale_cost DECIMAL(10,2) NOT NULL,
  elevate_retail_price DECIMAL(10,2) NOT NULL,
  markup_percentage DECIMAL(5,2) DEFAULT 100.00, -- 50/50 = 100% markup
  stripe_product_id TEXT,
  stripe_price_id TEXT,
  external_course_url TEXT,
  certification_name TEXT,
  is_active BOOLEAN DEFAULT true,
  is_new BOOLEAN DEFAULT false,
  is_popular BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
ALTER TABLE nds_training_courses ADD COLUMN IF NOT EXISTS category TEXT;
CREATE INDEX IF NOT EXISTS idx_nds_courses_category ON nds_training_courses(category);
ALTER TABLE nds_training_courses ADD COLUMN IF NOT EXISTS is_active TEXT;
CREATE INDEX IF NOT EXISTS idx_nds_courses_active ON nds_training_courses(is_active);
ALTER TABLE nds_training_courses ADD COLUMN IF NOT EXISTS stripe_product_id TEXT;
CREATE INDEX IF NOT EXISTS idx_nds_courses_stripe ON nds_training_courses(stripe_product_id);

-- Enable RLS
ALTER TABLE nds_training_courses ENABLE ROW LEVEL SECURITY;

-- Public read access for active courses
DROP POLICY IF EXISTS "Anyone can view active NDS courses" ON nds_training_courses;
CREATE POLICY "Anyone can view active NDS courses" ON nds_training_courses
  FOR SELECT USING (is_active = true);

-- Admin management
DROP POLICY IF EXISTS "Admins can manage NDS courses" ON nds_training_courses;
CREATE POLICY "Admins can manage NDS courses" ON nds_training_courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Insert all NDS training courses with Stripe IDs
INSERT INTO nds_training_courses (
  course_code, course_name, description, category, duration_hours,
  nds_wholesale_cost, elevate_retail_price, stripe_product_id, stripe_price_id,
  external_course_url, certification_name, is_popular, is_new
) VALUES
-- Supervisor Training
('NDS-DOT-SUPER', 'DOT Supervisor Training Course', 
 'Required training for supervisors of DOT-regulated employees. Learn to identify signs of drug and alcohol use and make reasonable suspicion determinations.',
 'Supervisor Training', 2.0, 65.00, 130.00,
 'prod_TtmCoVdUVLoScN', 'price_1Svz8qIRNf5vPH3AtY0AM9Ox',
 'https://mydrugtesttraining.com/course/dot-supervisor-training-course',
 'DOT Compliant Certificate', false, false),

('NDS-NONDOT-SUPER', 'Non-DOT Supervisor Training Course',
 'Training for supervisors in non-DOT workplaces. Covers drug-free workplace policies, recognizing impairment, and documentation.',
 'Supervisor Training', 2.0, 65.00, 130.00,
 'prod_TtmCaWJyggUyS0', 'price_1Svz8qIRNf5vPH3AoIf0pNax',
 'https://mydrugtesttraining.com/course/nds-non-dot-supervisor-training-course',
 'Certificate of Completion', false, false),

('NDS-DOT-SUPER-REFRESH', 'DOT Supervisor Training Course (Refresher)',
 'Refresher training for supervisors to stay updated on the latest drug and alcohol testing protocols and DOT regulations.',
 'Supervisor Training', 1.0, 45.00, 90.00,
 'prod_TtmjpWTJcWilsG', 'price_1SvzA2IRNf5vPH3A03yUFSHP',
 'https://mydrugtesttraining.com/course/nds-dot-supervisor-training-course-refresher',
 'DOT Refresher Certificate', false, false),

('NDS-SUPER-BUNDLE', 'DOT & Non-DOT Supervisor Training Bundle',
 'Combined DOT and Non-DOT supervisor training at a discounted bundle price.',
 'Supervisor Training', 4.0, 110.00, 220.00,
 'prod_TtmjMIf1WymQqo', 'price_1SvzARIRNf5vPH3AFwwdDqYE',
 'https://mydrugtesttraining.com/course/nds-dot-non-dot-supervisor-training-course',
 'DOT & Non-DOT Certificates', true, false),

('NDS-FRA-SUPER', 'FRA Supervisor Reasonable Suspicion & Post-Accident Training',
 'FRA-specific supervisor training covering reasonable suspicion and post-accident toxicological testing requirements.',
 'Supervisor Training', 3.0, 220.00, 440.00,
 'prod_TtmjBqHtAe4hpQ', 'price_1SvzA7IRNf5vPH3AGlkbCwTV',
 'https://mydrugtesttraining.com/course/nds-fra-supervisor-reasonable-suspicion-and-post-accident-toxicological-testing-training',
 'FRA Supervisor Certificate', false, false),

-- Employee Training
('NDS-DFWP-EMP', 'Drug Free Workplace Training for Employees',
 'Employee awareness training covering drug-free workplace policies, testing procedures, and consequences of violations.',
 'Employee Training', 1.0, 22.00, 44.00,
 'prod_TtmC3bOZt9JgdF', 'price_1Svz8rIRNf5vPH3ABz5zU1UW',
 'https://mydrugtesttraining.com/course/drug-free-workplace-training-for-employees',
 'Certificate of Completion', true, false),

-- Collector Certification
('NDS-DOT-URINE-FULL', 'DOT Urine Specimen Collector Training and Mocks',
 'Complete DOT urine collector certification. Includes online training and mock collections required for certification.',
 'Collector Certification', 8.0, 655.00, 1310.00,
 'prod_TtmCZ3g8oPJESa', 'price_1Svz8yIRNf5vPH3ADpVzcaYT',
 'https://mydrugtesttraining.com/course/dot-urine-specimen-collector-training-and-mocks',
 'DOT Collector Certification', false, false),

('NDS-DOT-URINE-MOCKS', 'DOT Urine Collector Mock Collections',
 'Mock collection sessions for collectors who have completed training. Required for initial certification and refresher.',
 'Collector Certification', 2.5, 330.00, 660.00,
 'prod_TtmCulXQYouwOD', 'price_1Svz8zIRNf5vPH3Auu8QZyT1',
 'https://mydrugtesttraining.com/course/nds-dot-collector-mock-collections',
 'Mock Completion Certificate', false, false),

('NDS-DOT-ORAL-FULL', 'DOT Oral Fluid Collector Training (Mocks Included)',
 'Complete training for DOT oral fluid specimen collection. Includes mock collections.',
 'Collector Certification', 8.0, 699.00, 1398.00,
 'prod_TtmC8qiKlETWNv', 'price_1Svz8zIRNf5vPH3AfraNLRot',
 'https://mydrugtesttraining.com/course/dot-oral-fluid-collector-mocks',
 'DOT Oral Fluid Collector Certification', false, true),

('NDS-DOT-ORAL-NOMOCKS', 'DOT Oral Fluid Collector Training (No Mocks)',
 'DOT oral fluid collector training without mock collections. Mocks must be completed separately.',
 'Collector Certification', 4.0, 499.00, 998.00,
 'prod_Ttmj96xeJxniwX', 'price_1Svz9wIRNf5vPH3ASrjCCZQc',
 'https://mydrugtesttraining.com/course/dot-oral-fluid-collector-training-course-no-mocks',
 'Training Certificate (Mocks Required)', false, false),

('NDS-ORAL-NONDOT', 'Saliva/Oral Fluid Non-DOT Drug Testing Training',
 'Training for non-DOT oral fluid specimen collection procedures.',
 'Collector Certification', 4.0, 350.00, 700.00,
 'prod_TtmCWKvpBfukyB', 'price_1Svz8zIRNf5vPH3AubLEClix',
 'https://mydrugtesttraining.com/course/nds-saliva-oral-fluid-drug-testing-training',
 'Certificate of Completion', false, false),

('NDS-STT', 'DOT Alcohol Screening Test Technician (STT) Training',
 'Become a DOT qualified Screening Test Technician for breath alcohol testing.',
 'Collector Certification', 4.0, 299.00, 598.00,
 'prod_TtmjnjTGwtLTHi', 'price_1SvzACIRNf5vPH3AqdXR56ce',
 'https://mydrugtesttraining.com/course/nds-dot-alcohol-screening-test-technician-stt-training',
 'STT Certification', false, false),

('NDS-HAIR', 'Hair Specimen Collector Training & Certification',
 'Training for hair specimen collection for long-term substance abuse detection (90-day window).',
 'Collector Certification', 4.0, 399.00, 798.00,
 'prod_Ttmj8DzpsJgIVb', 'price_1SvzAHIRNf5vPH3AolTMpnM8',
 'https://mydrugtesttraining.com/course/nds-hair-specimen-collector-training-certification',
 'Hair Collector Certification', false, false),

('NDS-DNA', 'Legal & Curiosity DNA Collector Training',
 'DNA paternity collection training and certification for legal and curiosity testing.',
 'Collector Certification', 3.0, 299.00, 598.00,
 'prod_TtmjzhQBgbtfIP', 'price_1SvzANIRNf5vPH3AhlPcOdfX',
 'https://mydrugtesttraining.com/course/nds-legal-curiosity-dna-collector-training-certification',
 'DNA Collector Certification', false, false),

-- DER Training
('NDS-DER-FMCSA', 'DER Training Course - FMCSA',
 'Comprehensive DER training for FMCSA-regulated employers. Covers all DER responsibilities and Clearinghouse requirements.',
 'DER Training', 4.0, 220.00, 440.00,
 'prod_TtmCtyaJJJ0Ioe', 'price_1Svz96IRNf5vPH3Ap9VFD314',
 'https://mydrugtesttraining.com/course/nds-der-training-course-fmcsa',
 'DER Certificate', true, false),

('NDS-DER-FAA', 'DER Training Course - FAA',
 'DER training specific to FAA drug and alcohol testing requirements.',
 'DER Training', 4.0, 220.00, 440.00,
 'prod_TtmCCs91JmHtGE', 'price_1Svz96IRNf5vPH3ATdvWWy7x',
 'https://mydrugtesttraining.com/course/nds-der-training-course-faa',
 'DER Certificate', false, false),

('NDS-DER-FRA', 'DER Training Course - FRA',
 'DER training for FRA-regulated railroad employers.',
 'DER Training', 4.0, 220.00, 440.00,
 'prod_TtmiFxX4kbTLsJ', 'price_1Svz9PIRNf5vPH3AisCDpbQD',
 'https://mydrugtesttraining.com/course/nds-der-training-course-fra',
 'DER Certificate', false, false),

('NDS-DER-FTA', 'DER Training Course - FTA',
 'DER training for FTA-regulated public transit employers.',
 'DER Training', 4.0, 220.00, 440.00,
 'prod_TtmixLhgQGpf1T', 'price_1Svz9TIRNf5vPH3AcZZPARQk',
 'https://mydrugtesttraining.com/course/nds-der-training-course-fta',
 'DER Certificate', false, false),

('NDS-DER-PHMSA', 'DER Training Course - PHMSA',
 'DER training for PHMSA-regulated pipeline and hazmat employers.',
 'DER Training', 4.0, 220.00, 440.00,
 'prod_TtmiRa4bDY8EfY', 'price_1Svz9YIRNf5vPH3AUReVz4ph',
 'https://mydrugtesttraining.com/course/nds-der-training-course-phmsa',
 'DER Certificate', false, false),

('NDS-DER-USCG', 'DER Training Course - USCG',
 'DER training for USCG-regulated maritime employers.',
 'DER Training', 4.0, 220.00, 440.00,
 'prod_TtmjvfIBcmC07R', 'price_1Svz9cIRNf5vPH3AKvxdKFJe',
 'https://mydrugtesttraining.com/course/nds-der-training-course-uscg',
 'DER Certificate', false, false),

('NDS-DER-NONDOT', 'Non-DOT General DER Training',
 'DER training for non-DOT employers managing workplace drug testing programs.',
 'DER Training', 4.0, 220.00, 440.00,
 'prod_TtmCWqQ7Hx6Nm6', 'price_1Svz96IRNf5vPH3Ai9YE9aZy',
 'https://mydrugtesttraining.com/course/nds-non-dot-general-designated-employer-representative-training-der',
 'DER Certificate', false, false),

-- Advanced & Business Training
('NDS-STARTUP', 'Drug Testing Start-Up Overview',
 'Learn how to start a drug testing business. Covers industry overview, requirements, and business setup.',
 'Advanced Training', 2.0, 99.00, 198.00,
 'prod_Ttmj8ntFUgNDKP', 'price_1Svz9hIRNf5vPH3AYYMncT7Q',
 'https://mydrugtesttraining.com/course/nds-drug-testing-start-up-overview',
 'Certificate of Completion', false, false),

('NDS-TTT-URINE', 'DOT Urine Specimen Collector Train the Trainer',
 'Become a qualified trainer for DOT urine specimen collectors. For experienced collectors wanting to train others.',
 'Advanced Training', 16.0, 1750.00, 3500.00,
 'prod_TtmjonT5BEfpgy', 'price_1Svz9mIRNf5vPH3A1bVgS4K4',
 'https://mydrugtesttraining.com/course/nds-dot-urine-specimen-collector-train-the-trainer',
 'Train the Trainer Certification', false, false),

('NDS-TTT-ORAL', 'DOT Oral Fluid Collector Train-the-Trainer',
 'Become a qualified trainer for DOT oral fluid specimen collectors. Includes collector training, mocks, and trainer certification.',
 'Advanced Training', 16.0, 1999.00, 3998.00,
 'prod_TtmjW1riWJm2Yq', 'price_1Svz9rIRNf5vPH3AXdbAxxh1',
 'https://mydrugtesttraining.com/course/dot-oral-fluid-collector-train-the-trainer',
 'Train the Trainer Certification', false, true)

ON CONFLICT (course_code) DO UPDATE SET
  course_name = EXCLUDED.course_name,
  description = EXCLUDED.description,
  nds_wholesale_cost = EXCLUDED.nds_wholesale_cost,
  elevate_retail_price = EXCLUDED.elevate_retail_price,
  stripe_product_id = EXCLUDED.stripe_product_id,
  stripe_price_id = EXCLUDED.stripe_price_id,
  external_course_url = EXCLUDED.external_course_url,
  certification_name = EXCLUDED.certification_name,
  is_popular = EXCLUDED.is_popular,
  is_new = EXCLUDED.is_new,
  updated_at = NOW();

-- Create NDS course purchases table for tracking enrollments
CREATE TABLE IF NOT EXISTS nds_course_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  course_id UUID,
  email TEXT NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  nds_cost DECIMAL(10,2) NOT NULL,
  profit DECIMAL(10,2) NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_session_id TEXT,
  status TEXT DEFAULT 'pending',
  nds_enrollment_id TEXT,
  nds_access_url TEXT,
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  certificate_url TEXT,
  UNIQUE(user_id, course_id)
);

-- Create indexes for purchases
ALTER TABLE nds_course_purchases ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_nds_purchases_user ON nds_course_purchases(user_id);
ALTER TABLE nds_course_purchases ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_nds_purchases_status ON nds_course_purchases(status);
ALTER TABLE nds_course_purchases ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT;
CREATE INDEX IF NOT EXISTS idx_nds_purchases_stripe ON nds_course_purchases(stripe_payment_intent_id);

-- Enable RLS on purchases
ALTER TABLE nds_course_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view own purchases
DROP POLICY IF EXISTS "Users can view own NDS purchases" ON nds_course_purchases;
CREATE POLICY "Users can view own NDS purchases" ON nds_course_purchases
  FOR SELECT USING (user_id = auth.uid());

-- System can insert purchases
DROP POLICY IF EXISTS "System can insert NDS purchases" ON nds_course_purchases;
CREATE POLICY "System can insert NDS purchases" ON nds_course_purchases
  FOR INSERT WITH CHECK (true);

-- Admins can manage all purchases
DROP POLICY IF EXISTS "Admins can manage NDS purchases" ON nds_course_purchases;
CREATE POLICY "Admins can manage NDS purchases" ON nds_course_purchases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Create view for easy course catalog access
CREATE OR REPLACE VIEW nds_course_catalog AS
SELECT 
  id,
  course_code,
  course_name,
  description,
  category,
  duration_hours,
  nds_wholesale_cost,
  elevate_retail_price,
  markup_percentage,
  stripe_product_id,
  stripe_price_id,
  external_course_url,
  certification_name,
  is_active,
  is_new,
  is_popular
FROM nds_training_courses
WHERE is_active = true
ORDER BY 
  CASE category
    WHEN 'Supervisor Training' THEN 1
    WHEN 'Employee Training' THEN 2
    WHEN 'Collector Certification' THEN 3
    WHEN 'DER Training' THEN 4
    WHEN 'Advanced Training' THEN 5
    ELSE 6
  END,
  elevate_retail_price ASC;

-- Grant permissions
GRANT SELECT ON nds_training_courses TO authenticated;
GRANT SELECT ON nds_course_catalog TO authenticated;
GRANT SELECT, INSERT, UPDATE ON nds_course_purchases TO authenticated;

-- Create function to calculate profit on purchase
CREATE OR REPLACE FUNCTION calculate_nds_profit()
RETURNS TRIGGER AS $$
BEGIN
  -- Get the NDS cost from the course
  SELECT nds_wholesale_cost INTO NEW.nds_cost
  FROM nds_training_courses
  WHERE id = NEW.course_id;
  
  -- Calculate profit (amount paid - NDS cost)
  NEW.profit := NEW.amount_paid - NEW.nds_cost;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate profit
DROP TRIGGER IF EXISTS trg_calculate_nds_profit ON nds_course_purchases;
CREATE TRIGGER trg_calculate_nds_profit
  BEFORE INSERT ON nds_course_purchases
  FOR EACH ROW
  EXECUTE FUNCTION calculate_nds_profit();

-- ============================================================================
-- CDL-INCLUDED COURSES (Free with CDL Program Enrollment)
-- These courses are bundled with CDL program - no separate retail price
-- ============================================================================

CREATE TABLE IF NOT EXISTS nds_cdl_included_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code TEXT UNIQUE NOT NULL,
  course_name TEXT NOT NULL,
  description TEXT,
  duration_hours DECIMAL(4,1),
  stripe_product_id TEXT,
  external_course_url TEXT,
  certification_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE nds_cdl_included_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view CDL included courses" ON nds_cdl_included_courses;
CREATE POLICY "Anyone can view CDL included courses" ON nds_cdl_included_courses
  FOR SELECT USING (is_active = true);

-- Insert CDL-included courses
INSERT INTO nds_cdl_included_courses (
  course_code, course_name, description, duration_hours,
  stripe_product_id, external_course_url, certification_name
) VALUES
('NDS-CDL-DRUG-ALCOHOL', 'DOT Drug & Alcohol Awareness',
 'Required DOT training for all CDL drivers and safety-sensitive employees covering drug and alcohol testing requirements.',
 2.5, 'prod_TtmCfKsaUoite8',
 'https://mydrugtesttraining.com/course/dot-drug-alcohol',
 'DOT Compliance Certificate'),

('NDS-CDL-HOS', 'Hours of Service (HOS) Compliance',
 'DOT hours of service regulations and electronic logging device (ELD) requirements for commercial drivers.',
 2.0, 'prod_TtmC90w72WxHH4',
 'https://mydrugtesttraining.com/course/hours-of-service',
 'HOS Compliance Certificate'),

('NDS-CDL-PRETRIP', 'CDL Pre-Trip Inspection Training',
 'Complete pre-trip inspection procedures required for CDL testing and daily vehicle safety checks.',
 2.5, 'prod_TtmCNuxvORiMSh',
 'https://mydrugtesttraining.com/course/pre-trip-inspection',
 'Pre-Trip Inspection Certificate'),

('NDS-CDL-SUSPICION', 'DOT Reasonable Suspicion Training',
 'Required training for supervisors to identify signs of drug and alcohol use in DOT-regulated employees.',
 2.0, 'prod_TtmCbhMkt7eUSZ',
 'https://mydrugtesttraining.com/course/reasonable-suspicion',
 'DOT Supervisor Certificate'),

('NDS-CDL-DFWP', 'Drug-Free Workplace Training',
 'Employee awareness training covering drug-free workplace policies for CDL drivers and transportation workers.',
 1.0, 'prod_TtmCUg8PrKOBtq',
 'https://mydrugtesttraining.com/course/drug-free-workplace',
 'Certificate of Completion')

ON CONFLICT (course_code) DO UPDATE SET
  course_name = EXCLUDED.course_name,
  description = EXCLUDED.description,
  stripe_product_id = EXCLUDED.stripe_product_id,
  external_course_url = EXCLUDED.external_course_url;

-- Grant permissions
GRANT SELECT ON nds_cdl_included_courses TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ NDS Training Courses migration complete!';
  RAISE NOTICE '📊 24 paid courses + 5 CDL-included courses';
  RAISE NOTICE '💰 Paid courses: 50/50 revenue share (2x NDS wholesale cost)';
  RAISE NOTICE '🚛 CDL-included courses: Free with CDL program enrollment';
END $$;
