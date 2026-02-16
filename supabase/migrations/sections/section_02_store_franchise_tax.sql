-- ============================================
-- STORE GUIDE & E-COMMERCE ENHANCEMENT
-- Safe migration - only adds missing tables/columns
-- ============================================

-- ============================================
-- 1. SEARCH INDEX (for universal search)
-- ============================================
CREATE TABLE IF NOT EXISTS search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  href TEXT NOT NULL,
  category TEXT NOT NULL,
  audiences TEXT[] NOT NULL DEFAULT '{}',
  keywords TEXT[] NOT NULL DEFAULT '{}',
  image TEXT,
  price TEXT,
  badge TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_index_category ON search_index(category);
CREATE INDEX IF NOT EXISTS idx_search_index_active ON search_index(is_active);

-- ============================================
-- 2. STORE CARDS (landing page cards)
-- ============================================
CREATE TABLE IF NOT EXISTS store_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  description TEXT NOT NULL,
  href TEXT NOT NULL,
  image TEXT NOT NULL,
  icon TEXT NOT NULL,
  tour_id TEXT NOT NULL,
  tier TEXT NOT NULL,
  sort_order INTEGER NOT NULL,
  tour_description TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_store_cards_tier ON store_cards(tier);
CREATE INDEX IF NOT EXISTS idx_store_cards_active ON store_cards(is_active);

-- ============================================
-- 3. PAGE GUIDES (avatar guides per page)
-- ============================================
CREATE TABLE IF NOT EXISTS page_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id TEXT UNIQUE NOT NULL,
  page_name TEXT NOT NULL,
  avatar_name TEXT NOT NULL,
  avatar_image TEXT NOT NULL,
  quick_tips TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. GUIDE MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS guide_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id TEXT NOT NULL,
  message_id TEXT NOT NULL,
  message_type TEXT NOT NULL,
  message TEXT NOT NULL,
  action_label TEXT,
  action_href TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(page_id, message_id)
);

CREATE INDEX IF NOT EXISTS idx_guide_messages_page ON guide_messages(page_id);

-- ============================================
-- 5. PRODUCT RECOMMENDATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS product_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_product_id TEXT NOT NULL,
  target_product_id TEXT NOT NULL,
  recommendation_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  savings TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_product_id, target_product_id, recommendation_type)
);

CREATE INDEX IF NOT EXISTS idx_recommendations_source ON product_recommendations(source_product_id);

-- ============================================
-- 6. AVATAR SALES MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS avatar_sales_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id TEXT UNIQUE NOT NULL,
  intro TEXT NOT NULL,
  value_highlight TEXT NOT NULL,
  objection_handler TEXT NOT NULL,
  call_to_action TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. PRODUCT CATEGORIES
-- ============================================
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image TEXT,
  parent_id UUID,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 8. ENHANCE PRODUCTS TABLE (if exists)
-- ============================================
DO $$ 
BEGIN
  -- Add columns if they don't exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
    ALTER TABLE products ADD COLUMN IF NOT EXISTS audiences TEXT[] DEFAULT '{}';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
    ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS badge TEXT;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS inventory_quantity INTEGER DEFAULT 0;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS track_inventory BOOLEAN DEFAULT false;
    ALTER TABLE products ADD COLUMN IF NOT EXISTS requires_shipping BOOLEAN DEFAULT false;
  END IF;
END $$;

-- ============================================
-- 9. COUPONS
-- ============================================
CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL,
  discount_value DECIMAL(10,2) NOT NULL,
  minimum_order_amount DECIMAL(10,2),
  maximum_discount DECIMAL(10,2),
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. WISHLISTS
-- ============================================
CREATE TABLE IF NOT EXISTS wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================
-- 11. PRODUCT REVIEWS
-- ============================================
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL,
  user_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  content TEXT,
  is_verified_purchase BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);

