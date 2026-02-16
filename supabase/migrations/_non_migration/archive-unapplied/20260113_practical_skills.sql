-- Practical Skills Verification System
-- Tracks hands-on competencies for apprenticeship programs

-- Skill categories and individual skills
CREATE TABLE IF NOT EXISTS practical_skill_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  display_order INT DEFAULT 0,
  required_for_completion BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS practical_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES practical_skill_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  display_order INT DEFAULT 0,
  min_demonstrations INT DEFAULT 3, -- How many times must be demonstrated
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student skill progress
CREATE TABLE IF NOT EXISTS student_skill_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES practical_skills(id) ON DELETE CASCADE,
  demonstrations_count INT DEFAULT 0,
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'demonstrated', 'verified')),
  first_demonstrated_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, skill_id)
);

-- Skill demonstration log (each time student demonstrates a skill)
CREATE TABLE IF NOT EXISTS skill_demonstrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES practical_skills(id) ON DELETE CASCADE,
  demonstrated_at TIMESTAMPTZ DEFAULT NOW(),
  observed_by UUID REFERENCES auth.users(id), -- Mentor/supervisor
  observer_name TEXT, -- If observer doesn't have account
  rating INT CHECK (rating >= 1 AND rating <= 5), -- 1-5 rating
  notes TEXT,
  photo_url TEXT, -- Optional photo evidence
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_skill_progress_student ON student_skill_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_skill_progress_skill ON student_skill_progress(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_demos_student ON skill_demonstrations(student_id);

-- RLS
ALTER TABLE practical_skill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE practical_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_skill_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_demonstrations ENABLE ROW LEVEL SECURITY;

-- Everyone can view skill definitions
CREATE POLICY "Anyone can view skill categories" ON practical_skill_categories FOR SELECT USING (true);
CREATE POLICY "Anyone can view skills" ON practical_skills FOR SELECT USING (true);

-- Students can view their own progress
CREATE POLICY "Students view own skill progress" ON student_skill_progress FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students view own demonstrations" ON skill_demonstrations FOR SELECT USING (auth.uid() = student_id);

-- Mentors/admins can manage
CREATE POLICY "Admins manage skill progress" ON student_skill_progress FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'mentor', 'instructor'))
);
CREATE POLICY "Admins manage demonstrations" ON skill_demonstrations FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'mentor', 'instructor'))
);

-- Insert Barber Apprenticeship Skills
INSERT INTO practical_skill_categories (program_slug, name, description, display_order, required_for_completion) VALUES
('barber-apprenticeship', 'Haircutting Fundamentals', 'Basic cutting techniques and tools', 1, true),
('barber-apprenticeship', 'Clipper Techniques', 'Clipper cuts, fades, and blending', 2, true),
('barber-apprenticeship', 'Shaving & Facial Hair', 'Razor shaves and beard work', 3, true),
('barber-apprenticeship', 'Sanitation & Safety', 'Health, safety, and infection control', 4, true),
('barber-apprenticeship', 'Client Services', 'Consultation and customer service', 5, true),
('barber-apprenticeship', 'Business Operations', 'Shop operations and professionalism', 6, false)
ON CONFLICT DO NOTHING;

-- Get category IDs and insert skills
DO $$
DECLARE
  cat_haircutting UUID;
  cat_clipper UUID;
  cat_shaving UUID;
  cat_sanitation UUID;
  cat_client UUID;
  cat_business UUID;
