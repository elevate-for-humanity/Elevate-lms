-- Creator, Delegate, and Shop Role Schema
-- For Skool-like community learning system on elevateforhumanity.org

-- ============================================================================
-- CREATOR TABLES (Content Creators)
-- ============================================================================

-- Creator profiles (extends profiles table)
CREATE TABLE IF NOT EXISTS creator_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  bio text,
  website_url text,
  social_links jsonb DEFAULT '{}',
  total_students integer DEFAULT 0,
  total_revenue numeric(10,2) DEFAULT 0,
  commission_rate numeric(5,2) DEFAULT 70.00, -- 70% to creator, 30% platform fee
  payout_email text,
  verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Creator courses (separate from main courses for marketplace)
CREATE TABLE IF NOT EXISTS creator_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES creator_profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  thumbnail_url text,
  price numeric(10,2) DEFAULT 0,
  is_free boolean DEFAULT false,
  status text DEFAULT 'draft', -- draft, published, archived
  category text,
  difficulty text, -- beginner, intermediate, advanced
  duration_hours integer,
  total_lessons integer DEFAULT 0,
  total_enrollments integer DEFAULT 0,
  average_rating numeric(3,2) DEFAULT 0,
  total_reviews integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Creator course lessons
CREATE TABLE IF NOT EXISTS creator_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES creator_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  content text,
  video_url text,
  duration_minutes integer,
  order_index integer NOT NULL,
  is_preview boolean DEFAULT false, -- Free preview lesson
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Creator course enrollments
CREATE TABLE IF NOT EXISTS creator_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES creator_courses(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  progress_percent integer DEFAULT 0,
  completed_lessons integer DEFAULT 0,
  last_accessed_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(course_id, user_id)
);

