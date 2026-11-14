-- Meri-Go-Round Products for Curvature Body Sculpting
-- Wellness products: Teas, Butters, Oils, Soaps

-- Insert Meri-Go-Round product categories
INSERT INTO products (name, slug, description, price, type, category, image_url, is_active) VALUES
  -- Teas
  ('Meri-Go-Round Calm Blend Tea', 'mgr-calm-blend-tea', 'Soothing herbal blend with chamomile, lavender, and passionflower for relaxation and stress relief.', 18.99, 'physical', 'teas', '/images/products/mgr-calm-tea.jpg', true),
  ('Meri-Go-Round Detox Tea', 'mgr-detox-tea', 'Cleansing blend with dandelion root, ginger, and lemon to support natural detoxification.', 16.99, 'physical', 'teas', '/images/products/mgr-detox-tea.jpg', true),
  ('Meri-Go-Round Sleep Tea', 'mgr-sleep-tea', 'Nighttime blend with valerian root, chamomile, and mint for restful sleep.', 17.99, 'physical', 'teas', '/images/products/mgr-sleep-tea.jpg', true),
  ('Meri-Go-Round Energy Tea', 'mgr-energy-tea', 'Invigorating blend with green tea, ginseng, and citrus for natural energy boost.', 18.99, 'physical', 'teas', '/images/products/mgr-energy-tea.jpg', true),
  ('Meri-Go-Round Immunity Tea', 'mgr-immunity-tea', 'Immune-boosting blend with elderberry, echinacea, and vitamin C-rich herbs.', 19.99, 'physical', 'teas', '/images/products/mgr-immunity-tea.jpg', true),
  
  -- Body Butters
  ('Meri-Go-Round Shea Body Butter', 'mgr-shea-body-butter', 'Rich, creamy shea butter infused with lavender for deep moisturizing and skin nourishment.', 24.99, 'physical', 'butters', '/images/products/mgr-shea-butter.jpg', true),
  ('Meri-Go-Round Cocoa Body Butter', 'mgr-cocoa-body-butter', 'Luxurious cocoa butter blend for intense hydration and a subtle chocolate scent.', 26.99, 'physical', 'butters', '/images/products/mgr-cocoa-butter.jpg', true),
  ('Meri-Go-Round Mango Body Butter', 'mgr-mango-body-butter', 'Tropical mango butter with vitamin E for soft, glowing skin.', 24.99, 'physical', 'butters', '/images/products/mgr-mango-butter.jpg', true),
  ('Meri-Go-Round Whipped Body Butter', 'mgr-whipped-body-butter', 'Light, whipped formula with shea, cocoa, and coconut oils for everyday moisture.', 22.99, 'physical', 'butters', '/images/products/mgr-whipped-butter.jpg', true),
  ('Meri-Go-Round Healing Body Butter', 'mgr-healing-body-butter', 'Therapeutic blend with tea tree and eucalyptus for dry, irritated skin.', 28.99, 'physical', 'butters', '/images/products/mgr-healing-butter.jpg', true),
  
  -- Essential Oils
  ('Meri-Go-Round Lavender Essential Oil', 'mgr-lavender-oil', 'Pure lavender essential oil for relaxation, sleep support, and aromatherapy.', 14.99, 'physical', 'oils', '/images/products/mgr-lavender-oil.jpg', true),
  ('Meri-Go-Round Eucalyptus Essential Oil', 'mgr-eucalyptus-oil', 'Refreshing eucalyptus oil for respiratory support and mental clarity.', 12.99, 'physical', 'oils', '/images/products/mgr-eucalyptus-oil.jpg', true),
  ('Meri-Go-Round Peppermint Essential Oil', 'mgr-peppermint-oil', 'Invigorating peppermint oil for energy, focus, and headache relief.', 13.99, 'physical', 'oils', '/images/products/mgr-peppermint-oil.jpg', true),
  ('Meri-Go-Round Relaxation Massage Oil', 'mgr-massage-oil', 'Blend of sweet almond, jojoba, and essential oils for soothing massage therapy.', 19.99, 'physical', 'oils', '/images/products/mgr-massage-oil.jpg', true),
  ('Meri-Go-Round Glow Body Oil', 'mgr-glow-body-oil', 'Lightweight body oil with rosehip and vitamin E for radiant, hydrated skin.', 21.99, 'physical', 'oils', '/images/products/mgr-glow-oil.jpg', true),
  ('Meri-Go-Round Essential Oil Set', 'mgr-essential-oil-set', 'Collection of 6 essential oils: lavender, eucalyptus, peppermint, tea tree, lemon, and orange.', 44.99, 'physical', 'oils', '/images/products/mgr-oil-set.jpg', true),
  
  -- Soaps
  ('Meri-Go-Round Lavender Bar Soap', 'mgr-lavender-soap', 'Handcrafted soap with lavender essential oil and shea butter for gentle cleansing.', 8.99, 'physical', 'soaps', '/images/products/mgr-lavender-soap.jpg', true),
  ('Meri-Go-Round Activated Charcoal Soap', 'mgr-charcoal-soap', 'Detoxifying charcoal soap to draw out impurities and deep clean pores.', 9.99, 'physical', 'soaps', '/images/products/mgr-charcoal-soap.jpg', true),
  ('Meri-Go-Round Oatmeal Honey Soap', 'mgr-oatmeal-soap', 'Gentle exfoliating soap with colloidal oatmeal and raw honey for sensitive skin.', 8.99, 'physical', 'soaps', '/images/products/mgr-oatmeal-soap.jpg', true),
  ('Meri-Go-Round Tea Tree Soap', 'mgr-teatree-soap', 'Antibacterial tea tree soap for acne-prone and oily skin.', 9.99, 'physical', 'soaps', '/images/products/mgr-teatree-soap.jpg', true),
  ('Meri-Go-Round Rose Petal Soap', 'mgr-rose-soap', 'Luxurious rose-scented soap with rose petals and moisturizing oils.', 10.99, 'physical', 'soaps', '/images/products/mgr-rose-soap.jpg', true),
  ('Meri-Go-Round Soap Gift Set', 'mgr-soap-gift-set', 'Collection of 4 handcrafted soaps in a beautiful gift box. Perfect for gifting.', 32.99, 'physical', 'soaps', '/images/products/mgr-soap-set.jpg', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  type = EXCLUDED.type,
  category = EXCLUDED.category,
  image_url = EXCLUDED.image_url,
  is_active = EXCLUDED.is_active;

-- Curvature Body Sculpting Services (for booking)
CREATE TABLE IF NOT EXISTS curvature_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO curvature_services (name, slug, description, duration_minutes, price, category, is_active) VALUES
  ('Free Consultation', 'consultation', 'Complimentary consultation to discuss your body sculpting goals and create a personalized treatment plan.', 30, 0, 'consultation', true),
  ('Body Contouring', 'body-contouring', 'Non-invasive fat reduction using advanced technology to target stubborn fat deposits.', 60, 199, 'sculpting', true),
  ('Skin Tightening', 'skin-tightening', 'Radio frequency and ultrasound treatments to stimulate collagen production and tighten loose skin.', 45, 149, 'sculpting', true),
  ('Cellulite Reduction', 'cellulite-reduction', 'Advanced treatments to break down cellulite and improve skin texture.', 45, 129, 'sculpting', true),
  ('Lymphatic Drainage', 'lymphatic-drainage', 'Specialized massage technique to stimulate lymphatic system and reduce bloating.', 60, 89, 'wellness', true),
  ('Detox Body Wrap', 'detox-body-wrap', 'Detoxifying body wrap treatment to help eliminate toxins and reduce inches.', 75, 99, 'wellness', true),
  ('Body Sculpting Package (3 Sessions)', 'package-3', 'Package of 3 body contouring sessions at a discounted rate.', 60, 499, 'package', true),
  ('Body Sculpting Package (6 Sessions)', 'package-6', 'Package of 6 body contouring sessions for maximum results.', 60, 899, 'package', true),
  ('Body Sculpting Package (10 Sessions)', 'package-10', 'Ultimate transformation package with 10 body contouring sessions.', 60, 1399, 'package', true)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  duration_minutes = EXCLUDED.duration_minutes,
  price = EXCLUDED.price,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active;

-- Curvature Appointments
CREATE TABLE IF NOT EXISTS curvature_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service_id UUID NOT NULL REFERENCES curvature_services(id),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'pending', -- pending, confirmed, completed, cancelled
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE curvature_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE curvature_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public services" ON curvature_services FOR SELECT USING (true);
CREATE POLICY "Own appointments" ON curvature_appointments FOR ALL USING (
  auth.uid() = user_id OR auth.uid() IS NOT NULL
);
CREATE POLICY "Insert appointments" ON curvature_appointments FOR INSERT WITH CHECK (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_curvature_appointments_date ON curvature_appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_curvature_appointments_status ON curvature_appointments(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
