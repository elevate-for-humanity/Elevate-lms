-- Shop Products Table
CREATE TABLE IF NOT EXISTS shop_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  sale_price DECIMAL(10,2) CHECK (sale_price >= 0),
  category VARCHAR(100) NOT NULL,
  image_url TEXT,
  images TEXT[], -- Array of additional image URLs
  stock_quantity INTEGER DEFAULT 0,
  sku VARCHAR(100) UNIQUE,
  rating DECIMAL(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shop Categories
CREATE TABLE IF NOT EXISTS shop_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  parent_id UUID REFERENCES shop_categories(id),
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Help Articles Table
CREATE TABLE IF NOT EXISTS help_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  category VARCHAR(100) NOT NULL,
  category_slug VARCHAR(100) NOT NULL,
  read_time_minutes INTEGER DEFAULT 5,
  view_count INTEGER DEFAULT 0,
  helpful_yes INTEGER DEFAULT 0,
  helpful_no INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  meta_title VARCHAR(255),
  meta_description TEXT,
  author_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Help Categories
CREATE TABLE IF NOT EXISTS help_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  article_count INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Marketplace Courses (creator-submitted courses)
CREATE TABLE IF NOT EXISTS marketplace_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  short_description TEXT,
  creator_id UUID NOT NULL REFERENCES auth.users(id),
  creator_name VARCHAR(255),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  sale_price DECIMAL(10,2) CHECK (sale_price >= 0),
  category VARCHAR(100) NOT NULL,
  level VARCHAR(50) DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  duration_hours DECIMAL(5,1),
  image_url TEXT,
  preview_video_url TEXT,
  rating DECIMAL(2,1) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0,
  student_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  meta_title VARCHAR(255),
  meta_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_shop_products_category ON shop_products(category);
CREATE INDEX IF NOT EXISTS idx_shop_products_active ON shop_products(is_active);
CREATE INDEX IF NOT EXISTS idx_shop_products_slug ON shop_products(slug);

CREATE INDEX IF NOT EXISTS idx_help_articles_category ON help_articles(category_slug);
CREATE INDEX IF NOT EXISTS idx_help_articles_published ON help_articles(is_published);
CREATE INDEX IF NOT EXISTS idx_help_articles_slug ON help_articles(slug);

CREATE INDEX IF NOT EXISTS idx_marketplace_courses_category ON marketplace_courses(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_courses_creator ON marketplace_courses(creator_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_courses_published ON marketplace_courses(is_published, is_approved);
CREATE INDEX IF NOT EXISTS idx_marketplace_courses_slug ON marketplace_courses(slug);

-- Enable RLS
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE help_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_courses ENABLE ROW LEVEL SECURITY;

-- Public read access for shop products
CREATE POLICY "Public can view active products" ON shop_products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Public can view active categories" ON shop_categories
  FOR SELECT USING (is_active = true);

-- Public read access for help articles
CREATE POLICY "Public can view published articles" ON help_articles
  FOR SELECT USING (is_published = true);

CREATE POLICY "Public can view active help categories" ON help_categories
  FOR SELECT USING (is_active = true);

-- Public read access for approved marketplace courses
CREATE POLICY "Public can view approved courses" ON marketplace_courses
  FOR SELECT USING (is_published = true AND is_approved = true);

-- Creators can manage their own courses
CREATE POLICY "Creators can view own courses" ON marketplace_courses
  FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Creators can insert own courses" ON marketplace_courses
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update own courses" ON marketplace_courses
  FOR UPDATE USING (auth.uid() = creator_id);

-- Admin policies
CREATE POLICY "Admins can manage products" ON shop_products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Admins can manage help articles" ON help_articles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Admins can manage marketplace courses" ON marketplace_courses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- Seed initial help categories
INSERT INTO help_categories (name, slug, description, icon, sort_order) VALUES
  ('Getting Started', 'getting-started', 'Learn the basics of using Elevate', 'rocket', 1),
  ('Account & Billing', 'account-billing', 'Manage your account and payments', 'credit-card', 2),
  ('Courses & Learning', 'courses-learning', 'Everything about courses and learning', 'book-open', 3),
  ('Technical Support', 'technical-support', 'Troubleshooting and technical help', 'wrench', 4),
  ('Certifications', 'certifications', 'Certification exams and credentials', 'award', 5),
  ('Career Services', 'career-services', 'Job placement and career support', 'briefcase', 6)
ON CONFLICT (slug) DO NOTHING;

-- Seed initial shop categories
INSERT INTO shop_categories (name, slug, description, sort_order) VALUES
  ('Tools', 'tools', 'Professional tools and equipment', 1),
  ('Apparel', 'apparel', 'Uniforms, scrubs, and branded clothing', 2),
  ('Books', 'books', 'Study guides and textbooks', 3),
  ('Safety', 'safety', 'Safety equipment and PPE', 4),
  ('Accessories', 'accessories', 'Additional supplies and accessories', 5)
ON CONFLICT (slug) DO NOTHING;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_shop_products_updated_at ON shop_products;
CREATE TRIGGER update_shop_products_updated_at
  BEFORE UPDATE ON shop_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_help_articles_updated_at ON help_articles;
CREATE TRIGGER update_help_articles_updated_at
  BEFORE UPDATE ON help_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_marketplace_courses_updated_at ON marketplace_courses;
CREATE TRIGGER update_marketplace_courses_updated_at
  BEFORE UPDATE ON marketplace_courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