-- ============================================
-- SEED DATA: SEARCH INDEX
-- ============================================
INSERT INTO search_index (item_id, title, description, href, category, audiences, keywords, image, price, badge, sort_order) VALUES
-- Programs
('barber-apprenticeship', 'Barber Apprenticeship Program', '2,000-hour state-approved apprenticeship with master barber instruction and job placement.', '/programs/barber-apprenticeship', 'program', ARRAY['students', 'everyone'], ARRAY['barber', 'barbering', 'hair', 'cutting', 'fades'], '/images/programs-hq/barber-hero.jpg', 'WIOA Funded', 'WIOA Eligible', 1),
('cna-training', 'CNA Training Program', '6-week certified nursing assistant training with clinical rotations.', '/programs/cna', 'program', ARRAY['students', 'everyone'], ARRAY['cna', 'nursing', 'healthcare', 'medical'], '/images/programs-hq/cna-training.jpg', 'WIOA Funded', 'WIOA Eligible', 2),
('hvac-training', 'HVAC Technician Training', '8-week HVAC certification with EPA 608 prep.', '/programs/hvac', 'program', ARRAY['students', 'everyone'], ARRAY['hvac', 'heating', 'cooling', 'technician'], '/images/programs-hq/hvac-technician.jpg', 'WIOA Funded', 'WIOA Eligible', 3),
('cdl-training', 'CDL Truck Driver Training', '4-week commercial driver license training.', '/programs/cdl', 'program', ARRAY['students', 'everyone'], ARRAY['cdl', 'truck', 'driver', 'trucking'], '/images/programs-hq/cdl-trucking.jpg', 'WIOA Funded', 'WIOA Eligible', 4),
-- Licenses
('school-license', 'School / Training Provider License', 'White-label platform with WIOA compliance and partner dashboard.', '/store/licenses/school-license', 'license', ARRAY['organizations'], ARRAY['school', 'training', 'provider', 'wioa', 'lms'], '/images/programs-hq/it-support.jpg', '$15,000', 'Most Popular', 10),
('core-license', 'Core Platform License', 'Essential LMS with course builder and enrollment.', '/store/licenses/core-license', 'license', ARRAY['organizations', 'developers'], ARRAY['lms', 'platform', 'core', 'starter'], '/images/programs-hq/technology-hero.jpg', '$4,999', NULL, 11),
('enterprise-license', 'Enterprise License', 'Multi-site deployment with custom integrations.', '/store/licenses/enterprise-license', 'license', ARRAY['organizations'], ARRAY['enterprise', 'multi-site', 'api'], '/images/team-hq/team-meeting.jpg', '$50,000', NULL, 12),
-- Tools
('wioa-toolkit', 'WIOA Compliance Toolkit', 'Automated WIOA tracking and PIRL exports.', '/store/compliance/wioa', 'tool', ARRAY['organizations'], ARRAY['wioa', 'compliance', 'pirl', 'reporting'], '/images/heroes-hq/funding-hero.jpg', '$1,999', NULL, 20),
('ai-tutor', 'AI Tutor License', '24/7 AI-powered tutoring for learners.', '/store/ai-studio', 'tool', ARRAY['organizations', 'students'], ARRAY['ai', 'tutor', 'chatbot', 'support'], '/images/programs-hq/technology-hero.jpg', '$999', 'New', 21),
-- Resources
('workbooks', 'Program Workbooks', 'Free downloadable workbooks for enrolled students.', '/workbooks', 'resource', ARRAY['students'], ARRAY['workbook', 'download', 'study', 'free'], '/images/programs-hq/business-office.jpg', 'Free', NULL, 30),
('marketplace', 'Course Marketplace', 'Expert-created courses in trades and healthcare.', '/marketplace', 'resource', ARRAY['students', 'everyone'], ARRAY['courses', 'marketplace', 'online', 'learning'], '/images/programs-hq/technology-hero.jpg', NULL, NULL, 31),
-- Dashboards
('student-dashboard', 'Student Dashboard', 'Access your courses and track progress.', '/lms/dashboard', 'dashboard', ARRAY['students'], ARRAY['dashboard', 'student', 'courses', 'progress'], NULL, NULL, NULL, 40),
('employer-portal', 'Employer Portal', 'Find trained candidates and post jobs.', '/employers', 'dashboard', ARRAY['employers'], ARRAY['employer', 'hiring', 'jobs', 'candidates'], NULL, NULL, NULL, 41),
-- Pages
('wioa-eligibility', 'WIOA Eligibility Check', 'See if you qualify for free workforce training.', '/wioa-eligibility', 'page', ARRAY['students', 'everyone'], ARRAY['wioa', 'eligibility', 'free', 'funding'], NULL, NULL, NULL, 50),
('demo', 'Platform Demo', 'Try the platform with a free demo.', '/demo', 'page', ARRAY['organizations', 'developers', 'everyone'], ARRAY['demo', 'trial', 'free', 'try'], NULL, NULL, NULL, 51)
ON CONFLICT (item_id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  href = EXCLUDED.href,
  category = EXCLUDED.category,
  audiences = EXCLUDED.audiences,
  keywords = EXCLUDED.keywords,
  image = EXCLUDED.image,
  price = EXCLUDED.price,
  badge = EXCLUDED.badge,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- ============================================
-- SEED DATA: STORE CARDS
-- ============================================
INSERT INTO store_cards (card_id, title, subtitle, description, href, image, icon, tour_id, tier, sort_order, tour_description) VALUES
('shop', 'Shop Gear', 'Tools, Equipment & Apparel', 'Professional tools, equipment, and study materials.', '/shop', '/images/programs-hq/hvac-technician.jpg', 'shopping-bag', 'store-card-shop', 'primary', 1, 'Shop for professional tools and equipment.'),
('marketplace', 'Courses Marketplace', 'Expert-Created Training', 'Discover courses from expert creators.', '/marketplace', '/images/programs-hq/technology-hero.jpg', 'graduation-cap', 'store-card-marketplace', 'primary', 2, 'Browse courses created by industry experts.'),
('workbooks', 'Workbooks & Downloads', 'Study Materials & Guides', 'Download workbooks and study guides.', '/workbooks', '/images/programs-hq/business-office.jpg', 'book-open', 'store-card-workbooks', 'primary', 3, 'Access free downloadable workbooks.'),
('licenses', 'Platform Licenses', 'LMS & Workforce Solutions', 'Full workforce platform with LMS and compliance.', '/store/licenses', '/images/programs-hq/it-support.jpg', 'server', 'store-card-licenses', 'primary', 4, 'License our complete workforce platform.'),
('pricing', 'Plans & Pricing', 'Subscriptions & Checkout', 'View pricing plans and subscriptions.', '/store/subscriptions', '/images/team-hq/team-meeting.jpg', 'credit-card', 'store-card-pricing', 'primary', 5, 'Compare pricing plans.'),
('compliance', 'Compliance Tools', 'WIOA, FERPA, WCAG', 'Compliance checklists and reporting tools.', '/store/compliance', '/images/heroes-hq/funding-hero.jpg', 'file-text', 'store-card-compliance', 'secondary', 6, 'Access compliance tools.'),
('ai-studio', 'AI & Automation', 'AI Tutor & Workflows', 'AI-powered tutoring and automation.', '/store/ai-studio', '/images/programs-hq/cybersecurity.jpg', 'settings', 'store-card-ai', 'secondary', 7, 'Explore AI-powered tools.'),
('programs', 'Training Programs', 'Career-Ready Training', 'Enroll in WIOA-eligible training programs.', '/programs', '/images/programs-hq/barber-hero.jpg', 'users', 'store-card-programs', 'secondary', 8, 'Browse career training programs.')
ON CONFLICT (card_id) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  description = EXCLUDED.description,
  href = EXCLUDED.href,
  image = EXCLUDED.image,
  icon = EXCLUDED.icon,
  tour_id = EXCLUDED.tour_id,
  tier = EXCLUDED.tier,
  sort_order = EXCLUDED.sort_order,
  tour_description = EXCLUDED.tour_description,
  updated_at = NOW();

-- ============================================
-- SEED DATA: PAGE GUIDES
-- ============================================
INSERT INTO page_guides (page_id, page_name, avatar_name, avatar_image, quick_tips) VALUES
('store-landing', 'Store', 'Maya', '/images/team-hq/instructor-1.jpg', ARRAY['Students: Check Workbooks for free materials', 'Training Providers: School License is most popular', 'Need compliance help? We have WIOA & FERPA tools']),
('licenses', 'Platform Licenses', 'Maya', '/images/team-hq/instructor-1.jpg', ARRAY['School License is most popular', 'All licenses include lifetime updates', 'WIOA compliance built into School & Enterprise']),
('student-dashboard', 'Student Dashboard', 'Maya', '/images/team-hq/instructor-1.jpg', ARRAY['Click any course to continue', 'Progress saves automatically', 'Download workbooks from Resources']),
('barber-apprenticeship', 'Barber Apprenticeship', 'Marcus', '/images/team-hq/instructor-3.jpg', ARRAY['2,000 hours hands-on training', 'State board exam prep included', 'WIOA funding available'])
ON CONFLICT (page_id) DO UPDATE SET
  page_name = EXCLUDED.page_name,
  avatar_name = EXCLUDED.avatar_name,
  avatar_image = EXCLUDED.avatar_image,
  quick_tips = EXCLUDED.quick_tips,
  updated_at = NOW();

-- ============================================
-- SEED DATA: GUIDE MESSAGES
-- ============================================
INSERT INTO guide_messages (page_id, message_id, message_type, message, action_label, action_href, sort_order) VALUES
('store-landing', 'welcome', 'welcome', 'Welcome to the Elevate Store! I''m Maya. Whether you''re a student needing supplies, or an organization wanting to run training programs - I''ll help you find what you need.', NULL, NULL, 1),
('store-landing', 'explain', 'explain', 'We have five main sections: Shop (tools & gear), Marketplace (courses), Workbooks (free study materials), Platform Licenses (run your own training program), and Compliance Tools.', NULL, NULL, 2),
('store-landing', 'tip', 'tip', 'Not sure where to start? Most training providers choose the School License - it''s a complete system to run WIOA-funded programs.', 'See School License', '/store/licenses/school-license', 3),
('licenses', 'welcome', 'welcome', 'These are our platform licenses - this is how schools and training providers run their programs using our technology.', NULL, NULL, 1),
('licenses', 'explain', 'explain', 'Core License ($4,999) is for getting started. School License ($15,000) is most popular - includes white-label and WIOA compliance. Enterprise ($50,000) is for multi-site organizations.', NULL, NULL, 2),
('licenses', 'roi', 'tip', 'The math: One WIOA-funded cohort of 10 students = $50,000+ revenue. The School License pays for itself with your first cohort.', 'Try Free Demo', '/demo', 3),
('student-dashboard', 'welcome', 'welcome', 'This is your student dashboard - your home base for everything. Let me show you around.', NULL, NULL, 1),
('student-dashboard', 'explain', 'explain', 'On the left, you''ll see your enrolled courses. In the center, your progress and upcoming assignments. On the right, announcements from instructors.', NULL, NULL, 2),
('student-dashboard', 'tip', 'tip', 'Pro tip: Check the Resources section for workbooks and study guides. They''re free to download.', 'Go to Resources', '/lms/resources', 3)
ON CONFLICT (page_id, message_id) DO UPDATE SET
  message_type = EXCLUDED.message_type,
  message = EXCLUDED.message,
  action_label = EXCLUDED.action_label,
  action_href = EXCLUDED.action_href,
  sort_order = EXCLUDED.sort_order;

-- ============================================
-- SEED DATA: RECOMMENDATIONS
-- ============================================
INSERT INTO product_recommendations (source_product_id, target_product_id, recommendation_type, reason, sort_order) VALUES
('core-license', 'school-license', 'upgrade', 'Upgrade to School License for white-label branding and WIOA compliance.', 1),
('core-license', 'wioa-toolkit', 'cross-sell', 'Add WIOA compliance to track participant outcomes.', 2),
('core-license', 'ai-tutor', 'cross-sell', 'Add AI Tutor for 24/7 learner support.', 3),
('school-license', 'enterprise-license', 'upgrade', 'Scale to multiple locations with Enterprise.', 1),
('school-license', 'ai-tutor', 'cross-sell', 'Enhance your platform with AI-powered tutoring.', 2),
('wioa-toolkit', 'school-license', 'upsell', 'School License includes WIOA compliance built-in, plus full LMS.', 1),
('ai-tutor', 'school-license', 'upsell', 'AI Tutor is included with School License.', 1)
ON CONFLICT (source_product_id, target_product_id, recommendation_type) DO UPDATE SET
  reason = EXCLUDED.reason,
  sort_order = EXCLUDED.sort_order;

-- ============================================
-- SEED DATA: AVATAR SALES MESSAGES
-- ============================================
INSERT INTO avatar_sales_messages (product_id, intro, value_highlight, objection_handler, call_to_action) VALUES
('core-license', 'The Core License is perfect if you''re just getting started.', 'You get a full LMS with course builder, student enrollment, and basic compliance tracking.', 'If you need white-label or WIOA compliance later, you can upgrade anytime.', 'Ready to launch your training platform?'),
('school-license', 'This is our most popular license - it''s what real training providers use.', 'You get white-label branding so it looks like YOUR platform, plus WIOA and FERPA compliance built in.', 'The $15,000 pays for itself fast - one WIOA-funded cohort of 10 students can bring in $50,000+ revenue.', 'Want me to show you how other training providers are using this?'),
('enterprise-license', 'Enterprise is for organizations running multiple training sites.', 'Unlimited locations, API access for your existing systems, and a dedicated account manager.', 'We''ll do the integration work and train your team on-site.', 'Let''s schedule a call to discuss your specific needs.'),
('wioa-toolkit', 'If you''re running WIOA-funded programs, this toolkit saves you serious time.', 'Automated PIRL exports, performance tracking, and quarterly reports. What used to take 40 hours now takes 10 minutes.', 'It''s $1,999 one-time - that''s less than one week of a compliance officer''s salary.', 'Want to see a demo of the PIRL export?'),
('ai-tutor', 'AI Tutor gives your students 24/7 support without burning out your instructors.', 'It answers questions, explains concepts, and tracks where students are struggling.', 'Students love it because they get help at 2am. Instructors love it because they''re not answering the same questions 50 times.', 'Try it yourself - ask it anything.')
ON CONFLICT (product_id) DO UPDATE SET
  intro = EXCLUDED.intro,
  value_highlight = EXCLUDED.value_highlight,
  objection_handler = EXCLUDED.objection_handler,
  call_to_action = EXCLUDED.call_to_action,
  updated_at = NOW();

-- ============================================
-- SEED DATA: CATEGORIES
-- ============================================
INSERT INTO product_categories (slug, name, description, sort_order) VALUES
('licenses', 'Platform Licenses', 'LMS and workforce platform licenses', 1),
('subscriptions', 'Subscriptions', 'Monthly infrastructure and services', 2),
('certifications', 'Certifications', 'Professional certification courses', 3),
('compliance', 'Compliance Tools', 'WIOA, FERPA, and grant reporting tools', 4),
('ai-tools', 'AI & Automation', 'AI tutoring and automation tools', 5),
('programs', 'Training Programs', 'Career training programs', 6),
('shop', 'Shop', 'Tools, equipment, and apparel', 7),
('digital', 'Digital Resources', 'Downloadable guides and templates', 8)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;

-- ============================================
-- SEED DATA: SAMPLE COUPON
-- ============================================
INSERT INTO coupons (code, description, discount_type, discount_value, minimum_order_amount, is_active) VALUES
('WELCOME10', 'Welcome discount - 10% off first order', 'percentage', 10, 100, true),
('FREESHIP', 'Free shipping on orders over $50', 'free_shipping', 0, 50, true)
ON CONFLICT (code) DO UPDATE SET
  description = EXCLUDED.description,
  discount_type = EXCLUDED.discount_type,
  discount_value = EXCLUDED.discount_value,
  minimum_order_amount = EXCLUDED.minimum_order_amount;

-- ============================================
-- ENABLE RLS
-- ============================================
ALTER TABLE search_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE guide_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_sales_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

-- Public read policies (drop and recreate to avoid conflicts)
DROP POLICY IF EXISTS "Public read search_index" ON search_index;
DROP POLICY IF EXISTS "Public read store_cards" ON store_cards;
DROP POLICY IF EXISTS "Public read page_guides" ON page_guides;
DROP POLICY IF EXISTS "Public read guide_messages" ON guide_messages;
DROP POLICY IF EXISTS "Public read recommendations" ON product_recommendations;
DROP POLICY IF EXISTS "Public read sales_messages" ON avatar_sales_messages;
DROP POLICY IF EXISTS "Public read categories" ON product_categories;
DROP POLICY IF EXISTS "Public read coupons" ON coupons;
DROP POLICY IF EXISTS "Public read reviews" ON product_reviews;

CREATE POLICY "Public read search_index" ON search_index FOR SELECT USING (is_active = true);
CREATE POLICY "Public read store_cards" ON store_cards FOR SELECT USING (is_active = true);
CREATE POLICY "Public read page_guides" ON page_guides FOR SELECT USING (is_active = true);
CREATE POLICY "Public read guide_messages" ON guide_messages FOR SELECT USING (is_active = true);
CREATE POLICY "Public read recommendations" ON product_recommendations FOR SELECT USING (is_active = true);
CREATE POLICY "Public read sales_messages" ON avatar_sales_messages FOR SELECT USING (is_active = true);
CREATE POLICY "Public read categories" ON product_categories FOR SELECT USING (is_active = true);
CREATE POLICY "Public read coupons" ON coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Public read reviews" ON product_reviews FOR SELECT USING (is_approved = true);

-- Done
SELECT 'Migration complete: Store guide and e-commerce tables created with seed data' as status;
-- Franchise Tax Preparation System
-- Database schema for multi-office tax preparation business

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- FRANCHISE OFFICES
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_offices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_code VARCHAR(20) UNIQUE NOT NULL,
  office_name VARCHAR(255) NOT NULL,
  
  -- Owner info
  owner_id UUID REFERENCES auth.users(id),
  owner_name VARCHAR(255) NOT NULL,
  owner_email VARCHAR(255) NOT NULL,
  owner_phone VARCHAR(20),
  
  -- Address
  address_street VARCHAR(255) NOT NULL,
  address_city VARCHAR(100) NOT NULL,
  address_state VARCHAR(2) NOT NULL,
  address_zip VARCHAR(10) NOT NULL,
  
  -- Business info
  business_ein VARCHAR(20),
  state_license VARCHAR(50),
  efin VARCHAR(6), -- Office's own EFIN if they have one
  parent_efin VARCHAR(6) NOT NULL, -- Franchise's master EFIN
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
  activated_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  
  -- Franchise terms
  franchise_fee DECIMAL(10,2) DEFAULT 0,
  per_return_fee DECIMAL(10,2) DEFAULT 5.00,
  revenue_share_percent DECIMAL(5,2) DEFAULT 0,
  contract_start_date DATE,
  contract_end_date DATE,
  
  -- Limits
  max_preparers INTEGER DEFAULT 10,
  max_returns_per_season INTEGER,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- ============================================
-- FRANCHISE PREPARERS
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_preparers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  office_id UUID NOT NULL REFERENCES franchise_offices(id) ON DELETE CASCADE,
  
  -- Personal info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  
  -- IRS credentials
  ptin VARCHAR(20) NOT NULL, -- P followed by 8 digits
  ptin_expiration DATE,
  
  -- Certifications
  certification_level VARCHAR(20) CHECK (certification_level IN ('basic', 'intermediate', 'advanced', 'supervisor')),
  certifications JSONB DEFAULT '[]',
  training_completed_at TIMESTAMPTZ,
  annual_refresher_due DATE,
  
  -- Authorizations
  is_efin_authorized BOOLEAN DEFAULT FALSE,
  is_ero_authorized BOOLEAN DEFAULT FALSE,
  signature_pin VARCHAR(10),
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'terminated')),
  activated_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  
  -- Performance metrics
  returns_filed INTEGER DEFAULT 0,
  returns_rejected INTEGER DEFAULT 0,
  average_refund DECIMAL(10,2),
  
  -- Compensation
  commission_type VARCHAR(20) DEFAULT 'per_return' CHECK (commission_type IN ('per_return', 'hourly', 'salary', 'commission')),
  per_return_fee DECIMAL(10,2),
  hourly_rate DECIMAL(10,2),
  commission_rate DECIMAL(5,2), -- Percentage
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT,
  
  UNIQUE(office_id, ptin)
);

