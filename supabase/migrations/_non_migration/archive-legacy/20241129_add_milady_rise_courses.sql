-- ============================================================================
-- MILADY RISE CERTIFICATIONS
-- Add complete course catalog for Milady RISE integration
-- ============================================================================

-- Update Milady RISE provider with complete information
UPDATE partner_lms_providers
SET 
  enrollment_url = 'https://www.miladytraining.com',
  promo_code = 'efhcti-rise295',
  contact_phone = '866-848-5143',
  sso_url = 'https://www.miladytraining.com/users/sign_in',
  is_active = true,
  metadata = jsonb_build_object(
    'support_url', 'https://www.milady.com/support',
    'support_phone', '866-848-5143',
    'support_hours', 'Mon-Fri, 8am-6pm EST',
    'platform', 'Thinkific',
    'login_url', 'https://www.miladytraining.com/users/sign_in',
    'certifications', jsonb_build_array(
      jsonb_build_object(
        'id', 'milady-rise-client-wellbeing',
        'name', 'RISE Certification in Client Well-Being & Safety',
        'duration_hours', 3.5,
        'price', 29.95,
        'url', 'https://www.miladytraining.com/bundles/client-well-being-safety-certification',
        'topics', jsonb_build_array(
          'Human Trafficking Awareness',
          'Domestic Abuse Awareness',
          'Practical Infection Control'
        ),
        'description', 'Protect clients, give voice to the vulnerable, and make positive community impact.'
      ),
      jsonb_build_object(
        'id', 'milady-rise-finance',
        'name', 'RISE Certification in Finance Fundamentals',
        'duration_hours', 4,
        'price', 99.95,
        'url', 'https://www.miladytraining.com/bundles/rise-certification-finance-fundamentals',
        'topics', jsonb_build_array(
          'Profit & Loss 101',
          'Understanding Your Cash Flow',
          'Three Ways to Increase Top Line Sales',
          'How to Raise Prices'
        ),
        'description', 'Learn to increase bottom line and have a truly profitable business.'
      ),
      jsonb_build_object(
        'id', 'milady-rise-educator',
        'name', 'RISE Educator Program',
        'duration_hours', 180,
        'duration_months', 6,
        'price', 599.99,
        'url', 'https://www.miladytraining.com/courses/rise-educator-program',
        'format', 'Instructor-led blended (self-paced + live Q&A)',
        'description', 'Prepare for success in teaching in a classroom and become a confident educator.',
        'note', 'This program does NOT lead to a state license.'
      )
    )
  )
WHERE provider_type = 'milady';

-- Create individual course records for easier querying
CREATE TABLE IF NOT EXISTS partner_lms_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES partner_lms_providers(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  course_name TEXT NOT NULL,
  duration_hours DECIMAL(5,2),
  duration_months INTEGER,
  price DECIMAL(10,2),
  course_url TEXT,
  description TEXT,
  topics TEXT[],
  format TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider_id, course_id)
);

CREATE INDEX IF NOT EXISTS idx_partner_lms_courses_provider ON partner_lms_courses(provider_id);
CREATE INDEX IF NOT EXISTS idx_partner_lms_courses_active ON partner_lms_courses(is_active);

-- Insert Milady RISE courses
INSERT INTO partner_lms_courses (
  provider_id,
  course_id,
  course_name,
  duration_hours,
  price,
  course_url,
  description,
  topics
)
SELECT 
  id,
  'milady-rise-client-wellbeing',
  'RISE Certification in Client Well-Being & Safety',
  3.5,
  29.95,
  'https://www.miladytraining.com/bundles/client-well-being-safety-certification',
  'Protect clients, give voice to the vulnerable, and make positive community impact.',
  ARRAY[
    'Human Trafficking Awareness',
    'Domestic Abuse Awareness',
    'Practical Infection Control'
  ]
FROM partner_lms_providers
WHERE provider_type = 'milady'
ON CONFLICT (provider_id, course_id) DO UPDATE
SET 
  course_name = EXCLUDED.course_name,
  duration_hours = EXCLUDED.duration_hours,
  price = EXCLUDED.price,
  course_url = EXCLUDED.course_url,
  description = EXCLUDED.description,
  topics = EXCLUDED.topics,
  updated_at = NOW();

