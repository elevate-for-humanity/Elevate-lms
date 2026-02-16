-- ============================================================
-- FIX RLS POLICIES AND SCHEMA MISMATCHES
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. ADD MISSING COLUMNS TO shop_products
-- ============================================================
ALTER TABLE shop_products 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- 2. ADD MISSING COLUMNS TO testimonials
-- ============================================================
ALTER TABLE testimonials
ADD COLUMN IF NOT EXISTS quote TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Copy content to quote if quote is empty
UPDATE testimonials SET quote = content WHERE quote IS NULL AND content IS NOT NULL;

-- 3. FIX RLS POLICIES - Allow public read access
-- ============================================================

-- shop_products: Allow anyone to read active products
DROP POLICY IF EXISTS "Public can view active products" ON shop_products;
CREATE POLICY "Public can view active products" ON shop_products
  FOR SELECT
  USING (is_active = true);

-- blog_posts: Allow anyone to read published posts
DROP POLICY IF EXISTS "Public can view published posts" ON blog_posts;
CREATE POLICY "Public can view published posts" ON blog_posts
  FOR SELECT
  USING (published = true);

-- testimonials: Allow anyone to read testimonials
DROP POLICY IF EXISTS "Public can view testimonials" ON testimonials;
CREATE POLICY "Public can view testimonials" ON testimonials
  FOR SELECT
  USING (true);

-- achievements: Allow anyone to read achievements
DROP POLICY IF EXISTS "Public can view achievements" ON achievements;
CREATE POLICY "Public can view achievements" ON achievements
  FOR SELECT
  USING (true);

-- 4. CREATE partners TABLE IF NOT EXISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  partner_type TEXT DEFAULT 'employer',
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on partners
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active partners" ON partners;
CREATE POLICY "Public can view active partners" ON partners
  FOR SELECT
  USING (is_active = true);

-- 5. ENSURE RLS IS ENABLED ON ALL TABLES
-- ============================================================
ALTER TABLE shop_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

-- 6. ADD DEFAULT IMAGES TO PRODUCTS WITHOUT THEM
-- ============================================================
UPDATE shop_products 
SET image_url = 'https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&w=400'
WHERE image_url IS NULL;

-- 7. GRANT USAGE TO anon AND authenticated ROLES
-- ============================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON shop_products TO anon, authenticated;
GRANT SELECT ON blog_posts TO anon, authenticated;
GRANT SELECT ON testimonials TO anon, authenticated;
GRANT SELECT ON achievements TO anon, authenticated;
GRANT SELECT ON partners TO anon, authenticated;
GRANT SELECT ON programs TO anon, authenticated;
GRANT SELECT ON courses TO anon, authenticated;
GRANT SELECT ON lessons TO anon, authenticated;

-- ============================================================
-- DONE - Verify with:
-- SELECT * FROM shop_products LIMIT 5;
-- SELECT * FROM blog_posts WHERE published = true LIMIT 5;
-- ============================================================
