-- Seed mentors (requires profiles to exist first)
-- This creates mentor records linked to existing staff profiles or creates placeholder mentors

-- First ensure we have the mentors table structure
CREATE TABLE IF NOT EXISTS mentors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  bio TEXT,
  expertise TEXT,
  availability TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample mentors with placeholder data
INSERT INTO mentors (id, bio, expertise, availability, is_active) VALUES
  (gen_random_uuid(), 'Healthcare professional with 15+ years of experience in nursing and patient care. Passionate about helping new CNAs succeed in their careers.', 'Healthcare - CNA, Patient Care', 'Weekday evenings', true),
  (gen_random_uuid(), 'Licensed HVAC technician and business owner. Specializes in commercial refrigeration and mentoring new technicians.', 'HVAC, Refrigeration, Business', 'Flexible schedule', true),
  (gen_random_uuid(), 'IT professional with expertise in cybersecurity and network administration. Helps students prepare for CompTIA certifications.', 'IT Support, Cybersecurity, Networking', 'Weekends', true),
  (gen_random_uuid(), 'Master electrician with 20 years in residential and commercial electrical work. Guides apprentices through licensing requirements.', 'Electrical, Code Compliance', 'Tuesday/Thursday evenings', true),
  (gen_random_uuid(), 'Licensed barber and shop owner. Mentors apprentices on building clientele and business management.', 'Barbering, Business Management', 'Monday/Wednesday afternoons', true),
  (gen_random_uuid(), 'Tax professional and enrolled agent. Helps students navigate tax preparation careers and IRS certifications.', 'Tax Preparation, Accounting', 'Tax season availability varies', true)
ON CONFLICT DO NOTHING;