-- ============================================
-- FRANCHISE CLIENTS
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id UUID NOT NULL REFERENCES franchise_offices(id) ON DELETE CASCADE,
  
  -- Personal info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  
  -- Address
  address_street VARCHAR(255),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  address_zip VARCHAR(10),
  
  -- Tax info
  filing_status VARCHAR(30),
  dependents_count INTEGER DEFAULT 0,
  
  -- SSN (encrypted)
  ssn_encrypted BYTEA,
  ssn_last_four VARCHAR(4),
  ssn_hash VARCHAR(64), -- For lookup without decryption
  
  -- Spouse info
  spouse_first_name VARCHAR(100),
  spouse_last_name VARCHAR(100),
  spouse_ssn_encrypted BYTEA,
  spouse_ssn_last_four VARCHAR(4),
  
  -- Preferences
  preferred_preparer_id UUID REFERENCES franchise_preparers(id),
  
  -- History
  client_since DATE DEFAULT CURRENT_DATE,
  returns_filed INTEGER DEFAULT 0,
  total_fees_paid DECIMAL(10,2) DEFAULT 0,
  last_return_date DATE,
  last_return_id UUID,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'do_not_serve')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- ============================================
-- ERO CONFIGURATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_ero_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id UUID NOT NULL REFERENCES franchise_offices(id) ON DELETE CASCADE,
  ero_preparer_id UUID NOT NULL REFERENCES franchise_preparers(id),
  
  -- ERO details
  efin VARCHAR(6) NOT NULL,
  firm_name VARCHAR(255) NOT NULL,
  firm_ein VARCHAR(20),
  firm_address JSONB NOT NULL,
  signature_pin VARCHAR(10) NOT NULL,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RETURN SUBMISSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_return_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id VARCHAR(50) UNIQUE NOT NULL,
  
  -- Relationships
  office_id UUID NOT NULL REFERENCES franchise_offices(id),
  preparer_id UUID NOT NULL REFERENCES franchise_preparers(id),
  client_id UUID REFERENCES franchise_clients(id),
  
  -- Preparer info snapshot
  preparer_ptin VARCHAR(20) NOT NULL,
  preparer_name VARCHAR(255),
  
  -- ERO info
  ero_id UUID REFERENCES franchise_preparers(id),
  ero_signature JSONB,
  ero_signed_at TIMESTAMPTZ,
  
  -- Return details
  tax_year INTEGER NOT NULL,
  efin VARCHAR(6) NOT NULL,
  return_type VARCHAR(20) DEFAULT 'IRS1040',
  filing_status VARCHAR(30),
  
  -- Return data (summary, not full return)
  return_data JSONB,
  taxpayer_ssn_hash VARCHAR(64),
  
  -- XML content
  xml_content TEXT,
  
  -- Fees
  client_fee DECIMAL(10,2) DEFAULT 0,
  franchise_fee DECIMAL(10,2) DEFAULT 0,
  preparer_commission DECIMAL(10,2) DEFAULT 0,
  office_revenue DECIMAL(10,2) DEFAULT 0,
  
  -- Status tracking
  status VARCHAR(30) DEFAULT 'draft' CHECK (status IN (
    'draft', 'pending_review', 'pending_ero', 'ready_to_submit',
    'submitted', 'accepted', 'rejected', 'error'
  )),
  
  -- IRS response
  irs_submission_id VARCHAR(50),
  irs_status VARCHAR(30),
  irs_status_date TIMESTAMPTZ,
  irs_errors JSONB,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  notes TEXT
);

-- ============================================
-- FEE SCHEDULES
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_fee_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id UUID NOT NULL REFERENCES franchise_offices(id) ON DELETE CASCADE,
  
  name VARCHAR(100) NOT NULL,
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Base fees
  base_fee_1040 DECIMAL(10,2) DEFAULT 150.00,
  base_fee_1040_ez DECIMAL(10,2) DEFAULT 75.00,
  
  -- Schedule fees
  fee_schedule_a DECIMAL(10,2) DEFAULT 50.00,
  fee_schedule_c DECIMAL(10,2) DEFAULT 100.00,
  fee_schedule_d DECIMAL(10,2) DEFAULT 50.00,
  fee_schedule_e DECIMAL(10,2) DEFAULT 75.00,
  fee_schedule_se DECIMAL(10,2) DEFAULT 25.00,
  
  -- Per-item fees
  fee_per_w2 DECIMAL(10,2) DEFAULT 0,
  fee_per_1099 DECIMAL(10,2) DEFAULT 15.00,
  fee_per_dependent DECIMAL(10,2) DEFAULT 25.00,
  
  -- State return
  fee_state_return DECIMAL(10,2) DEFAULT 50.00,
  
  -- Credits
  fee_eitc DECIMAL(10,2) DEFAULT 50.00,
  fee_ctc DECIMAL(10,2) DEFAULT 25.00,
  
  -- Bank products
  fee_refund_transfer DECIMAL(10,2) DEFAULT 35.00,
  fee_refund_advance DECIMAL(10,2) DEFAULT 0,
  
  -- Discounts
  returning_client_discount_percent DECIMAL(5,2) DEFAULT 10.00,
  referral_discount DECIMAL(10,2) DEFAULT 25.00,
  senior_discount_percent DECIMAL(5,2) DEFAULT 10.00,
  military_discount_percent DECIMAL(5,2) DEFAULT 15.00,
  
  -- Validity
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PREPARER PAYOUTS
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_preparer_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  preparer_id UUID NOT NULL REFERENCES franchise_preparers(id),
  office_id UUID NOT NULL REFERENCES franchise_offices(id),
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Earnings
  returns_count INTEGER DEFAULT 0,
  gross_earnings DECIMAL(10,2) DEFAULT 0,
  deductions DECIMAL(10,2) DEFAULT 0,
  net_earnings DECIMAL(10,2) DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'disputed')),
  
  -- Payment info
  paid_at TIMESTAMPTZ,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(100),
  
  -- Approval
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- ============================================
-- FRANCHISE ROYALTIES
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_royalties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  office_id UUID NOT NULL REFERENCES franchise_offices(id),
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Amounts
  returns_count INTEGER DEFAULT 0,
  gross_revenue DECIMAL(10,2) DEFAULT 0,
  per_return_fees DECIMAL(10,2) DEFAULT 0,
  revenue_share DECIMAL(10,2) DEFAULT 0,
  software_fees DECIMAL(10,2) DEFAULT 0,
  other_fees DECIMAL(10,2) DEFAULT 0,
  total_owed DECIMAL(10,2) DEFAULT 0,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'paid', 'overdue')),
  
  -- Invoice info
  invoiced_at TIMESTAMPTZ,
  invoice_number VARCHAR(50),
  due_date DATE,
  
  -- Payment info
  paid_at TIMESTAMPTZ,
  payment_reference VARCHAR(100),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS franchise_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Action info
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  
  -- Context
  office_id UUID REFERENCES franchise_offices(id),
  actor_id UUID REFERENCES auth.users(id),
  
  -- Details
  details JSONB,
  old_values JSONB,
  new_values JSONB,
  
  -- Request info
  ip_address INET,
  user_agent TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Offices
CREATE INDEX IF NOT EXISTS idx_franchise_offices_owner ON franchise_offices(owner_id);
CREATE INDEX IF NOT EXISTS idx_franchise_offices_status ON franchise_offices(status);
CREATE INDEX IF NOT EXISTS idx_franchise_offices_code ON franchise_offices(office_code);

-- Preparers
CREATE INDEX IF NOT EXISTS idx_franchise_preparers_office ON franchise_preparers(office_id);
CREATE INDEX IF NOT EXISTS idx_franchise_preparers_user ON franchise_preparers(user_id);
CREATE INDEX IF NOT EXISTS idx_franchise_preparers_ptin ON franchise_preparers(ptin);
CREATE INDEX IF NOT EXISTS idx_franchise_preparers_status ON franchise_preparers(status);

-- Clients
CREATE INDEX IF NOT EXISTS idx_franchise_clients_office ON franchise_clients(office_id);
CREATE INDEX IF NOT EXISTS idx_franchise_clients_ssn_hash ON franchise_clients(ssn_hash);
CREATE INDEX IF NOT EXISTS idx_franchise_clients_name ON franchise_clients(last_name, first_name);

-- Return submissions
CREATE INDEX IF NOT EXISTS idx_franchise_returns_office ON franchise_return_submissions(office_id);
CREATE INDEX IF NOT EXISTS idx_franchise_returns_preparer ON franchise_return_submissions(preparer_id);
CREATE INDEX IF NOT EXISTS idx_franchise_returns_client ON franchise_return_submissions(client_id);
CREATE INDEX IF NOT EXISTS idx_franchise_returns_status ON franchise_return_submissions(status);
CREATE INDEX IF NOT EXISTS idx_franchise_returns_year ON franchise_return_submissions(tax_year);
CREATE INDEX IF NOT EXISTS idx_franchise_returns_created ON franchise_return_submissions(created_at);

-- Audit log
CREATE INDEX IF NOT EXISTS idx_franchise_audit_office ON franchise_audit_log(office_id);
CREATE INDEX IF NOT EXISTS idx_franchise_audit_actor ON franchise_audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_franchise_audit_entity ON franchise_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_franchise_audit_created ON franchise_audit_log(created_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE franchise_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_preparers ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_ero_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_return_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_fee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_preparer_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_royalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_audit_log ENABLE ROW LEVEL SECURITY;

-- Offices: Admins see all, owners see their own
CREATE POLICY franchise_offices_admin ON franchise_offices
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR owner_id = auth.uid()
  );

-- Preparers: Admins see all, office owners see their office's preparers, preparers see themselves
CREATE POLICY franchise_preparers_access ON franchise_preparers
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
    OR user_id = auth.uid()
  );

-- Clients: Admins see all, office owners/preparers see their office's clients
CREATE POLICY franchise_clients_access ON franchise_clients
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM franchise_preparers WHERE office_id = franchise_clients.office_id AND user_id = auth.uid())
  );

-- Returns: Similar to clients
CREATE POLICY franchise_returns_access ON franchise_return_submissions
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM franchise_preparers WHERE id = preparer_id AND user_id = auth.uid())
  );

-- Audit log: Admins see all, office owners see their office's logs
CREATE POLICY franchise_audit_access ON franchise_audit_log
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
  );

-- ERO configs: Office owners and admins
CREATE POLICY franchise_ero_configs_access ON franchise_ero_configs
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
  );

-- Fee schedules: Office owners and admins
CREATE POLICY franchise_fee_schedules_access ON franchise_fee_schedules
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
  );

