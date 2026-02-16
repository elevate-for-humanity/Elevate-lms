-- Add NRF Foundation RISE Up Courses to LMS
-- Elevate for Humanity is an approved NRF RISE Up organization
-- These courses are accessed through Kaleido Learning platform

-- ============================================
-- NRF RISE UP: CUSTOMER SERVICE EXCELLENCE
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'nrf-customer-service-excellence',
  'NRF RISE Up: Customer Service Excellence',
  'Retail industry-recognized customer service credential',
  'Master customer engagement, problem resolution, communication skills, and service recovery. This NRF Foundation RISE Up course provides foundational employability skills recognized by 100+ major retailers nationwide.',
  'beginner',
  12,
  'published',
  true,
  jsonb_build_object(
    'provider', 'NRF Foundation / Kaleido Learning',
    'funding', ARRAY['WIOA', 'WRG'],
    'external_course', true,
    'external_url', 'https://riseup.kaleidolearning.com',
    'platform', 'Kaleido Learning',
    'format', '100% Online - Self-paced',
    'credentials', ARRAY['NRF RISE Up - Customer Service Excellence'],
    'industry_recognized', true,
    'accepted_by', '100+ major retailers including Walmart, Target, Macy''s, Home Depot, Best Buy',
    'nrf_rise_up', true
  )
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================
-- NRF RISE UP: RETAIL OPERATIONS
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'nrf-retail-operations',
  'NRF RISE Up: Retail Operations',
  'Store operations and inventory management skills',
  'Learn store operations, inventory management, point of sale systems, and loss prevention basics. This NRF Foundation RISE Up course prepares you for retail operations roles.',
  'beginner',
  12,
  'published',
  true,
  jsonb_build_object(
    'provider', 'NRF Foundation / Kaleido Learning',
    'funding', ARRAY['WIOA', 'WRG'],
    'external_course', true,
    'external_url', 'https://riseup.kaleidolearning.com',
    'platform', 'Kaleido Learning',
    'format', '100% Online - Self-paced',
    'credentials', ARRAY['NRF RISE Up - Retail Operations'],
    'industry_recognized', true,
    'nrf_rise_up', true
  )
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================
-- NRF RISE UP: PROFESSIONAL SKILLS
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'nrf-professional-skills',
  'NRF RISE Up: Professional Skills',
  'Workplace professionalism and teamwork',
  'Develop workplace professionalism, time management, teamwork and collaboration, and strong work ethic. This NRF Foundation RISE Up course builds essential professional skills.',
  'beginner',
  12,
  'published',
  true,
  jsonb_build_object(
    'provider', 'NRF Foundation / Kaleido Learning',
    'funding', ARRAY['WIOA', 'WRG'],
    'external_course', true,
    'external_url', 'https://riseup.kaleidolearning.com',
    'platform', 'Kaleido Learning',
    'format', '100% Online - Self-paced',
    'credentials', ARRAY['NRF RISE Up - Professional Skills'],
    'industry_recognized', true,
    'nrf_rise_up', true
  )
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================
-- NRF RISE UP: SALES & PRODUCT KNOWLEDGE
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'nrf-sales-product-knowledge',
  'NRF RISE Up: Sales & Product Knowledge',
  'Sales techniques and customer needs assessment',
  'Master sales techniques, product knowledge, upselling and cross-selling, and customer needs assessment. This NRF Foundation RISE Up course prepares you for sales roles.',
  'beginner',
  12,
  'published',
  true,
  jsonb_build_object(
    'provider', 'NRF Foundation / Kaleido Learning',
    'funding', ARRAY['WIOA', 'WRG'],
    'external_course', true,
    'external_url', 'https://riseup.kaleidolearning.com',
    'platform', 'Kaleido Learning',
    'format', '100% Online - Self-paced',
    'credentials', ARRAY['NRF RISE Up - Sales & Product Knowledge'],
    'industry_recognized', true,
    'nrf_rise_up', true
  )
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================
-- NRF RISE UP: DIGITAL RETAIL SKILLS
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'nrf-digital-retail-skills',
  'NRF RISE Up: Digital Retail Skills',
  'E-commerce and omnichannel retail',
  'Learn e-commerce basics, omnichannel retail, social media for retail, and digital customer service. This NRF Foundation RISE Up course prepares you for modern retail careers.',
  'beginner',
  12,
  'published',
  true,
  jsonb_build_object(
    'provider', 'NRF Foundation / Kaleido Learning',
    'funding', ARRAY['WIOA', 'WRG'],
    'external_course', true,
    'external_url', 'https://riseup.kaleidolearning.com',
    'platform', 'Kaleido Learning',
    'format', '100% Online - Self-paced',
    'credentials', ARRAY['NRF RISE Up - Digital Retail Skills'],
    'industry_recognized', true,
    'nrf_rise_up', true
  )
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- ============================================
-- NRF RISE UP: COMPLETE SERIES
-- ============================================

