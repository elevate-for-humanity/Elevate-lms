-- Migration: Add missing product_images and product_variants tables for store functionality
-- Fixes PGRST200 error: Could not find a relationship between products and product_images

-- ============================================
-- PRODUCT IMAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary BOOLEAN DEFAULT false,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON public.product_images(product_id);
CREATE INDEX IF NOT EXISTS idx_product_images_sort_order ON public.product_images(sort_order);

-- ============================================
-- PRODUCT VARIANTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  price NUMERIC DEFAULT 0,
  compare_price NUMERIC,
  inventory_quantity INTEGER DEFAULT 0,
  track_inventory BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  attributes JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);

-- ============================================
-- ENABLE RLS (Row Level Security)
-- ============================================
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES FOR product_images
-- ============================================
CREATE POLICY "Allow read access to product images"
  ON public.product_images FOR SELECT
  USING (true);

CREATE POLICY "Allow admin insert product images"
  ON public.product_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = current_setting('request.jwt.claims', true)::json->>'user_id'
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Allow admin update product images"
  ON public.product_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = current_setting('request.jwt.claims', true)::json->>'user_id'
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Allow admin delete product images"
  ON public.product_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = current_setting('request.jwt.claims', true)::json->>'user_id'
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- ============================================
-- RLS POLICIES FOR product_variants
-- ============================================
CREATE POLICY "Allow read access to product variants"
  ON public.product_variants FOR SELECT
  USING (true);

CREATE POLICY "Allow admin insert product variants"
  ON public.product_variants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = current_setting('request.jwt.claims', true)::json->>'user_id'
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Allow admin update product variants"
  ON public.product_variants FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = current_setting('request.jwt.claims', true)::json->>'user_id'
      AND profiles.role IN ('admin', 'staff')
    )
  );

CREATE POLICY "Allow admin delete product variants"
  ON public.product_variants FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = current_setting('request.jwt.claims', true)::json->>'user_id'
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- ============================================
-- NOTIFY SCHEMA CACHE REFRESH
-- ============================================
NOTIFY pgrst, 'reload schema';
