-- Store Products and Cart Tables (APPLIED)
-- This migration has been applied to production

DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS products CASCADE;

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  type VARCHAR(50) DEFAULT 'digital',
  category VARCHAR(100),
  image_url TEXT,
  stripe_price_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'pending',
  total DECIMAL(10,2) DEFAULT 0,
  stripe_session_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  product_name VARCHAR(255) NOT NULL,
  product_price DECIMAL(10,2) NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public products" ON products FOR SELECT USING (true);
CREATE POLICY "Own cart" ON cart_items FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own orders" ON orders FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Own order items" ON order_items FOR SELECT USING (
  order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
);

INSERT INTO products (name, slug, description, price, type, category, is_active) VALUES
  ('LMS Starter License', 'lms-starter', 'For individual instructors.', 299, 'license', 'platform', true),
  ('LMS Professional License', 'lms-professional', 'For growing organizations.', 799, 'license', 'platform', true),
  ('LMS Enterprise License', 'lms-enterprise', 'Full platform access.', 2499, 'license', 'platform', true),
  ('Microsoft Office Specialist', 'microsoft-office-specialist', 'Microsoft Office certification.', 149, 'course', 'certification', true),
  ('CompTIA A+ Certification', 'comptia-a-plus', 'Entry-level IT certification.', 249, 'course', 'certification', true),
  ('OSHA 10-Hour Safety', 'osha-10-hour', '10-hour safety training.', 89, 'course', 'safety', true),
  ('OSHA 30-Hour Safety', 'osha-30-hour', '30-hour safety training.', 189, 'course', 'safety', true);