INSERT INTO courses (
  slug, title, subtitle, description, level, duration_hours,
  status, is_free, metadata
) VALUES (
  'nrf-rise-up-complete',
  'NRF Foundation RISE Up Complete Series',
  'Earn all 5 NRF RISE Up credentials',
  'Complete all five NRF Foundation RISE Up courses to earn comprehensive retail industry credentials. This program provides foundational employability skills recognized by 100+ major retailers nationwide including Walmart, Target, Macy''s, Home Depot, and Best Buy. Credentials are accepted for retail careers and beyond.',
  'beginner',
  60,
  'published',
  true,
  jsonb_build_object(
    'provider', 'NRF Foundation / Kaleido Learning',
    'funding', ARRAY['WIOA', 'WRG'],
    'external_course', true,
    'external_url', 'https://riseup.kaleidolearning.com',
    'platform', 'Kaleido Learning',
    'format', '100% Online - Self-paced',
    'total_courses', 5,
    'credentials', ARRAY[
      'NRF RISE Up - Customer Service Excellence',
      'NRF RISE Up - Retail Operations',
      'NRF RISE Up - Professional Skills',
      'NRF RISE Up - Sales & Product Knowledge',
      'NRF RISE Up - Digital Retail Skills',
      'NRF Foundation RISE Up Certificate'
    ],
    'industry_recognized', true,
    'accepted_by', '100+ major retailers',
    'nrf_rise_up', true,
    'organization', 'Elevate for Humanity Career and Training Center'
  )
) ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  metadata = EXCLUDED.metadata,
  updated_at = NOW();

-- Add modules for NRF RISE Up Complete Series
WITH course_ref AS (
  SELECT id FROM courses WHERE slug = 'nrf-rise-up-complete'
)
INSERT INTO modules (course_id, title, description, order_index, is_published)
SELECT 
  course_ref.id,
  module_data.title,
  module_data.description,
  module_data.order_index,
  true
FROM course_ref,
(VALUES
  (1, 'Getting Started with NRF RISE Up', 'Access Kaleido Learning platform and set up your account'),
  (2, 'Customer Service Excellence', 'Complete Customer Service Excellence course'),
  (3, 'Retail Operations', 'Complete Retail Operations course'),
  (4, 'Professional Skills', 'Complete Professional Skills course'),
  (5, 'Sales & Product Knowledge', 'Complete Sales & Product Knowledge course'),
  (6, 'Digital Retail Skills', 'Complete Digital Retail Skills course'),
  (7, 'Earn Your NRF RISE Up Certificate', 'Complete all 5 courses to receive your NRF Foundation RISE Up Certificate')
) AS module_data(order_index, title, description)
ON CONFLICT (course_id, order_index) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Added 6 NRF Foundation RISE Up courses to LMS';
  RAISE NOTICE '📚 5 individual courses + 1 complete series';
  RAISE NOTICE '🏪 Recognized by 100+ major retailers';
  RAISE NOTICE '🔗 Platform: https://riseup.kaleidolearning.com';
  RAISE NOTICE '🎓 Organization: Elevate for Humanity Career and Training Center';
END $$;