-- Creator earnings
CREATE TABLE IF NOT EXISTS creator_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid REFERENCES creator_profiles(id) ON DELETE CASCADE,
  course_id uuid REFERENCES creator_courses(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES creator_enrollments(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  platform_fee numeric(10,2) NOT NULL,
  creator_payout numeric(10,2) NOT NULL,
  status text DEFAULT 'pending', -- pending, paid, refunded
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- DELEGATE TABLES (Community Moderators)
-- ============================================================================

-- Delegate profiles (extends profiles table)
CREATE TABLE IF NOT EXISTS delegate_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  permissions jsonb DEFAULT '{"approve_members": true, "moderate_content": true, "manage_reports": true}',
  total_approvals integer DEFAULT 0,
  total_moderations integer DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Member applications (for delegate approval)
CREATE TABLE IF NOT EXISTS member_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  application_type text NOT NULL, -- student, instructor, partner
  full_name text NOT NULL,
  email text NOT NULL,
  phone text,
  reason text,
  status text DEFAULT 'pending', -- pending, approved, rejected
  reviewed_by uuid REFERENCES delegate_profiles(id),
  reviewed_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Content reports (flagged by users, reviewed by delegates)
CREATE TABLE IF NOT EXISTS content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reported_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  content_type text NOT NULL, -- post, comment, course, user
  content_id uuid NOT NULL,
  reason text NOT NULL,
  description text,
  status text DEFAULT 'pending', -- pending, reviewing, resolved, dismissed
  reviewed_by uuid REFERENCES delegate_profiles(id),
  reviewed_at timestamptz,
  action_taken text, -- removed, warned, no_action
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Moderation actions log
CREATE TABLE IF NOT EXISTS moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delegate_id uuid REFERENCES delegate_profiles(id) ON DELETE CASCADE,
  action_type text NOT NULL, -- approve, reject, remove, warn, ban
  target_type text NOT NULL, -- user, content, application
  target_id uuid NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- SHOP TABLES (Marketplace Sellers)
-- ============================================================================

-- Shop profiles (extends profiles table)
CREATE TABLE IF NOT EXISTS shop_profiles (
  id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  shop_name text NOT NULL,
  description text,
  logo_url text,
  banner_url text,
  total_products integer DEFAULT 0,
  total_sales integer DEFAULT 0,
  total_revenue numeric(10,2) DEFAULT 0,
  commission_rate numeric(5,2) DEFAULT 85.00, -- 85% to shop, 15% platform fee
  payout_email text,
  verified boolean DEFAULT false,
  rating numeric(3,2) DEFAULT 0,
  total_reviews integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Shop products
CREATE TABLE IF NOT EXISTS shop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES shop_profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL,
  compare_at_price numeric(10,2), -- Original price for discounts
  category text,
  tags text[],
  images jsonb DEFAULT '[]',
  inventory_count integer DEFAULT 0,
  track_inventory boolean DEFAULT true,
  status text DEFAULT 'draft', -- draft, active, archived
  total_sales integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Shop orders
CREATE TABLE IF NOT EXISTS shop_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES shop_profiles(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  order_number text UNIQUE NOT NULL,
  status text DEFAULT 'pending', -- pending, processing, shipped, delivered, cancelled
  subtotal numeric(10,2) NOT NULL,
  tax numeric(10,2) DEFAULT 0,
  shipping numeric(10,2) DEFAULT 0,
  total numeric(10,2) NOT NULL,
  shipping_address jsonb,
  tracking_number text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Shop order items
CREATE TABLE IF NOT EXISTS shop_order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES shop_orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES shop_products(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  price numeric(10,2) NOT NULL,
  total numeric(10,2) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Shop earnings
CREATE TABLE IF NOT EXISTS shop_earnings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid REFERENCES shop_profiles(id) ON DELETE CASCADE,
  order_id uuid REFERENCES shop_orders(id) ON DELETE CASCADE,
  amount numeric(10,2) NOT NULL,
  platform_fee numeric(10,2) NOT NULL,
  shop_payout numeric(10,2) NOT NULL,
  status text DEFAULT 'pending', -- pending, paid, refunded
  paid_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Creator indexes
CREATE INDEX IF NOT EXISTS idx_creator_courses_creator ON creator_courses(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_courses_status ON creator_courses(status);
CREATE INDEX IF NOT EXISTS idx_creator_lessons_course ON creator_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_creator_enrollments_user ON creator_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_enrollments_course ON creator_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_creator ON creator_earnings(creator_id);

-- Delegate indexes
CREATE INDEX IF NOT EXISTS idx_member_applications_status ON member_applications(status);
CREATE INDEX IF NOT EXISTS idx_member_applications_reviewer ON member_applications(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_content_reports_status ON content_reports(status);
CREATE INDEX IF NOT EXISTS idx_content_reports_reviewer ON content_reports(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_moderation_actions_delegate ON moderation_actions(delegate_id);

-- Shop indexes
CREATE INDEX IF NOT EXISTS idx_shop_products_shop ON shop_products(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_products_status ON shop_products(status);
CREATE INDEX IF NOT EXISTS idx_shop_orders_shop ON shop_orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_customer ON shop_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON shop_orders(status);
CREATE INDEX IF NOT EXISTS idx_shop_order_items_order ON shop_order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_shop_earnings_shop ON shop_earnings(shop_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Creator policies
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY creator_own_profile ON creator_profiles FOR ALL USING (id = auth.uid());
CREATE POLICY creator_own_courses ON creator_courses FOR ALL USING (creator_id = auth.uid());
CREATE POLICY creator_own_lessons ON creator_lessons FOR ALL USING (
  course_id IN (SELECT id FROM creator_courses WHERE creator_id = auth.uid())
);
CREATE POLICY creator_view_enrollments ON creator_enrollments FOR SELECT USING (
  course_id IN (SELECT id FROM creator_courses WHERE creator_id = auth.uid())
);
CREATE POLICY creator_view_earnings ON creator_earnings FOR SELECT USING (creator_id = auth.uid());

-- Public can view published courses
CREATE POLICY public_view_published_courses ON creator_courses FOR SELECT USING (status = 'published');
CREATE POLICY public_view_published_lessons ON creator_lessons FOR SELECT USING (
  course_id IN (SELECT id FROM creator_courses WHERE status = 'published')
);

-- Delegate policies
ALTER TABLE delegate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY delegate_own_profile ON delegate_profiles FOR ALL USING (id = auth.uid());
CREATE POLICY delegate_view_applications ON member_applications FOR ALL USING (
  EXISTS (SELECT 1 FROM delegate_profiles WHERE id = auth.uid() AND active = true)
);
CREATE POLICY delegate_view_reports ON content_reports FOR ALL USING (
  EXISTS (SELECT 1 FROM delegate_profiles WHERE id = auth.uid() AND active = true)
);
CREATE POLICY delegate_view_actions ON moderation_actions FOR SELECT USING (delegate_id = auth.uid());

-- Shop policies
ALTER TABLE shop_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY shop_own_profile ON shop_profiles FOR ALL USING (id = auth.uid());
CREATE POLICY shop_own_products ON shop_products FOR ALL USING (shop_id = auth.uid());
CREATE POLICY shop_own_orders ON shop_orders FOR ALL USING (shop_id = auth.uid());
CREATE POLICY shop_view_earnings ON shop_earnings FOR SELECT USING (shop_id = auth.uid());

-- Public can view active products
CREATE POLICY public_view_active_products ON shop_products FOR SELECT USING (status = 'active');

-- Customers can view their orders
CREATE POLICY customer_view_orders ON shop_orders FOR SELECT USING (customer_id = auth.uid());

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Update creator stats
CREATE OR REPLACE FUNCTION update_creator_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE creator_profiles
  SET 
    total_students = (
      SELECT COUNT(DISTINCT user_id)
      FROM creator_enrollments ce
      JOIN creator_courses cc ON ce.course_id = cc.id
      WHERE cc.creator_id = NEW.creator_id
    ),
    updated_at = now()
  WHERE id = NEW.creator_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_creator_stats_trigger
AFTER INSERT ON creator_enrollments
FOR EACH ROW EXECUTE FUNCTION update_creator_stats();

-- Update shop stats
CREATE OR REPLACE FUNCTION update_shop_stats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE shop_profiles
  SET 
    total_sales = (SELECT COUNT(*) FROM shop_orders WHERE shop_id = NEW.shop_id AND status = 'delivered'),
    total_revenue = (SELECT COALESCE(SUM(total), 0) FROM shop_orders WHERE shop_id = NEW.shop_id AND status = 'delivered'),
    updated_at = now()
  WHERE id = NEW.shop_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_shop_stats_trigger
AFTER INSERT OR UPDATE ON shop_orders
FOR EACH ROW EXECUTE FUNCTION update_shop_stats();

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE creator_profiles IS 'Content creators who build and sell courses';
COMMENT ON TABLE creator_courses IS 'Courses created by creators for the marketplace';
COMMENT ON TABLE delegate_profiles IS 'Community moderators who approve members and moderate content';
COMMENT ON TABLE member_applications IS 'Applications for new members requiring delegate approval';
COMMENT ON TABLE shop_profiles IS 'Shop owners who sell products on the marketplace';
COMMENT ON TABLE shop_products IS 'Products sold by shops';
COMMENT ON TABLE shop_orders IS 'Customer orders from shops';
