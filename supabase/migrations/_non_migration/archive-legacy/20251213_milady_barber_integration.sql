-- Enable Milady RISE integration for Barber program
-- This migration:
-- 1. Inserts all Milady RISE courses for barbering
-- 2. Marks them as required for Barber program
-- 3. Creates function to auto-enroll students in RISE courses
-- 4. Sets up trigger for automatic enrollment

-- Get or create Milady provider
INSERT INTO partner_lms_providers (
  provider_type,
  provider_name,
  api_endpoint,
  contact_email,
  is_active,
  metadata
) VALUES (
  'milady',
  'Milady RISE',
  'https://api.miladytraining.com',
  'jessica.boyd@milady.com',
  true,
  jsonb_build_object(
    'promo_code', 'efhcti-rise295',
    'price_per_student', 295,
    'support_url', 'https://www.miladytraining.com/support'
  )
)
ON CONFLICT (provider_type) 
DO UPDATE SET
  contact_email = EXCLUDED.contact_email,
  metadata = EXCLUDED.metadata;

-- Insert all Milady RISE courses for Barber program
WITH milady_provider AS (
  SELECT id FROM partner_lms_providers WHERE provider_type = 'milady' LIMIT 1
)
INSERT INTO partner_lms_courses (
  provider_id,
  course_name,
  course_description,
  external_course_id,
  course_type,
  duration_hours,
  is_required,
  required_for_programs,
  enrollment_url,
  metadata
)
SELECT 
  mp.id,
  course_data.name,
  course_data.description,
  course_data.code,
  'certification',
  course_data.hours,
  true,
  ARRAY['barber-apprenticeship'],
  'https://www.miladytraining.com/courses/' || course_data.code,
  jsonb_build_object(
    'category', course_data.category,
    'level', course_data.level,
    'certification', true
  )
FROM milady_provider mp,
(VALUES
  -- Core Barbering Courses
  ('RISE-BARBER-FOUNDATIONS', 'Barbering Foundations', 'Introduction to professional barbering, tools, and techniques', 40, 'core', 'beginner'),
  ('RISE-BARBER-HAIRCUTTING', 'Advanced Haircutting Techniques', 'Master classic and modern haircutting methods', 60, 'technical', 'intermediate'),
  ('RISE-BARBER-SHAVING', 'Shaving & Facial Hair Design', 'Traditional shaving techniques and beard styling', 30, 'technical', 'intermediate'),
  ('RISE-BARBER-COLORING', 'Hair Coloring for Barbers', 'Color theory and application for men''s hair', 40, 'technical', 'intermediate'),
  ('RISE-BARBER-STYLING', 'Men''s Hair Styling', 'Product knowledge and styling techniques', 30, 'technical', 'beginner'),
  
  -- Client Services & Safety
  ('RISE-CLIENT-WELLBEING', 'Client Well-Being & Safety', 'Health, safety, and sanitation protocols', 20, 'safety', 'beginner'),
  ('RISE-CLIENT-CONSULTATION', 'Client Consultation Skills', 'Communication and consultation techniques', 15, 'business', 'beginner'),
  ('RISE-INFECTION-CONTROL', 'Infection Control & Sanitation', 'Proper sanitation and infection prevention', 20, 'safety', 'beginner'),
  
  -- Business & Professional Development
  ('RISE-BARBER-BUSINESS', 'Barbershop Business Management', 'Running a successful barbershop', 30, 'business', 'advanced'),
  ('RISE-PROFESSIONAL-ETHICS', 'Professional Ethics & Standards', 'Industry standards and professional conduct', 15, 'business', 'beginner'),
  ('RISE-CUSTOMER-SERVICE', 'Customer Service Excellence', 'Building client relationships and retention', 20, 'business', 'intermediate'),
  
  -- Specialized Skills
  ('RISE-TEXTURE-SERVICES', 'Texture Services & Chemical Treatments', 'Perms, relaxers, and chemical services', 35, 'technical', 'advanced'),
  ('RISE-SCALP-TREATMENTS', 'Scalp Care & Treatments', 'Scalp analysis and treatment services', 25, 'technical', 'intermediate'),
  ('RISE-MENS-GROOMING', 'Complete Men''s Grooming', 'Full-service grooming and spa treatments', 30, 'technical', 'intermediate'),
  
  -- State Board Preparation
  ('RISE-STATE-BOARD-PREP', 'State Board Exam Preparation', 'Comprehensive exam preparation and practice', 40, 'certification', 'advanced'),
  ('RISE-PRACTICAL-EXAM', 'Practical Skills Assessment', 'Hands-on skills evaluation and practice', 30, 'certification', 'advanced')
) AS course_data(code, name, description, hours, category, level)
ON CONFLICT (provider_id, external_course_id) 
DO UPDATE SET
  course_name = EXCLUDED.course_name,
  course_description = EXCLUDED.course_description,
  is_required = EXCLUDED.is_required,
  required_for_programs = EXCLUDED.required_for_programs;

-- Create function to trigger Milady auto-enrollment
CREATE OR REPLACE FUNCTION trigger_milady_auto_enrollment()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for Barber program enrollments
  IF NEW.status = 'active' THEN
    -- Get program slug
    DECLARE
      program_slug TEXT;
    BEGIN
      SELECT slug INTO program_slug
      FROM programs
      WHERE id = NEW.program_id;
      
      -- If it's the barber program, trigger auto-enrollment
      IF program_slug = 'barber-apprenticeship' THEN
        -- Call the API endpoint asynchronously (using pg_net if available)
        -- For now, we'll just log it and handle via application code
        RAISE NOTICE 'Barber enrollment detected for student %. Trigger Milady auto-enrollment.', NEW.student_id;
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on enrollments table
DROP TRIGGER IF EXISTS auto_enroll_milady_on_barber_enrollment ON enrollments;
CREATE TRIGGER auto_enroll_milady_on_barber_enrollment
  AFTER INSERT OR UPDATE ON enrollments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_milady_auto_enrollment();

-- Add helper view for student's required RISE courses
CREATE OR REPLACE VIEW student_required_rise_courses AS
SELECT 
  e.student_id,
  e.program_id,
  p.slug as program_slug,
  p.name as program_name,
  c.id as course_id,
  c.course_name,
  c.external_course_id,
  c.provider_id,
  COALESCE(pe.id IS NOT NULL, false) as is_enrolled,
  pe.status as enrollment_status,
  pe.progress_percentage,
  pe.id as enrollment_id
FROM enrollments e
JOIN programs p ON p.id = e.program_id
CROSS JOIN partner_lms_courses c
LEFT JOIN partner_lms_enrollments pe ON pe.student_id = e.student_id AND pe.course_id = c.id
WHERE e.status = 'active'
  AND c.is_required = true
  AND p.slug = ANY(c.required_for_programs);

-- Grant access to authenticated users
GRANT SELECT ON student_required_rise_courses TO authenticated;

COMMENT ON VIEW student_required_rise_courses IS 'Shows which RISE courses are required for each student based on their program enrollment';