-- Preparer payouts: Office owners and admins
CREATE POLICY franchise_preparer_payouts_access ON franchise_preparer_payouts
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
    OR EXISTS (SELECT 1 FROM franchise_offices WHERE id = office_id AND owner_id = auth.uid())
    OR EXISTS (SELECT 1 FROM franchise_preparers WHERE id = preparer_id AND user_id = auth.uid())
  );

-- Royalties: Admins only (franchise-level data)
CREATE POLICY franchise_royalties_access ON franchise_royalties
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin'))
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_franchise_offices_updated_at
  BEFORE UPDATE ON franchise_offices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_franchise_preparers_updated_at
  BEFORE UPDATE ON franchise_preparers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_franchise_clients_updated_at
  BEFORE UPDATE ON franchise_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_franchise_return_submissions_updated_at
  BEFORE UPDATE ON franchise_return_submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to encrypt SSN
CREATE OR REPLACE FUNCTION encrypt_ssn(ssn TEXT, encryption_key TEXT)
RETURNS BYTEA AS $$
BEGIN
  RETURN pgp_sym_encrypt(ssn, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt SSN
CREATE OR REPLACE FUNCTION decrypt_ssn(encrypted_ssn BYTEA, encryption_key TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN pgp_sym_decrypt(encrypted_ssn, encryption_key);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to hash SSN for lookup
CREATE OR REPLACE FUNCTION hash_ssn(ssn TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(digest(regexp_replace(ssn, '[^0-9]', '', 'g'), 'sha256'), 'hex');
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================

-- Insert default fee schedule template
-- INSERT INTO franchise_fee_schedules (office_id, name, is_default)
-- VALUES (NULL, 'Default Fee Schedule', TRUE);

COMMENT ON TABLE franchise_offices IS 'Tax preparation offices in the franchise network';
COMMENT ON TABLE franchise_preparers IS 'Tax preparers with PTINs working at franchise offices';
COMMENT ON TABLE franchise_clients IS 'Clients of franchise offices';
COMMENT ON TABLE franchise_return_submissions IS 'Tax returns prepared and submitted through the franchise';
COMMENT ON TABLE franchise_audit_log IS 'Audit trail for all franchise operations';
-- Supersonic Tax Software Database Schema
-- Direct IRS MeF Integration Tables

-- MeF Submissions table - stores all tax return submissions
CREATE TABLE IF NOT EXISTS mef_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  efin TEXT NOT NULL DEFAULT '358459',
  software_id TEXT,
  tax_year INTEGER NOT NULL,
  submission_type TEXT NOT NULL DEFAULT 'IRS1040',
  
  -- Taxpayer info (hashed for security)
  taxpayer_ssn_hash TEXT,
  taxpayer_name TEXT,
  
  -- Return data
  return_data JSONB,
  xml_content TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending',
  dcn TEXT, -- Declaration Control Number (assigned by IRS on acceptance)
  
  -- Acknowledgment
  acknowledgment JSONB,
  
  -- Error handling
  error_message TEXT,
  resubmission_count INTEGER DEFAULT 0,
  original_submission_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  transmitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MeF Acknowledgments table - stores IRS responses
CREATE TABLE IF NOT EXISTS mef_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id TEXT NOT NULL REFERENCES mef_submissions(submission_id) ON DELETE CASCADE,
  status TEXT NOT NULL, -- 'accepted' or 'rejected'
  dcn TEXT, -- Declaration Control Number
  accepted_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  errors JSONB,
  received_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- MeF Errors table - detailed error logging
CREATE TABLE IF NOT EXISTS mef_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id TEXT NOT NULL REFERENCES mef_submissions(submission_id) ON DELETE CASCADE,
  error_code TEXT NOT NULL,
  error_category TEXT NOT NULL, -- 'reject' or 'alert'
  error_message TEXT NOT NULL,
  field_name TEXT,
  rule_number TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax Returns table - client-facing return records
CREATE TABLE IF NOT EXISTS tax_returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_id UUID,
  submission_id TEXT REFERENCES mef_submissions(submission_id),
  
  tax_year INTEGER NOT NULL,
  filing_status TEXT NOT NULL,
  
  -- Calculated amounts
  total_income DECIMAL(12,2),
  adjusted_gross_income DECIMAL(12,2),
  taxable_income DECIMAL(12,2),
  total_tax DECIMAL(12,2),
  total_payments DECIMAL(12,2),
  refund_amount DECIMAL(12,2),
  amount_owed DECIMAL(12,2),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft', -- draft, pending, transmitted, accepted, rejected
  dcn TEXT,
  
  -- Rejection info
  rejection_errors JSONB,
  rejected_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  
  -- Preparer info
  preparer_id UUID,
  preparer_ptin TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  filed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax Clients table - stores client information
CREATE TABLE IF NOT EXISTS tax_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Personal info
  first_name TEXT NOT NULL,
  middle_initial TEXT,
  last_name TEXT NOT NULL,
  ssn_hash TEXT NOT NULL, -- Hashed SSN
  ssn_last4 TEXT NOT NULL, -- Last 4 digits for display
  date_of_birth DATE NOT NULL,
  
  -- Contact
  email TEXT,
  phone TEXT,
  
  -- Address
  address_street TEXT,
  address_apartment TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  
  -- Spouse info (if applicable)
  spouse_first_name TEXT,
  spouse_last_name TEXT,
  spouse_ssn_hash TEXT,
  spouse_ssn_last4 TEXT,
  spouse_dob DATE,
  
  -- Bank info for direct deposit (encrypted)
  bank_routing_encrypted TEXT,
  bank_account_encrypted TEXT,
  bank_account_type TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tax Dependents table
CREATE TABLE IF NOT EXISTS tax_dependents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_return_id UUID REFERENCES tax_returns(id) ON DELETE CASCADE,
  client_id UUID REFERENCES tax_clients(id) ON DELETE CASCADE,
  
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  ssn_hash TEXT NOT NULL,
  ssn_last4 TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  relationship TEXT NOT NULL,
  months_lived_with_taxpayer INTEGER DEFAULT 12,
  
  child_tax_credit_eligible BOOLEAN DEFAULT FALSE,
  other_dependent_credit_eligible BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- W2 Income table
CREATE TABLE IF NOT EXISTS tax_w2_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_return_id UUID REFERENCES tax_returns(id) ON DELETE CASCADE,
  
  employer_ein TEXT NOT NULL,
  employer_name TEXT NOT NULL,
  employer_address_street TEXT,
  employer_address_city TEXT,
  employer_address_state TEXT,
  employer_address_zip TEXT,
  
  wages DECIMAL(12,2) NOT NULL, -- Box 1
  federal_withholding DECIMAL(12,2) DEFAULT 0, -- Box 2
  social_security_wages DECIMAL(12,2), -- Box 3
  social_security_tax DECIMAL(12,2), -- Box 4
  medicare_wages DECIMAL(12,2), -- Box 5
  medicare_tax DECIMAL(12,2), -- Box 6
  
  state_wages DECIMAL(12,2), -- Box 16
  state_withholding DECIMAL(12,2), -- Box 17
  state_code TEXT,
  state_employer_id TEXT,
  
  local_wages DECIMAL(12,2), -- Box 18
  local_withholding DECIMAL(12,2), -- Box 19
  locality_name TEXT,
  
  retirement_plan BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1099 Income table
CREATE TABLE IF NOT EXISTS tax_1099_income (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_return_id UUID REFERENCES tax_returns(id) ON DELETE CASCADE,
  
  form_type TEXT NOT NULL, -- 'INT', 'DIV', 'MISC', 'NEC', 'R', 'G'
  payer_name TEXT NOT NULL,
  payer_ein TEXT,
  
  -- Common fields
  amount DECIMAL(12,2) NOT NULL,
  federal_withholding DECIMAL(12,2) DEFAULT 0,
  
  -- Type-specific fields stored as JSONB
  details JSONB,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedule C Business Income table
CREATE TABLE IF NOT EXISTS tax_schedule_c (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_return_id UUID REFERENCES tax_returns(id) ON DELETE CASCADE,
  
  business_name TEXT NOT NULL,
  business_code TEXT NOT NULL, -- NAICS code
  ein TEXT,
  accounting_method TEXT DEFAULT 'cash',
  
  gross_receipts DECIMAL(12,2) NOT NULL,
  returns_allowances DECIMAL(12,2) DEFAULT 0,
  cost_of_goods_sold DECIMAL(12,2) DEFAULT 0,
  gross_profit DECIMAL(12,2),
  other_income DECIMAL(12,2) DEFAULT 0,
  
  -- Expenses
  expenses JSONB,
  total_expenses DECIMAL(12,2),
  
  net_profit DECIMAL(12,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Itemized Deductions table
CREATE TABLE IF NOT EXISTS tax_itemized_deductions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tax_return_id UUID REFERENCES tax_returns(id) ON DELETE CASCADE,
  
  medical_expenses DECIMAL(12,2) DEFAULT 0,
  state_local_taxes DECIMAL(12,2) DEFAULT 0,
  real_estate_taxes DECIMAL(12,2) DEFAULT 0,
  personal_property_taxes DECIMAL(12,2) DEFAULT 0,
  mortgage_interest DECIMAL(12,2) DEFAULT 0,
  mortgage_insurance_premiums DECIMAL(12,2) DEFAULT 0,
  charitable_cash DECIMAL(12,2) DEFAULT 0,
  charitable_noncash DECIMAL(12,2) DEFAULT 0,
  casualty_losses DECIMAL(12,2) DEFAULT 0,
  other_deductions DECIMAL(12,2) DEFAULT 0,
  
  total_itemized DECIMAL(12,2),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_mef_submissions_user ON mef_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_mef_submissions_status ON mef_submissions(status);
CREATE INDEX IF NOT EXISTS idx_mef_submissions_tax_year ON mef_submissions(tax_year);
CREATE INDEX IF NOT EXISTS idx_mef_submissions_ssn_hash ON mef_submissions(taxpayer_ssn_hash);
CREATE INDEX IF NOT EXISTS idx_tax_returns_user ON tax_returns(user_id);
CREATE INDEX IF NOT EXISTS idx_tax_returns_status ON tax_returns(status);
CREATE INDEX IF NOT EXISTS idx_tax_returns_year ON tax_returns(tax_year);
CREATE INDEX IF NOT EXISTS idx_tax_clients_ssn_hash ON tax_clients(ssn_hash);
CREATE INDEX IF NOT EXISTS idx_mef_errors_submission ON mef_errors(submission_id);

-- Enable RLS
ALTER TABLE mef_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mef_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE mef_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_w2_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_1099_income ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_schedule_c ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_itemized_deductions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions" ON mef_submissions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view their own tax returns
CREATE POLICY "Users can view own tax returns" ON tax_returns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tax returns" ON tax_returns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tax returns" ON tax_returns
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can view their own client record
CREATE POLICY "Users can view own client record" ON tax_clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own client record" ON tax_clients
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own client record" ON tax_clients
  FOR UPDATE USING (auth.uid() = user_id);

-- Admin policies for tax preparers
CREATE POLICY "Admins can view all submissions" ON mef_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'tax_preparer')
    )
  );

CREATE POLICY "Admins can insert submissions" ON mef_submissions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'tax_preparer')
    )
  );

CREATE POLICY "Admins can update submissions" ON mef_submissions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'tax_preparer')
    )
  );

CREATE POLICY "Admins can view all tax returns" ON tax_returns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'tax_preparer')
    )
  );

CREATE POLICY "Admins can view all clients" ON tax_clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'tax_preparer')
    )
  );

-- Service role bypass for API operations
CREATE POLICY "Service role full access submissions" ON mef_submissions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access acknowledgments" ON mef_acknowledgments
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service role full access errors" ON mef_errors
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

