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

ALTER TABLE search_index ADD COLUMN IF NOT EXISTS category TEXT;
CREATE INDEX IF NOT EXISTS idx_search_index_category ON search_index(category);
ALTER TABLE search_index ADD COLUMN IF NOT EXISTS is_active TEXT;
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

ALTER TABLE store_cards ADD COLUMN IF NOT EXISTS tier TEXT;
CREATE INDEX IF NOT EXISTS idx_store_cards_tier ON store_cards(tier);
ALTER TABLE store_cards ADD COLUMN IF NOT EXISTS is_active TEXT;
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

ALTER TABLE guide_messages ADD COLUMN IF NOT EXISTS page_id TEXT;
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

ALTER TABLE product_recommendations ADD COLUMN IF NOT EXISTS source_product_id TEXT;
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

ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS product_id UUID;
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
DROP POLICY IF EXISTS "Public read store_cards" ON store_cards;
CREATE POLICY "Public read store_cards" ON store_cards FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Public read page_guides" ON page_guides;
CREATE POLICY "Public read page_guides" ON page_guides FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Public read guide_messages" ON guide_messages;
CREATE POLICY "Public read guide_messages" ON guide_messages FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Public read recommendations" ON product_recommendations;
CREATE POLICY "Public read recommendations" ON product_recommendations FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Public read sales_messages" ON avatar_sales_messages;
CREATE POLICY "Public read sales_messages" ON avatar_sales_messages FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Public read categories" ON product_categories;
CREATE POLICY "Public read categories" ON product_categories FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Public read coupons" ON coupons;
CREATE POLICY "Public read coupons" ON coupons FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "Public read reviews" ON product_reviews;
CREATE POLICY "Public read reviews" ON product_reviews FOR SELECT USING (is_approved = true);

-- Done
SELECT 'Migration complete: Store guide and e-commerce tables created with seed data' as status;
