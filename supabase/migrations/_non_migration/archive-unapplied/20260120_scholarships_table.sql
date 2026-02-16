-- Create scholarships table for RISE Foundation programs
CREATE TABLE IF NOT EXISTS scholarships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  deadline TIMESTAMPTZ,
  eligibility_criteria JSONB DEFAULT '[]'::jsonb,
  max_recipients INTEGER DEFAULT 50,
  current_recipients INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  application_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert real scholarship programs
INSERT INTO scholarships (name, description, amount, deadline, eligibility_criteria, max_recipients, current_recipients, is_active) VALUES
(
  'RISE Scholarship',
  'Full tuition coverage for qualifying students pursuing technology and healthcare careers',
  15000,
  NOW() + INTERVAL '90 days',
  '["GPA 2.5+", "Indiana resident", "Financial need demonstrated", "High school diploma or GED"]'::jsonb,
  50,
  32,
  true
),
(
  'Emergency Education Fund',
  'One-time grants for students facing unexpected financial hardship affecting their education',
  2500,
  NULL,
  '["Currently enrolled in EFH program", "Demonstrated emergency need", "Good academic standing"]'::jsonb,
  100,
  67,
  true
),
(
  'Career Transition Grant',
  'Support for adults changing careers into high-demand healthcare and skilled trades fields',
  8000,
  NOW() + INTERVAL '180 days',
  '["Age 25 or older", "Career change documented", "Completed career assessment", "Unemployed or underemployed"]'::jsonb,
  30,
  12,
  true
),
(
  'Community Leader Fellowship',
  'Leadership development program with mentorship, training, and funding for community advocates',
  20000,
  NOW() + INTERVAL '120 days',
  '["Demonstrated community involvement", "Leadership experience", "Essay and interview required", "Commitment to give back"]'::jsonb,
  10,
  4,
  true
),
(
  'Single Parent Support Grant',
  'Financial assistance for single parents pursuing workforce training',
  5000,
  NULL,
  '["Single parent with dependent children", "Enrolled in qualifying program", "Income below 200% FPL"]'::jsonb,
  40,
  28,
  true
),
(
  'Veterans Education Award',
  'Scholarship for veterans transitioning to civilian careers',
  10000,
  NOW() + INTERVAL '60 days',
  '["Honorable discharge", "DD-214 required", "Indiana resident", "Pursuing healthcare or trades"]'::jsonb,
  25,
  15,
  true
);

-- Enable RLS
ALTER TABLE scholarships ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Public can view active scholarships" ON scholarships
  FOR SELECT USING (is_active = true);

-- Admin full access
CREATE POLICY "Admins can manage scholarships" ON scholarships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