SELECT 'Tax software tables created successfully' AS result;
-- Career Services Courses/Products
-- These are purchasable video courses for career development

-- Create career_courses table
CREATE TABLE IF NOT EXISTS career_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2),
  image_url TEXT,
  duration_hours DECIMAL(4,1),
  lesson_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_bestseller BOOLEAN DEFAULT false,
  is_bundle BOOLEAN DEFAULT false,
  bundle_course_ids UUID[] DEFAULT '{}',
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create career_course_features table (what's included)
CREATE TABLE IF NOT EXISTS career_course_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES career_courses(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create career_course_modules table (curriculum)
CREATE TABLE IF NOT EXISTS career_course_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES career_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  duration_minutes INTEGER,
  sort_order INTEGER DEFAULT 0,
  is_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create career_course_purchases table
CREATE TABLE IF NOT EXISTS career_course_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  course_id UUID REFERENCES career_courses(id),
  email TEXT NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  stripe_payment_id TEXT,
  stripe_session_id TEXT,
  status TEXT DEFAULT 'completed',
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_career_courses_active ON career_courses(is_active);
CREATE INDEX IF NOT EXISTS idx_career_courses_slug ON career_courses(slug);
CREATE INDEX IF NOT EXISTS idx_career_course_purchases_user ON career_course_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_career_course_purchases_email ON career_course_purchases(email);

-- Enable RLS
ALTER TABLE career_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_course_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_course_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE career_course_purchases ENABLE ROW LEVEL SECURITY;

-- Policies for career_courses (public read)
CREATE POLICY "Anyone can view active courses" ON career_courses
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage courses" ON career_courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Policies for features (public read)
CREATE POLICY "Anyone can view course features" ON career_course_features
  FOR SELECT USING (true);

-- Policies for modules (purchased users or preview)
CREATE POLICY "Anyone can view preview modules" ON career_course_modules
  FOR SELECT USING (is_preview = true);

CREATE POLICY "Purchased users can view all modules" ON career_course_modules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM career_course_purchases
      WHERE career_course_purchases.course_id = career_course_modules.course_id
      AND career_course_purchases.user_id = auth.uid()
      AND career_course_purchases.status = 'completed'
    )
  );

-- Policies for purchases
CREATE POLICY "Users can view own purchases" ON career_course_purchases
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert purchases" ON career_course_purchases
  FOR INSERT WITH CHECK (true);

-- Insert the courses
INSERT INTO career_courses (slug, title, subtitle, description, price, original_price, image_url, duration_hours, lesson_count, is_bestseller) VALUES
(
  'resume-mastery',
  'Resume Mastery',
  'Build a Resume That Gets Interviews',
  'Learn how to create a professional, ATS-optimized resume that stands out to employers. Includes templates, examples, and step-by-step video guidance.',
  197.00,
  297.00,
  '/images/programs-hq/business-training.jpg',
  3.0,
  12,
  true
),
(
  'interview-domination',
  'Interview Domination',
  'Ace Any Interview With Confidence',
  'Master the art of interviewing with proven techniques, mock interview practice, and insider strategies from hiring managers.',
  297.00,
  397.00,
  '/images/programs-hq/medical-assistant.jpg',
  4.0,
  16,
  false
),
(
  'job-search-accelerator',
  'Job Search Accelerator',
  'Land Your Dream Job in 30 Days',
  'A complete job search system with networking strategies, application tracking, and proven methods to get hired faster.',
  397.00,
  497.00,
  '/images/heroes-hq/career-services-hero.jpg',
  5.0,
  20,
  false
);

-- Insert the bundle
INSERT INTO career_courses (slug, title, subtitle, description, price, original_price, image_url, duration_hours, lesson_count, is_bundle, bundle_course_ids) 
SELECT 
  'career-launch-bundle',
  'Career Launch Bundle',
  'Complete Career Transformation Package',
  'Get all 3 courses plus exclusive bonuses. Everything you need to land your dream job.',
  597.00,
  891.00,
  '/images/heroes-hq/about-hero.jpg',
  12.0,
  48,
  true,
  ARRAY(SELECT id FROM career_courses WHERE slug IN ('resume-mastery', 'interview-domination', 'job-search-accelerator'));

-- Insert features for Resume Mastery
INSERT INTO career_course_features (course_id, feature, sort_order)
SELECT id, feature, sort_order FROM career_courses, 
  (VALUES 
    ('12 HD video lessons', 1),
    ('5 professional resume templates', 2),
    ('ATS optimization checklist', 3),
    ('Cover letter templates', 4),
    ('LinkedIn profile guide', 5),
    ('Lifetime access', 6),
    ('Certificate of completion', 7)
  ) AS features(feature, sort_order)
WHERE slug = 'resume-mastery';

-- Insert features for Interview Domination
INSERT INTO career_course_features (course_id, feature, sort_order)
SELECT id, feature, sort_order FROM career_courses, 
  (VALUES 
    ('16 HD video lessons', 1),
    ('Mock interview recordings', 2),
    ('STAR method worksheets', 3),
    ('50+ common questions answered', 4),
    ('Salary negotiation scripts', 5),
    ('Follow-up email templates', 6),
    ('Certificate of completion', 7)
  ) AS features(feature, sort_order)
WHERE slug = 'interview-domination';

-- Insert features for Job Search Accelerator
INSERT INTO career_course_features (course_id, feature, sort_order)
SELECT id, feature, sort_order FROM career_courses, 
  (VALUES 
    ('20 HD video lessons', 1),
    ('Job search tracker spreadsheet', 2),
    ('Networking scripts & templates', 3),
    ('Hidden job market strategies', 4),
    ('Personal branding guide', 5),
    ('Weekly action plans', 6),
    ('Certificate of completion', 7)
  ) AS features(feature, sort_order)
WHERE slug = 'job-search-accelerator';

-- Insert features for Bundle
INSERT INTO career_course_features (course_id, feature, sort_order)
SELECT id, feature, sort_order FROM career_courses, 
  (VALUES 
    ('All 3 courses included', 1),
    ('48 HD video lessons total', 2),
    ('1-on-1 Resume Review Session ($149 value)', 3),
    ('Private Community Access', 4),
    ('Monthly Live Q&A Calls', 5),
    ('Priority Email Support', 6),
    ('Save $294 vs buying separately', 7)
  ) AS features(feature, sort_order)
WHERE slug = 'career-launch-bundle';

-- Insert modules for Resume Mastery
INSERT INTO career_course_modules (course_id, title, description, duration_minutes, sort_order, is_preview)
SELECT id, title, description, duration, sort_order, is_preview FROM career_courses,
  (VALUES
    ('Introduction to Resume Writing', 'Overview of what makes a winning resume', 10, 1, true),
    ('Resume Fundamentals & Strategy', 'Understanding resume formats and when to use each', 15, 2, false),
    ('Contact Information Best Practices', 'How to present your contact info professionally', 8, 3, false),
    ('Writing a Powerful Summary', 'Craft a summary that grabs attention', 18, 4, false),
    ('Work Experience That Sells', 'Turn job duties into achievements', 25, 5, false),
    ('Writing Powerful Bullet Points', 'Action verbs and quantifiable results', 20, 6, false),
    ('Education & Certifications', 'Presenting your credentials effectively', 12, 7, false),
    ('Skills Section Optimization', 'Technical and soft skills that matter', 15, 8, false),
    ('ATS Optimization Secrets', 'Beat the applicant tracking systems', 22, 9, false),
    ('Industry-Specific Examples', 'Resume examples for different fields', 20, 10, false),
    ('Cover Letter Mastery', 'Write cover letters that get read', 18, 11, false),
    ('LinkedIn Profile Optimization', 'Align your LinkedIn with your resume', 15, 12, false)
  ) AS modules(title, description, duration, sort_order, is_preview)
WHERE slug = 'resume-mastery';

-- Insert modules for Interview Domination
INSERT INTO career_course_modules (course_id, title, description, duration_minutes, sort_order, is_preview)
SELECT id, title, description, duration, sort_order, is_preview FROM career_courses,
  (VALUES
    ('Interview Success Mindset', 'Building confidence before the interview', 12, 1, true),
    ('Research & Preparation', 'How to research companies effectively', 15, 2, false),
    ('First Impressions Matter', 'Body language and presentation', 14, 3, false),
    ('Tell Me About Yourself', 'Crafting your personal pitch', 18, 4, false),
    ('Mastering the STAR Method', 'Structure your answers for impact', 25, 5, false),
    ('Behavioral Questions Deep Dive', 'Common questions and winning answers', 30, 6, false),
    ('Technical Interview Prep', 'Industry-specific question strategies', 22, 7, false),
    ('Situational Questions', 'How to handle hypothetical scenarios', 18, 8, false),
    ('Questions to Ask Employers', 'Show interest and gather intel', 12, 9, false),
    ('Virtual Interview Success', 'Zoom, Teams, and video interview tips', 15, 10, false),
    ('Panel Interview Strategies', 'Handle multiple interviewers', 14, 11, false),
    ('Handling Difficult Questions', 'Gaps, weaknesses, and tough topics', 20, 12, false),
    ('Salary Negotiation Tactics', 'Get paid what you deserve', 25, 13, false),
    ('Benefits Negotiation', 'Beyond salary - total compensation', 12, 14, false),
    ('Post-Interview Follow-Up', 'Thank you notes that stand out', 10, 15, false),
    ('Handling Rejection & Next Steps', 'Learn and improve from every interview', 10, 16, false)
  ) AS modules(title, description, duration, sort_order, is_preview)
WHERE slug = 'interview-domination';

-- Insert modules for Job Search Accelerator
INSERT INTO career_course_modules (course_id, title, description, duration_minutes, sort_order, is_preview)
SELECT id, title, description, duration, sort_order, is_preview FROM career_courses,
  (VALUES
    ('Job Search Strategy Overview', 'Creating your 30-day action plan', 15, 1, true),
    ('Defining Your Target Role', 'Get clear on what you want', 18, 2, false),
    ('Building Your Personal Brand', 'Stand out in a crowded market', 22, 3, false),
    ('Optimizing Your Online Presence', 'LinkedIn, portfolios, and more', 20, 4, false),
    ('The Hidden Job Market', 'Find jobs before they are posted', 25, 5, false),
    ('Networking Fundamentals', 'Build relationships that lead to jobs', 20, 6, false),
    ('Informational Interviews', 'Learn and connect simultaneously', 15, 7, false),
    ('Networking Scripts & Templates', 'What to say and how to say it', 18, 8, false),
    ('Job Board Strategies', 'Use Indeed, LinkedIn, and others effectively', 15, 9, false),
    ('Company Research Deep Dive', 'Target companies strategically', 14, 10, false),
    ('Application Optimization', 'Tailor every application', 18, 11, false),
    ('Tracking Your Applications', 'Stay organized and follow up', 12, 12, false),
    ('Working with Recruiters', 'Leverage staffing agencies', 15, 13, false),
    ('Career Fairs & Events', 'Make the most of in-person opportunities', 12, 14, false),
    ('Managing Multiple Offers', 'A good problem to have', 15, 15, false),
    ('Evaluating Job Offers', 'Compare opportunities objectively', 18, 16, false),
    ('Making Your Decision', 'Choose the right opportunity', 12, 17, false),
    ('Giving Notice Professionally', 'Leave on good terms', 10, 18, false),
    ('First 90 Days Success Plan', 'Start strong in your new role', 20, 19, false),
    ('Long-Term Career Planning', 'Keep growing after you land the job', 15, 20, false)
  ) AS modules(title, description, duration, sort_order, is_preview)
