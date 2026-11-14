CREATE TABLE IF NOT EXISTS scholarships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  amount DECIMAL(10,2),
  deadline DATE,
  eligibility_criteria TEXT[],
  max_recipients INTEGER,
  current_recipients INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed scholarships
INSERT INTO scholarships (id, name, description, amount, deadline, eligibility_criteria, max_recipients, current_recipients, is_active) VALUES
  (gen_random_uuid(), 'RISE Healthcare Scholarship', 'Full tuition scholarship for CNA, Medical Assistant, or Phlebotomy training programs. Covers all program costs including books and certification fees.', 5000, '2026-03-31', ARRAY['Indiana resident', 'High school diploma or GED', 'Demonstrated financial need', 'Interest in healthcare career'], 20, 8, true),
  (gen_random_uuid(), 'Skilled Trades Grant', 'Funding for HVAC, Electrical, Plumbing, or Welding training. Includes tool kit and safety equipment.', 4500, '2026-04-15', ARRAY['Indiana resident', '18 years or older', 'Valid drivers license', 'Pass background check'], 15, 5, true),
  (gen_random_uuid(), 'Technology Career Fund', 'Support for IT Support and Cybersecurity certification programs. Covers training, exam fees, and study materials.', 3500, '2026-05-01', ARRAY['Indiana resident', 'Basic computer skills', 'High school diploma or GED'], 25, 12, true),
  (gen_random_uuid(), 'Second Chance Scholarship', 'Dedicated funding for justice-involved individuals seeking career training and a fresh start.', 5000, NULL, ARRAY['Indiana resident', 'Completed sentence or on supervised release', 'Commitment to program completion'], 30, 18, true),
  (gen_random_uuid(), 'Single Parent Support Grant', 'Additional support for single parents including childcare assistance and flexible scheduling accommodations.', 2500, '2026-06-01', ARRAY['Single parent household', 'Indiana resident', 'Enrolled in any Elevate program'], 40, 22, true),
  (gen_random_uuid(), 'Veterans Career Transition', 'Supplemental funding for veterans transitioning to civilian careers. Stackable with GI Bill benefits.', 3000, NULL, ARRAY['Honorable discharge', 'Indiana resident', 'DD-214 documentation'], 50, 15, true)
ON CONFLICT DO NOTHING;
