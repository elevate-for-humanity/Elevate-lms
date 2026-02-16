-- Creator Marketplace Tables
-- Enables multi-vendor digital product sales with revenue splits

-- Marketplace Creators (approved sellers)
CREATE TABLE IF NOT EXISTS marketplace_creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  bio TEXT,
  payout_method TEXT, -- 'ach', 'paypal', 'zelle', 'stripe_connect'
  payout_email TEXT,
  revenue_split NUMERIC DEFAULT 0.7, -- 70% creator, 30% platform
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'suspended'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Marketplace Products (creator-uploaded digital products)
CREATE TABLE IF NOT EXISTS marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID REFERENCES marketplace_creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL CHECK (price_cents > 0),
  stripe_price_id TEXT,
  file_url TEXT,
  thumbnail_url TEXT,
  category TEXT,
  status TEXT DEFAULT 'draft', -- 'draft', 'pending_review', 'approved', 'rejected', 'archived'
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Marketplace Sales (transaction records with revenue splits)
CREATE TABLE IF NOT EXISTS marketplace_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES marketplace_products(id),
  creator_id UUID REFERENCES marketplace_creators(id),
  buyer_email TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  creator_earnings_cents INTEGER NOT NULL,
  platform_earnings_cents INTEGER NOT NULL,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  download_token TEXT UNIQUE,
  download_expires_at TIMESTAMPTZ,
  paid_out BOOLEAN DEFAULT FALSE,
  payout_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_marketplace_creators_user ON marketplace_creators(user_id);
CREATE INDEX idx_marketplace_creators_status ON marketplace_creators(status);
CREATE INDEX idx_marketplace_products_creator ON marketplace_products(creator_id);
CREATE INDEX idx_marketplace_products_status ON marketplace_products(status);
CREATE INDEX idx_marketplace_sales_creator ON marketplace_sales(creator_id);
CREATE INDEX idx_marketplace_sales_product ON marketplace_sales(product_id);
CREATE INDEX idx_marketplace_sales_session ON marketplace_sales(stripe_session_id);
CREATE INDEX idx_marketplace_sales_token ON marketplace_sales(download_token);
CREATE INDEX idx_marketplace_sales_paidout ON marketplace_sales(paid_out);

-- Updated timestamp triggers
CREATE OR REPLACE FUNCTION update_marketplace_creators_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_marketplace_creators_updated_at
  BEFORE UPDATE ON marketplace_creators
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_creators_updated_at();

CREATE OR REPLACE FUNCTION update_marketplace_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_marketplace_products_updated_at
  BEFORE UPDATE ON marketplace_products
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_products_updated_at();

-- RLS Policies
ALTER TABLE marketplace_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_sales ENABLE ROW LEVEL SECURITY;

-- Creators: users can view approved creators
CREATE POLICY "Anyone can view approved creators" ON marketplace_creators
  FOR SELECT USING (status = 'approved');

-- Creators: users can view/edit their own creator profile
CREATE POLICY "Users can manage own creator profile" ON marketplace_creators
  FOR ALL USING (user_id = auth.uid());

-- Products: anyone can view approved products
CREATE POLICY "Anyone can view approved products" ON marketplace_products
  FOR SELECT USING (status = 'approved');

-- Products: creators can manage their own products
CREATE POLICY "Creators can manage own products" ON marketplace_products
  FOR ALL USING (
    creator_id IN (
      SELECT id FROM marketplace_creators WHERE user_id = auth.uid()
    )
  );

-- Sales: webhook can insert
CREATE POLICY "Allow webhook inserts" ON marketplace_sales
  FOR INSERT WITH CHECK (true);

-- Sales: creators can view their own sales
CREATE POLICY "Creators can view own sales" ON marketplace_sales
  FOR SELECT USING (
    creator_id IN (
      SELECT id FROM marketplace_creators WHERE user_id = auth.uid()
    )
  );

-- Sales: buyers can view their purchases via download token (public access)
CREATE POLICY "Buyers can access via download token" ON marketplace_sales
  FOR SELECT USING (download_token IS NOT NULL);