WHERE slug = 'job-search-accelerator';
-- =====================================================
-- PROMO CODES SYSTEM
-- Copy and paste into Supabase SQL Editor
-- =====================================================

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_purchase DECIMAL(10,2) DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  applies_to TEXT DEFAULT 'all', -- 'all', 'career_courses', 'specific'
  specific_course_ids UUID[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create promo_code_uses table (track who used what)
CREATE TABLE IF NOT EXISTS promo_code_uses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  order_id TEXT,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_promo_code_uses_code ON promo_code_uses(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_uses_user ON promo_code_uses(user_id);

-- Enable RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_uses ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "promo_codes_select" ON promo_codes
  FOR SELECT USING (is_active = true);

CREATE POLICY "promo_codes_admin" ON promo_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "promo_code_uses_insert" ON promo_code_uses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "promo_code_uses_select" ON promo_code_uses
  FOR SELECT USING (user_id = auth.uid());

-- Insert some starter promo codes
INSERT INTO promo_codes (code, description, discount_type, discount_value, max_uses, valid_until, applies_to) VALUES
('LAUNCH20', 'Launch discount - 20% off', 'percentage', 20.00, 100, NOW() + INTERVAL '90 days', 'career_courses'),
('FIRST50', 'First purchase - $50 off', 'fixed', 50.00, 50, NOW() + INTERVAL '60 days', 'career_courses'),
('BUNDLE100', 'Bundle special - $100 off bundle', 'fixed', 100.00, NULL, NOW() + INTERVAL '30 days', 'career_courses'),
('STUDENT25', 'Student discount - 25% off', 'percentage', 25.00, NULL, NULL, 'all');

-- =====================================================
-- DONE!
-- =====================================================
-- Franchise Tax Office Management Schema
-- Supports multi-office, multi-preparer tax preparation business

-- ============================================
-- FRANCHISE OFFICES
-- ============================================

CREATE TABLE IF NOT EXISTS tax_offices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Office identification
  office_code VARCHAR(20) UNIQUE NOT NULL, -- e.g., "IND-001", "CHI-002"
  office_name VARCHAR(255) NOT NULL,
  
  -- Owner/franchisee
  owner_id UUID REFERENCES auth.users(id),
  owner_name VARCHAR(255) NOT NULL,
  owner_email VARCHAR(255) NOT NULL,
  owner_phone VARCHAR(20),
  
  -- Location
  address_street VARCHAR(255) NOT NULL,
  address_city VARCHAR(100) NOT NULL,
  address_state VARCHAR(2) NOT NULL,
  address_zip VARCHAR(10) NOT NULL,
  
  -- Business details
  business_ein VARCHAR(20), -- Office's own EIN if applicable
  state_license VARCHAR(50), -- State tax preparer license if required
  
  -- ERO relationship (all offices operate under main EFIN)
  parent_efin VARCHAR(6) NOT NULL DEFAULT '358459',
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, active, suspended, terminated
  activated_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  
  -- Franchise terms
  franchise_fee DECIMAL(10,2) DEFAULT 0,
  per_return_fee DECIMAL(10,2) DEFAULT 5.00, -- Fee per return to franchisor
  revenue_share_percent DECIMAL(5,2) DEFAULT 0, -- Alternative to per-return fee
  contract_start_date DATE,
  contract_end_date DATE,
  
  -- Limits
  max_preparers INTEGER DEFAULT 10,
  max_returns_per_season INTEGER, -- NULL = unlimited
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- ============================================
-- TAX PREPARERS
-- ============================================

CREATE TABLE IF NOT EXISTS tax_preparers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User link
  user_id UUID REFERENCES auth.users(id),
  
  -- Personal info
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  
  -- IRS credentials
  ptin VARCHAR(20) NOT NULL, -- P01234567 format
  ptin_expiration DATE,
  
  -- Office assignment
  office_id UUID REFERENCES tax_offices(id),
  
  -- Certification/training
  certification_level VARCHAR(50), -- basic, intermediate, advanced, supervisor
  certifications JSONB DEFAULT '[]', -- Array of certifications with dates
  training_completed_at TIMESTAMPTZ,
  annual_refresher_due DATE,
  
  -- IRS requirements
  efin_authorized BOOLEAN DEFAULT FALSE, -- Authorized to use office EFIN
  ero_authorized BOOLEAN DEFAULT FALSE, -- Can sign as ERO (usually only owner)
  
  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, active, suspended, terminated
  activated_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  
  -- Performance tracking
  returns_prepared_lifetime INTEGER DEFAULT 0,
  returns_prepared_current_season INTEGER DEFAULT 0,
  rejection_rate DECIMAL(5,2) DEFAULT 0,
  average_refund DECIMAL(12,2),
  
  -- Compensation
  compensation_type VARCHAR(20) DEFAULT 'per_return', -- per_return, hourly, salary, commission
  per_return_rate DECIMAL(10,2), -- Amount paid per return
  hourly_rate DECIMAL(10,2),
  commission_percent DECIMAL(5,2),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT,
  
  UNIQUE(ptin),
  UNIQUE(email)
);

-- ============================================
-- TAX RETURN ASSIGNMENTS
-- ============================================

-- Extend mef_submissions to track preparer/office
ALTER TABLE mef_submissions 
ADD COLUMN IF NOT EXISTS office_id UUID REFERENCES tax_offices(id),
ADD COLUMN IF NOT EXISTS preparer_id UUID REFERENCES tax_preparers(id),
ADD COLUMN IF NOT EXISTS ero_id UUID REFERENCES tax_preparers(id), -- Who signed as ERO
ADD COLUMN IF NOT EXISTS preparer_ptin VARCHAR(20),
ADD COLUMN IF NOT EXISTS client_fee DECIMAL(10,2), -- What client paid
ADD COLUMN IF NOT EXISTS franchise_fee DECIMAL(10,2), -- Fee to franchisor
ADD COLUMN IF NOT EXISTS preparer_commission DECIMAL(10,2), -- Preparer's cut
ADD COLUMN IF NOT EXISTS office_revenue DECIMAL(10,2); -- Office's cut

-- ============================================
-- CLIENT MANAGEMENT (per office)
-- ============================================

CREATE TABLE IF NOT EXISTS tax_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Office relationship
  office_id UUID REFERENCES tax_offices(id) NOT NULL,
  
  -- Client info (encrypted SSN stored separately)
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  
  -- Address
  address_street VARCHAR(255),
  address_city VARCHAR(100),
  address_state VARCHAR(2),
  address_zip VARCHAR(10),
  
  -- Tax info (non-sensitive)
  filing_status VARCHAR(50),
  dependents_count INTEGER DEFAULT 0,
  
  -- Encrypted sensitive data reference
  ssn_encrypted TEXT, -- Encrypted SSN
  ssn_last_four VARCHAR(4), -- For display/lookup
  
  -- Spouse info (if MFJ)
  spouse_first_name VARCHAR(100),
  spouse_last_name VARCHAR(100),
  spouse_ssn_encrypted TEXT,
  spouse_ssn_last_four VARCHAR(4),
  
  -- Preferred preparer
  preferred_preparer_id UUID REFERENCES tax_preparers(id),
  
  -- History
  client_since DATE DEFAULT CURRENT_DATE,
  returns_filed INTEGER DEFAULT 0,
  total_fees_paid DECIMAL(12,2) DEFAULT 0,
  last_return_date DATE,
  last_return_id UUID REFERENCES mef_submissions(id),
  
  -- Status
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, do_not_serve
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- ============================================
-- FEE SCHEDULE (per office customizable)
-- ============================================

CREATE TABLE IF NOT EXISTS tax_fee_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  office_id UUID REFERENCES tax_offices(id),
  
  -- Fee structure
  name VARCHAR(100) NOT NULL, -- e.g., "Standard 2026", "Premium"
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Base fees
  base_fee_1040 DECIMAL(10,2) DEFAULT 75.00,
  base_fee_1040_ez DECIMAL(10,2) DEFAULT 50.00,
  
  -- Add-on fees
  fee_schedule_a DECIMAL(10,2) DEFAULT 25.00, -- Itemized deductions
  fee_schedule_c DECIMAL(10,2) DEFAULT 75.00, -- Business income
  fee_schedule_d DECIMAL(10,2) DEFAULT 35.00, -- Capital gains
  fee_schedule_e DECIMAL(10,2) DEFAULT 50.00, -- Rental income
  fee_schedule_se DECIMAL(10,2) DEFAULT 25.00, -- Self-employment tax
  fee_per_w2 DECIMAL(10,2) DEFAULT 0, -- Per W-2 after first
  fee_per_1099 DECIMAL(10,2) DEFAULT 15.00, -- Per 1099
  fee_per_dependent DECIMAL(10,2) DEFAULT 10.00,
  fee_state_return DECIMAL(10,2) DEFAULT 45.00,
  fee_eitc DECIMAL(10,2) DEFAULT 0, -- EITC add-on
  fee_ctc DECIMAL(10,2) DEFAULT 0, -- Child tax credit add-on
  
  -- Bank products
  fee_refund_transfer DECIMAL(10,2) DEFAULT 40.00,
  fee_refund_advance DECIMAL(10,2) DEFAULT 0, -- If offering RALs
  
  -- Discounts
  returning_client_discount_percent DECIMAL(5,2) DEFAULT 10.00,
  referral_discount DECIMAL(10,2) DEFAULT 20.00,
  senior_discount_percent DECIMAL(5,2) DEFAULT 10.00,
  military_discount_percent DECIMAL(5,2) DEFAULT 15.00,
  
  -- Effective dates
  effective_from DATE NOT NULL,
  effective_to DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- COMMISSION/PAYOUT TRACKING
-- ============================================

CREATE TABLE IF NOT EXISTS preparer_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  preparer_id UUID REFERENCES tax_preparers(id) NOT NULL,
  office_id UUID REFERENCES tax_offices(id) NOT NULL,
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Earnings
  returns_count INTEGER DEFAULT 0,
  gross_earnings DECIMAL(12,2) DEFAULT 0,
  deductions DECIMAL(12,2) DEFAULT 0, -- Chargebacks, errors, etc.
  net_earnings DECIMAL(12,2) DEFAULT 0,
  
  -- Payment
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, paid, disputed
  paid_at TIMESTAMPTZ,
  payment_method VARCHAR(50), -- check, direct_deposit, cash
  payment_reference VARCHAR(100), -- Check number, transaction ID
  
  -- Approval
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- ============================================
-- FRANCHISE FEES/ROYALTIES
-- ============================================

CREATE TABLE IF NOT EXISTS franchise_royalties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  office_id UUID REFERENCES tax_offices(id) NOT NULL,
  
  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Activity
  returns_count INTEGER DEFAULT 0,
  gross_revenue DECIMAL(12,2) DEFAULT 0,
  
  -- Fees owed to franchisor
  per_return_fees DECIMAL(12,2) DEFAULT 0,
  revenue_share DECIMAL(12,2) DEFAULT 0,
  software_fees DECIMAL(12,2) DEFAULT 0,
  other_fees DECIMAL(12,2) DEFAULT 0,
  total_owed DECIMAL(12,2) DEFAULT 0,
  
  -- Payment
  status VARCHAR(20) DEFAULT 'pending', -- pending, invoiced, paid, overdue
  invoiced_at TIMESTAMPTZ,
  invoice_number VARCHAR(50),
  due_date DATE,
  paid_at TIMESTAMPTZ,
  payment_reference VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AUDIT LOG (for compliance)
-- ============================================

CREATE TABLE IF NOT EXISTS tax_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What happened
  event_type VARCHAR(50) NOT NULL, -- return_created, return_submitted, return_rejected, client_created, etc.
  event_description TEXT,
  
  -- Who
  user_id UUID REFERENCES auth.users(id),
  preparer_id UUID REFERENCES tax_preparers(id),
  office_id UUID REFERENCES tax_offices(id),
  
  -- What entity
  entity_type VARCHAR(50), -- submission, client, preparer, office
  entity_id UUID,
  
  -- Details
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tax_offices_status ON tax_offices(status);
CREATE INDEX IF NOT EXISTS idx_tax_offices_owner ON tax_offices(owner_id);

CREATE INDEX IF NOT EXISTS idx_tax_preparers_office ON tax_preparers(office_id);
CREATE INDEX IF NOT EXISTS idx_tax_preparers_ptin ON tax_preparers(ptin);
CREATE INDEX IF NOT EXISTS idx_tax_preparers_status ON tax_preparers(status);

CREATE INDEX IF NOT EXISTS idx_tax_clients_office ON tax_clients(office_id);
CREATE INDEX IF NOT EXISTS idx_tax_clients_ssn_last_four ON tax_clients(ssn_last_four);
CREATE INDEX IF NOT EXISTS idx_tax_clients_name ON tax_clients(last_name, first_name);

CREATE INDEX IF NOT EXISTS idx_mef_submissions_office ON mef_submissions(office_id);
CREATE INDEX IF NOT EXISTS idx_mef_submissions_preparer ON mef_submissions(preparer_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_event ON tax_audit_log(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON tax_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON tax_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON tax_audit_log(created_at);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE tax_offices ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_preparers ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_fee_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE preparer_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE franchise_royalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_audit_log ENABLE ROW LEVEL SECURITY;

-- Franchise admin (you) can see everything
CREATE POLICY "Franchise admin full access to offices" ON tax_offices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'franchise_admin')
    )
  );