INSERT INTO partner_lms_courses (
  provider_id,
  course_id,
  course_name,
  duration_hours,
  price,
  course_url,
  description,
  topics
)
SELECT 
  id,
  'milady-rise-finance',
  'RISE Certification in Finance Fundamentals',
  4,
  99.95,
  'https://www.miladytraining.com/bundles/rise-certification-finance-fundamentals',
  'Learn to increase bottom line and have a truly profitable business.',
  ARRAY[
    'Profit & Loss 101',
    'Understanding Your Cash Flow',
    'Three Ways to Increase Top Line Sales',
    'How to Raise Prices'
  ]
FROM partner_lms_providers
WHERE provider_type = 'milady'
ON CONFLICT (provider_id, course_id) DO UPDATE
SET 
  course_name = EXCLUDED.course_name,
  duration_hours = EXCLUDED.duration_hours,
  price = EXCLUDED.price,
  course_url = EXCLUDED.course_url,
  description = EXCLUDED.description,
  topics = EXCLUDED.topics,
  updated_at = NOW();

INSERT INTO partner_lms_courses (
  provider_id,
  course_id,
  course_name,
  duration_hours,
  duration_months,
  price,
  course_url,
  description,
  format,
  notes
)
SELECT 
  id,
  'milady-rise-educator',
  'RISE Educator Program',
  180,
  6,
  599.99,
  'https://www.miladytraining.com/courses/rise-educator-program',
  'Prepare for success in teaching in a classroom and become a confident educator.',
  'Instructor-led blended (self-paced + live Q&A)',
  'This program does NOT lead to a state license.'
FROM partner_lms_providers
WHERE provider_type = 'milady'
ON CONFLICT (provider_id, course_id) DO UPDATE
SET 
  course_name = EXCLUDED.course_name,
  duration_hours = EXCLUDED.duration_hours,
  duration_months = EXCLUDED.duration_months,
  price = EXCLUDED.price,
  course_url = EXCLUDED.course_url,
  description = EXCLUDED.description,
  format = EXCLUDED.format,
  notes = EXCLUDED.notes,
  updated_at = NOW();

-- Add course_name to enrollments table if not exists
ALTER TABLE partner_lms_enrollments
ADD COLUMN IF NOT EXISTS course_name TEXT,
ADD COLUMN IF NOT EXISTS course_id TEXT;

-- Create view for easy course lookup
CREATE OR REPLACE VIEW partner_courses_view AS
SELECT 
  p.id as provider_id,
  p.provider_name,
  p.provider_type,
  c.id as course_id,
  c.course_name,
  c.duration_hours,
  c.duration_months,
  c.price,
  c.course_url,
  c.description,
  c.topics,
  c.format,
  c.notes,
  c.is_active
FROM partner_lms_providers p
LEFT JOIN partner_lms_courses c ON p.id = c.provider_id
WHERE p.is_active = true AND (c.is_active = true OR c.is_active IS NULL);

-- Grant permissions
GRANT SELECT ON partner_lms_courses TO authenticated;
GRANT SELECT ON partner_courses_view TO authenticated;

-- Add helpful comment
COMMENT ON TABLE partner_lms_courses IS 'Individual courses offered by external LMS partners';
COMMENT ON VIEW partner_courses_view IS 'Easy lookup view for partner courses with provider details';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Milady RISE courses added successfully!';
  RAISE NOTICE '   - Client Well-Being & Safety (3.5 hrs) - $29.95';
  RAISE NOTICE '   - Finance Fundamentals (4 hrs) - $99.95';
  RAISE NOTICE '   - RISE Educator Program (6 months) - $599.99';
  RAISE NOTICE '';
  RAISE NOTICE '📞 Contact Jessica Boyd for:';
  RAISE NOTICE '   - Promo code discount amount';
  RAISE NOTICE '   - Bulk purchase pricing';
  RAISE NOTICE '   - Partnership agreement details';
END $$;