BEGIN
  SELECT id INTO cat_haircutting FROM practical_skill_categories WHERE program_slug = 'barber-apprenticeship' AND name = 'Haircutting Fundamentals';
  SELECT id INTO cat_clipper FROM practical_skill_categories WHERE program_slug = 'barber-apprenticeship' AND name = 'Clipper Techniques';
  SELECT id INTO cat_shaving FROM practical_skill_categories WHERE program_slug = 'barber-apprenticeship' AND name = 'Shaving & Facial Hair';
  SELECT id INTO cat_sanitation FROM practical_skill_categories WHERE program_slug = 'barber-apprenticeship' AND name = 'Sanitation & Safety';
  SELECT id INTO cat_client FROM practical_skill_categories WHERE program_slug = 'barber-apprenticeship' AND name = 'Client Services';
  SELECT id INTO cat_business FROM practical_skill_categories WHERE program_slug = 'barber-apprenticeship' AND name = 'Business Operations';

  -- Haircutting Fundamentals
  INSERT INTO practical_skills (category_id, name, description, display_order, min_demonstrations) VALUES
  (cat_haircutting, 'Scissor Over Comb', 'Basic scissor over comb technique', 1, 5),
  (cat_haircutting, 'Taper Cut', 'Traditional taper haircut', 2, 5),
  (cat_haircutting, 'Layered Cut', 'Layered haircut technique', 3, 3),
  (cat_haircutting, 'Texturizing', 'Texturizing and thinning techniques', 4, 3),
  (cat_haircutting, 'Shear Handling', 'Proper shear grip and control', 5, 5)
  ON CONFLICT DO NOTHING;

  -- Clipper Techniques
  INSERT INTO practical_skills (category_id, name, description, display_order, min_demonstrations) VALUES
  (cat_clipper, 'Clipper Over Comb', 'Clipper over comb blending', 1, 5),
  (cat_clipper, 'Low Fade', 'Low fade technique', 2, 10),
  (cat_clipper, 'Mid Fade', 'Mid fade technique', 3, 10),
  (cat_clipper, 'High Fade', 'High fade technique', 4, 10),
  (cat_clipper, 'Skin Fade', 'Bald/skin fade technique', 5, 10),
  (cat_clipper, 'Taper Fade', 'Taper fade blending', 6, 10),
  (cat_clipper, 'Lineup/Edge Up', 'Hairline and edge cleanup', 7, 15),
  (cat_clipper, 'Buzz Cut', 'Even length buzz cut', 8, 5),
  (cat_clipper, 'Clipper Maintenance', 'Cleaning, oiling, blade adjustment', 9, 5)
  ON CONFLICT DO NOTHING;

  -- Shaving & Facial Hair
  INSERT INTO practical_skills (category_id, name, description, display_order, min_demonstrations) VALUES
  (cat_shaving, 'Hot Towel Preparation', 'Proper hot towel application', 1, 10),
  (cat_shaving, 'Straight Razor Shave', 'Full face straight razor shave', 2, 10),
  (cat_shaving, 'Beard Trim', 'Beard shaping and trimming', 3, 10),
  (cat_shaving, 'Beard Lineup', 'Beard edge and cheek line', 4, 10),
  (cat_shaving, 'Mustache Trim', 'Mustache shaping', 5, 5),
  (cat_shaving, 'Neck Shave', 'Neck and nape cleanup', 6, 15)
  ON CONFLICT DO NOTHING;

  -- Sanitation & Safety
  INSERT INTO practical_skills (category_id, name, description, display_order, min_demonstrations) VALUES
  (cat_sanitation, 'Tool Disinfection', 'Proper tool sanitization between clients', 1, 10),
  (cat_sanitation, 'Workstation Sanitation', 'Chair and station cleaning', 2, 10),
  (cat_sanitation, 'Blood Exposure Protocol', 'Handling cuts and blood exposure', 3, 3),
  (cat_sanitation, 'Chemical Safety', 'Safe handling of products', 4, 3),
  (cat_sanitation, 'State Board Standards', 'Indiana sanitation requirements', 5, 5)
  ON CONFLICT DO NOTHING;

  -- Client Services
  INSERT INTO practical_skills (category_id, name, description, display_order, min_demonstrations) VALUES
  (cat_client, 'Client Consultation', 'Understanding client needs and preferences', 1, 10),
  (cat_client, 'Style Recommendation', 'Suggesting appropriate styles', 2, 5),
  (cat_client, 'Draping & Preparation', 'Proper client draping', 3, 10),
  (cat_client, 'Aftercare Instructions', 'Product and maintenance advice', 4, 5),
  (cat_client, 'Handling Complaints', 'Professional complaint resolution', 5, 3)
  ON CONFLICT DO NOTHING;

  -- Business Operations
  INSERT INTO practical_skills (category_id, name, description, display_order, min_demonstrations) VALUES
  (cat_business, 'Appointment Scheduling', 'Managing appointments', 1, 5),
  (cat_business, 'Payment Processing', 'Handling transactions', 2, 5),
  (cat_business, 'Inventory Management', 'Product and supply tracking', 3, 3),
  (cat_business, 'Client Records', 'Maintaining client information', 4, 5),
  (cat_business, 'Shop Opening/Closing', 'Daily shop procedures', 5, 5)
  ON CONFLICT DO NOTHING;
END $$;

-- Insert Cosmetology Skills
INSERT INTO practical_skill_categories (program_slug, name, description, display_order, required_for_completion) VALUES
('cosmetology-apprenticeship', 'Hair Cutting', 'Cutting techniques for all hair types', 1, true),
('cosmetology-apprenticeship', 'Hair Coloring', 'Color application and correction', 2, true),
('cosmetology-apprenticeship', 'Hair Styling', 'Styling, updos, and finishing', 3, true),
('cosmetology-apprenticeship', 'Chemical Services', 'Perms, relaxers, and treatments', 4, true),
('cosmetology-apprenticeship', 'Skin Care Basics', 'Facials and skin analysis', 5, true),
('cosmetology-apprenticeship', 'Nail Care Basics', 'Manicures and pedicures', 6, true),
('cosmetology-apprenticeship', 'Sanitation & Safety', 'Health and safety protocols', 7, true)
ON CONFLICT DO NOTHING;

-- Insert Esthetician Skills
INSERT INTO practical_skill_categories (program_slug, name, description, display_order, required_for_completion) VALUES
('esthetician-apprenticeship', 'Skin Analysis', 'Skin type identification and assessment', 1, true),
('esthetician-apprenticeship', 'Facial Treatments', 'Basic and advanced facials', 2, true),
('esthetician-apprenticeship', 'Hair Removal', 'Waxing and other removal methods', 3, true),
('esthetician-apprenticeship', 'Makeup Application', 'Professional makeup techniques', 4, true),
('esthetician-apprenticeship', 'Sanitation & Safety', 'Health and safety protocols', 5, true)
ON CONFLICT DO NOTHING;

-- Insert Nail Technician Skills
INSERT INTO practical_skill_categories (program_slug, name, description, display_order, required_for_completion) VALUES
('nail-technician-apprenticeship', 'Manicure Services', 'Basic and spa manicures', 1, true),
('nail-technician-apprenticeship', 'Pedicure Services', 'Basic and spa pedicures', 2, true),
('nail-technician-apprenticeship', 'Nail Enhancements', 'Acrylics, gels, and tips', 3, true),
('nail-technician-apprenticeship', 'Nail Art', 'Decorative nail techniques', 4, true),
('nail-technician-apprenticeship', 'Sanitation & Safety', 'Health and safety protocols', 5, true)
ON CONFLICT DO NOTHING;