-- Office owners can see their own office
CREATE POLICY "Office owners can view own office" ON tax_offices
  FOR SELECT USING (owner_id = auth.uid());

CREATE POLICY "Office owners can update own office" ON tax_offices
  FOR UPDATE USING (owner_id = auth.uid());

-- Preparers: office owners and admins can manage
CREATE POLICY "Admins full access to preparers" ON tax_preparers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'franchise_admin')
    )
  );

CREATE POLICY "Office owners can manage their preparers" ON tax_preparers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tax_offices 
      WHERE tax_offices.id = tax_preparers.office_id 
      AND tax_offices.owner_id = auth.uid()
    )
  );

CREATE POLICY "Preparers can view own record" ON tax_preparers
  FOR SELECT USING (user_id = auth.uid());

-- Clients: office staff can access their office's clients
CREATE POLICY "Admins full access to clients" ON tax_clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'franchise_admin')
    )
  );

CREATE POLICY "Office staff can access office clients" ON tax_clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM tax_preparers 
      WHERE tax_preparers.office_id = tax_clients.office_id 
      AND tax_preparers.user_id = auth.uid()
      AND tax_preparers.status = 'active'
    )
    OR
    EXISTS (
      SELECT 1 FROM tax_offices 
      WHERE tax_offices.id = tax_clients.office_id 
      AND tax_offices.owner_id = auth.uid()
    )
  );

-- Audit log: admins only
CREATE POLICY "Admins can view audit log" ON tax_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('super_admin', 'franchise_admin')
    )
  );

-- Anyone can insert audit log entries
CREATE POLICY "Anyone can create audit entries" ON tax_audit_log
  FOR INSERT WITH CHECK (true);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tax_offices_updated_at
  BEFORE UPDATE ON tax_offices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tax_preparers_updated_at
  BEFORE UPDATE ON tax_preparers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tax_clients_updated_at
  BEFORE UPDATE ON tax_clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Calculate return fees
CREATE OR REPLACE FUNCTION calculate_return_fee(
  p_office_id UUID,
  p_has_schedule_a BOOLEAN DEFAULT FALSE,
  p_has_schedule_c BOOLEAN DEFAULT FALSE,
  p_has_schedule_d BOOLEAN DEFAULT FALSE,
  p_has_schedule_e BOOLEAN DEFAULT FALSE,
  p_w2_count INTEGER DEFAULT 1,
  p_1099_count INTEGER DEFAULT 0,
  p_dependent_count INTEGER DEFAULT 0,
  p_has_state BOOLEAN DEFAULT FALSE,
  p_is_returning_client BOOLEAN DEFAULT FALSE
)
RETURNS DECIMAL AS $$
DECLARE
  v_fee_schedule tax_fee_schedules%ROWTYPE;
  v_total DECIMAL := 0;
BEGIN
  -- Get active fee schedule for office
  SELECT * INTO v_fee_schedule
  FROM tax_fee_schedules
  WHERE office_id = p_office_id
    AND is_default = TRUE
    AND effective_from <= CURRENT_DATE
    AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- Use base defaults
    v_total := 75.00;
  ELSE
    -- Base fee
    v_total := v_fee_schedule.base_fee_1040;
    
    -- Schedule add-ons
    IF p_has_schedule_a THEN v_total := v_total + v_fee_schedule.fee_schedule_a; END IF;
    IF p_has_schedule_c THEN v_total := v_total + v_fee_schedule.fee_schedule_c; END IF;
    IF p_has_schedule_d THEN v_total := v_total + v_fee_schedule.fee_schedule_d; END IF;
    IF p_has_schedule_e THEN v_total := v_total + v_fee_schedule.fee_schedule_e; END IF;
    
    -- Per-item fees
    IF p_w2_count > 1 THEN 
      v_total := v_total + (v_fee_schedule.fee_per_w2 * (p_w2_count - 1)); 
    END IF;
    v_total := v_total + (v_fee_schedule.fee_per_1099 * p_1099_count);
    v_total := v_total + (v_fee_schedule.fee_per_dependent * p_dependent_count);
    
    -- State return
    IF p_has_state THEN v_total := v_total + v_fee_schedule.fee_state_return; END IF;
    
    -- Returning client discount
    IF p_is_returning_client THEN
      v_total := v_total * (1 - v_fee_schedule.returning_client_discount_percent / 100);
    END IF;
  END IF;
  
  RETURN ROUND(v_total, 2);
END;
$$ LANGUAGE plpgsql;

-- Log audit event
CREATE OR REPLACE FUNCTION log_tax_audit_event(
  p_event_type VARCHAR(50),
  p_event_description TEXT,
  p_entity_type VARCHAR(50),
  p_entity_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
  v_preparer_id UUID;
  v_office_id UUID;
BEGIN
  -- Try to get preparer/office context
  SELECT id, office_id INTO v_preparer_id, v_office_id
  FROM tax_preparers
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  INSERT INTO tax_audit_log (
    event_type, event_description, user_id, preparer_id, office_id,
    entity_type, entity_id, old_values, new_values
  ) VALUES (
    p_event_type, p_event_description, auth.uid(), v_preparer_id, v_office_id,
    p_entity_type, p_entity_id, p_old_values, p_new_values
  )
  RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- NDS Training Courses Migration
-- Links NDS/MyDrugTestTraining courses to Stripe products with correct 50/50 markup pricing
-- Pricing: Elevate Price = NDS Wholesale Cost × 2 (50/50 revenue share)

-- Ensure partner_lms_providers table exists and has NDS
INSERT INTO partner_lms_providers (provider_name, provider_type, api_base_url, is_active)
VALUES ('National Drug Screening', 'nds', 'https://mydrugtesttraining.com', true)
ON CONFLICT (provider_type) DO UPDATE SET
  provider_name = EXCLUDED.provider_name,
  is_active = true;

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
CREATE INDEX IF NOT EXISTS idx_nds_courses_category ON nds_training_courses(category);
CREATE INDEX IF NOT EXISTS idx_nds_courses_active ON nds_training_courses(is_active);
CREATE INDEX IF NOT EXISTS idx_nds_courses_stripe ON nds_training_courses(stripe_product_id);

-- Enable RLS
ALTER TABLE nds_training_courses ENABLE ROW LEVEL SECURITY;

-- Public read access for active courses
CREATE POLICY "Anyone can view active NDS courses" ON nds_training_courses
  FOR SELECT USING (is_active = true);

-- Admin management
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
  course_id UUID REFERENCES nds_training_courses(id),
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
CREATE INDEX IF NOT EXISTS idx_nds_purchases_user ON nds_course_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_nds_purchases_status ON nds_course_purchases(status);
CREATE INDEX IF NOT EXISTS idx_nds_purchases_stripe ON nds_course_purchases(stripe_payment_intent_id);

-- Enable RLS on purchases
ALTER TABLE nds_course_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view own purchases
CREATE POLICY "Users can view own NDS purchases" ON nds_course_purchases
  FOR SELECT USING (user_id = auth.uid());

-- System can insert purchases
CREATE POLICY "System can insert NDS purchases" ON nds_course_purchases
  FOR INSERT WITH CHECK (true);

-- Admins can manage all purchases
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
-- Stripe Price to Enrollment Mapping Table
-- Maps Stripe price_ids and product_ids to program enrollment data
-- Used by webhook fallback when Payment Links lack metadata

CREATE TABLE IF NOT EXISTS stripe_price_enrollment_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Stripe identifiers (at least one required)
  stripe_price_id TEXT,
  stripe_product_id TEXT,
  
  -- Enrollment target
  program_id UUID REFERENCES training_programs(id),
  program_slug TEXT NOT NULL,
  
  -- Enrollment configuration
  enrollment_type TEXT NOT NULL DEFAULT 'program', -- 'program', 'course', 'nds_course'
  funding_source TEXT DEFAULT 'SELF_PAY', -- 'SELF_PAY', 'WIOA', 'WRG', 'EMPLOYER'
  is_deposit BOOLEAN DEFAULT false, -- true if this is a deposit payment (not full)
  is_free_enrollment BOOLEAN DEFAULT false, -- true for $0 WIOA enrollments
  
  -- Auto-enrollment behavior
  auto_enroll BOOLEAN DEFAULT true, -- whether to auto-create enrollment on payment
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

-- Indexes for fast lookup
CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_map_price ON stripe_price_enrollment_map(stripe_price_id) WHERE stripe_price_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_stripe_map_product ON stripe_price_enrollment_map(stripe_product_id) WHERE stripe_product_id IS NOT NULL AND stripe_price_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_stripe_map_program ON stripe_price_enrollment_map(program_slug);
CREATE INDEX IF NOT EXISTS idx_stripe_map_active ON stripe_price_enrollment_map(is_active);

-- Enable RLS
ALTER TABLE stripe_price_enrollment_map ENABLE ROW LEVEL SECURITY;

-- Only admins can manage mappings
CREATE POLICY "Admins can manage stripe price mappings" ON stripe_price_enrollment_map
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Service role can read for webhook processing
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
-- Training Programs with Stripe Integration
-- Links all Elevate training programs to Stripe products and prices
-- Pricing from tuition-fees page and program-constants.ts

-- Create training programs table
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
CREATE INDEX IF NOT EXISTS idx_training_programs_slug ON training_programs(slug);
CREATE INDEX IF NOT EXISTS idx_training_programs_category ON training_programs(category);
CREATE INDEX IF NOT EXISTS idx_training_programs_active ON training_programs(is_active);
CREATE INDEX IF NOT EXISTS idx_training_programs_stripe ON training_programs(stripe_product_id);

-- Enable RLS
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view active training programs" ON training_programs
  FOR SELECT USING (is_active = true);

-- Admin management
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
  program_id UUID REFERENCES training_programs(id),
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
CREATE INDEX IF NOT EXISTS idx_program_enrollments_user ON program_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_program ON program_enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_status ON program_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_stripe ON program_enrollments(stripe_payment_intent_id);

-- Enable RLS
ALTER TABLE program_enrollments ENABLE ROW LEVEL SECURITY;

-- Users can view own enrollments
CREATE POLICY "Users can view own program enrollments" ON program_enrollments
  FOR SELECT USING (user_id = auth.uid());

-- System can insert enrollments
CREATE POLICY "System can insert program enrollments" ON program_enrollments
  FOR INSERT WITH CHECK (true);

-- Admins can manage all enrollments
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
-- Tax Prep enrollment mapping (v2 - handles missing columns)
-- Run this instead of 20260210_tax_prep_enrollment_map.sql

-- Step 1: Add missing columns if they don't exist
DO $$
BEGIN
  -- funding_source
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_price_enrollment_map' AND column_name = 'funding_source'
  ) THEN
    ALTER TABLE stripe_price_enrollment_map ADD COLUMN funding_source TEXT DEFAULT 'SELF_PAY';
  END IF;

  -- is_free_enrollment
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_price_enrollment_map' AND column_name = 'is_free_enrollment'
  ) THEN
    ALTER TABLE stripe_price_enrollment_map ADD COLUMN is_free_enrollment BOOLEAN DEFAULT false;
  END IF;

  -- is_deposit
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_price_enrollment_map' AND column_name = 'is_deposit'
  ) THEN
    ALTER TABLE stripe_price_enrollment_map ADD COLUMN is_deposit BOOLEAN DEFAULT false;
  END IF;

  -- auto_enroll
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_price_enrollment_map' AND column_name = 'auto_enroll'
  ) THEN
    ALTER TABLE stripe_price_enrollment_map ADD COLUMN auto_enroll BOOLEAN DEFAULT true;
  END IF;

  -- send_welcome_email
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_price_enrollment_map' AND column_name = 'send_welcome_email'
  ) THEN
    ALTER TABLE stripe_price_enrollment_map ADD COLUMN send_welcome_email BOOLEAN DEFAULT true;
  END IF;

  -- enrollment_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_price_enrollment_map' AND column_name = 'enrollment_type'
  ) THEN
    ALTER TABLE stripe_price_enrollment_map ADD COLUMN enrollment_type TEXT DEFAULT 'program';
  END IF;

  -- description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_price_enrollment_map' AND column_name = 'description'
  ) THEN
    ALTER TABLE stripe_price_enrollment_map ADD COLUMN description TEXT;
  END IF;
