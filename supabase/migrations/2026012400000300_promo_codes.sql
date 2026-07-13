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
  promo_code_id UUID,
  user_id UUID REFERENCES auth.users(id),
  email TEXT,
  order_id TEXT,
  discount_amount DECIMAL(10,2) NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS code TEXT;
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
ALTER TABLE promo_codes ADD COLUMN IF NOT EXISTS is_active TEXT;
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);
ALTER TABLE promo_code_uses ADD COLUMN IF NOT EXISTS promo_code_id TEXT;
CREATE INDEX IF NOT EXISTS idx_promo_code_uses_code ON promo_code_uses(promo_code_id);
ALTER TABLE promo_code_uses ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_promo_code_uses_user ON promo_code_uses(user_id);

-- Enable RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_uses ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "promo_codes_select" ON promo_codes;
CREATE POLICY "promo_codes_select" ON promo_codes
  FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "promo_codes_admin" ON promo_codes;
CREATE POLICY "promo_codes_admin" ON promo_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "promo_code_uses_insert" ON promo_code_uses;
CREATE POLICY "promo_code_uses_insert" ON promo_code_uses
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "promo_code_uses_select" ON promo_code_uses;
CREATE POLICY "promo_code_uses_select" ON promo_code_uses
  FOR SELECT USING (user_id = auth.uid());

-- Insert some starter promo codes
INSERT INTO promo_codes (code, description, discount_type, discount_value, max_uses, valid_until, applies_to) VALUES
('LAUNCH20', 'Launch discount - 20% off', 'percentage', 20.00, 100, NOW() + INTERVAL '90 days', 'career_courses'),
('FIRST50', 'First purchase - $50 off', 'fixed', 50.00, 50, NOW() + INTERVAL '60 days', 'career_courses'),
('BUNDLE100', 'Bundle special - $100 off bundle', 'fixed', 100.00, NULL, NOW() + INTERVAL '30 days', 'career_courses'),
('STUDENT25', 'Student discount - 25% off', 'percentage', 25.00, NULL, NULL, 'all')
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- DONE!
-- =====================================================