END $$;

-- Step 2: Insert tax prep mappings
INSERT INTO stripe_price_enrollment_map (
  stripe_price_id,
  stripe_product_id,
  program_slug,
  enrollment_type,
  funding_source,
  is_deposit,
  is_free_enrollment,
  auto_enroll,
  send_welcome_email,
  description
) VALUES
-- WIOA $0 enrollment
(
  'price_1SzM1VIRNf5vPH3APvgSpKRU',
  'prod_TqEZJ2DSRZccvZ',
  'tax-prep-financial-services',
  'program',
  'WIOA',
  false,
  true,
  true,
  true,
  'Tax Prep & Financial Services - WIOA Funded $0'
),
-- Self-pay full ($4,950)
(
  'price_1SsY60IRNf5vPH3ApAUmWGJ9',
  'prod_TqEZJ2DSRZccvZ',
  'tax-prep-financial-services',
  'program',
  'SELF_PAY',
  false,
  false,
  true,
  true,
  'Tax Prep & Financial Services - Full Payment $4,950'
),
-- Self-pay deposit ($1,650)
(
  'price_1SsY60IRNf5vPH3Adq5Rh9KO',
  'prod_TqEZJ2DSRZccvZ',
  'tax-prep-financial-services',
  'program',
  'SELF_PAY',
  true,
  false,
  true,
  true,
  'Tax Prep & Financial Services - Deposit $1,650'
),
-- Self-pay installment ($825)
(
  'price_1SsY60IRNf5vPH3AbLFjmbm8',
  'prod_TqEZJ2DSRZccvZ',
  'tax-prep-financial-services',
  'program',
  'SELF_PAY',
  true,
  false,
  true,
  true,
  'Tax Prep & Financial Services - Installment $825'
)
ON CONFLICT DO NOTHING;

-- Step 3: Verify
-- Run this after:
-- SELECT stripe_price_id, program_slug, funding_source, is_free_enrollment, description
-- FROM stripe_price_enrollment_map
-- WHERE program_slug = 'tax-prep-financial-services';
-- Tax Prep enrollment mapping — matches live schema exactly
-- Table columns: id, stripe_price_id, program_slug, is_deposit, auto_enroll, description, stripe_product_id

INSERT INTO stripe_price_enrollment_map (
  stripe_price_id,
  stripe_product_id,
  program_slug,
  is_deposit,
  auto_enroll,
  description
) VALUES
-- WIOA $0 enrollment
(
  'price_1SzM1VIRNf5vPH3APvgSpKRU',
  'prod_TqEZJ2DSRZccvZ',
  'tax-prep-financial-services',
  false,
  true,
  'Tax Prep & Financial Services - WIOA Funded $0'
),
-- Self-pay full ($4,950)
(
  'price_1SsY60IRNf5vPH3ApAUmWGJ9',
  'prod_TqEZJ2DSRZccvZ',
  'tax-prep-financial-services',
  false,
  true,
  'Tax Prep & Financial Services - Full Payment $4,950'
),
-- Self-pay deposit ($1,650)
(
  'price_1SsY60IRNf5vPH3Adq5Rh9KO',
  'prod_TqEZJ2DSRZccvZ',
  'tax-prep-financial-services',
  true,
  true,
  'Tax Prep & Financial Services - Deposit $1,650'
),
-- Self-pay installment ($825)
(
  'price_1SsY60IRNf5vPH3AbLFjmbm8',
  'prod_TqEZJ2DSRZccvZ',
  'tax-prep-financial-services',
  true,
  true,
  'Tax Prep & Financial Services - Installment $825'
)
ON CONFLICT DO NOTHING;
-- Create sfc_tax_returns and sfc_tax_documents tables.
-- Used by: lib/integrations/supersonic-tax.ts (Phase A provider)
-- Referenced by: sfc_tax_return_public_status view (20260213_sfc_public_status_view.sql)
--
-- Run this BEFORE the public status view migration.

-- ============================================================
-- sfc_tax_returns
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sfc_tax_returns (
  id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  tracking_id           text UNIQUE NOT NULL,
  public_tracking_code  text UNIQUE,

  -- Source metadata (jotform, manual, system_test, etc.)
  source_system         text,
  source_submission_id  text,

  -- Client info
  taxpayer_name         text,
  client_first_name     text,
  client_last_name      text,
  client_email          text,

  -- Return details
  filing_status         text,
  tax_year              integer DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::integer,
  status                text NOT NULL DEFAULT 'draft',

  -- E-file pipeline
  efile_submission_id   text,
  last_error            text,

  -- Full return payload (JSON blob from intake)
  payload               jsonb,

  -- Timestamps
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

-- Auto-generate public_tracking_code from tracking_id if not set
CREATE OR REPLACE FUNCTION sfc_set_public_tracking_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.public_tracking_code IS NULL THEN
    NEW.public_tracking_code := NEW.tracking_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sfc_set_public_tracking_code ON public.sfc_tax_returns;
CREATE TRIGGER trg_sfc_set_public_tracking_code
  BEFORE INSERT ON public.sfc_tax_returns
  FOR EACH ROW
  EXECUTE FUNCTION sfc_set_public_tracking_code();

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sfc_tax_returns_tracking_id
  ON public.sfc_tax_returns (tracking_id);
CREATE INDEX IF NOT EXISTS idx_sfc_tax_returns_public_tracking_code
  ON public.sfc_tax_returns (public_tracking_code);
CREATE INDEX IF NOT EXISTS idx_sfc_tax_returns_status
  ON public.sfc_tax_returns (status);
CREATE INDEX IF NOT EXISTS idx_sfc_tax_returns_efile_submission_id
  ON public.sfc_tax_returns (efile_submission_id);

-- RLS
ALTER TABLE public.sfc_tax_returns ENABLE ROW LEVEL SECURITY;

-- Service role has full access (used by API routes with service key)
CREATE POLICY sfc_tax_returns_service_all ON public.sfc_tax_returns
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Anon can only read via the view (no direct table access)
-- The view (sfc_tax_return_public_status) has its own GRANT SELECT.

-- ============================================================
-- sfc_tax_documents
-- ============================================================
CREATE TABLE IF NOT EXISTS public.sfc_tax_documents (
  id                    bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  document_id           text UNIQUE NOT NULL,
  return_tracking_id    text NOT NULL REFERENCES public.sfc_tax_returns(tracking_id),
  document_type         text NOT NULL,
  status                text NOT NULL DEFAULT 'uploaded',
  file_path             text,
  metadata              jsonb,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sfc_tax_documents_return_tracking_id
  ON public.sfc_tax_documents (return_tracking_id);

-- RLS
ALTER TABLE public.sfc_tax_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY sfc_tax_documents_service_all ON public.sfc_tax_documents
  FOR ALL
  USING (true)
  WITH CHECK (true);
-- sfc_tax_return_public_status: public-safe view for tracking lookups.
-- ALL masking is done HERE in SQL, not in the API handler.
-- Only columns safe for unauthenticated callers are exposed.
--
-- SECURITY CONTRACT:
--   Any modification to this view requires security review.
--   Do NOT add: user_id, email, phone, notes, internal_status,
--   raw payload fields, document metadata, or internal IDs.

DROP VIEW IF EXISTS sfc_tax_return_public_status;

CREATE VIEW sfc_tax_return_public_status AS
SELECT
  public_tracking_code,

  -- Public-safe status (maps internal statuses to user-facing values)
  CASE status
    WHEN 'draft'             THEN 'received'
    WHEN 'pending_review'    THEN 'processing'
    WHEN 'generating_forms'  THEN 'processing'
    WHEN 'queued_for_efile'  THEN 'processing'
    WHEN 'transmitted'       THEN 'submitted'
    WHEN 'accepted'          THEN 'accepted'
    WHEN 'rejected'          THEN 'action_required'
    ELSE 'received'
  END AS status,

  -- NO efile_submission_id — internal pipeline identifier, not public
  -- NO raw last_error — sanitized rejection reason only
  CASE
    WHEN status = 'rejected' AND last_error ILIKE '%missing%document%'    THEN 'missing_documents'
    WHEN status = 'rejected' AND last_error ILIKE '%verification%'        THEN 'verification_failed'
    WHEN status = 'rejected' AND last_error ILIKE '%ssn%'                 THEN 'identity_mismatch'
    WHEN status = 'rejected' AND last_error ILIKE '%duplicate%'           THEN 'duplicate_filing'
    WHEN status = 'rejected' AND last_error IS NOT NULL                   THEN 'review_required'
    ELSE NULL
  END AS rejection_reason,

  created_at,
  updated_at,

  -- First name only (no full last name exposed)
  client_first_name,
  -- Last initial only — masking enforced in SQL, not application code
  LEFT(client_last_name, 1) AS client_last_initial

FROM sfc_tax_returns
WHERE public_tracking_code IS NOT NULL;

-- Revoke all, then grant SELECT to anon so the endpoint can use the anon key
-- instead of the service role key (defense in depth).
REVOKE ALL ON sfc_tax_return_public_status FROM anon, authenticated;
GRANT SELECT ON sfc_tax_return_public_status TO anon;
GRANT SELECT ON sfc_tax_return_public_status TO authenticated;

COMMENT ON VIEW sfc_tax_return_public_status IS
  'Public-safe view for refund tracking. '
  'Exposes: public_tracking_code, mapped status, sanitized rejection_reason, '
  'timestamps, first name, last initial only. '
  'Does NOT expose: efile_submission_id, user_id, email, phone, notes, '
  'raw last_error, internal statuses, document metadata, or payload fields. '
  'ANY modification requires security review.';
