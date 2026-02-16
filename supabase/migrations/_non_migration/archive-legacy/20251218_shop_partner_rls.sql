-- Row Level Security for Shop Partner Portal
-- Ensures shops only see their own data, admins see everything

-- Enable RLS
ALTER TABLE shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE apprentice_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE apprentice_weekly_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE apprentice_wage_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE shop_onboarding ENABLE ROW LEVEL SECURITY;

-- Helper: is current user staff at shop
CREATE OR REPLACE FUNCTION is_shop_staff(_shop_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM shop_staff ss
    WHERE ss.shop_id = _shop_id
      AND ss.user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: is current user sponsor/admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Shops: staff can read their shop, admin can read all
CREATE POLICY "shops_read_staff_or_admin"
ON shops FOR SELECT
USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM shop_staff ss
    WHERE ss.shop_id = shops.id AND ss.user_id = auth.uid()
  )
);

-- Admin can insert/update shops
CREATE POLICY "shops_admin_write"
ON shops FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Shop staff: staff can read their records, admin all
CREATE POLICY "shop_staff_read"
ON shop_staff FOR SELECT
USING (
  is_admin() OR 
  shop_staff.user_id = auth.uid() OR 
  is_shop_staff(shop_staff.shop_id)
);

-- Admin can manage shop staff
CREATE POLICY "shop_staff_admin_write"
ON shop_staff FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Placements: staff can read placements for their shop, admin all
CREATE POLICY "placements_read"
ON apprentice_placements FOR SELECT
USING (
  is_admin() OR 
  is_shop_staff(apprentice_placements.shop_id) OR
  apprentice_placements.student_id = auth.uid()
);

-- Admin can manage placements
CREATE POLICY "placements_admin_write"
ON apprentice_placements FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- Weekly reports: staff can insert/select for placements in their shop; admin can do all
CREATE POLICY "reports_select"
ON apprentice_weekly_reports FOR SELECT
USING (
  is_admin() OR EXISTS (
    SELECT 1
    FROM apprentice_placements ap
    JOIN shop_staff ss ON ss.shop_id = ap.shop_id
    WHERE ap.id = apprentice_weekly_reports.placement_id
      AND ss.user_id = auth.uid()
  )
);

CREATE POLICY "reports_insert"
ON apprentice_weekly_reports FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM apprentice_placements ap
    JOIN shop_staff ss ON ss.shop_id = ap.shop_id
    WHERE ap.id = apprentice_weekly_reports.placement_id
      AND ss.user_id = auth.uid()
  )
);

-- Admin can update reports (for approval/rejection)
CREATE POLICY "reports_admin_update"
ON apprentice_weekly_reports FOR UPDATE
USING (is_admin())
WITH CHECK (is_admin());

-- Wage updates: same logic as reports
CREATE POLICY "wages_select"
ON apprentice_wage_updates FOR SELECT
USING (
  is_admin() OR EXISTS (
    SELECT 1
    FROM apprentice_placements ap
    JOIN shop_staff ss ON ss.shop_id = ap.shop_id
    WHERE ap.id = apprentice_wage_updates.placement_id
      AND ss.user_id = auth.uid()
  )
);

CREATE POLICY "wages_insert"
ON apprentice_wage_updates FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM apprentice_placements ap
    JOIN shop_staff ss ON ss.shop_id = ap.shop_id
    WHERE ap.id = apprentice_wage_updates.placement_id
      AND ss.user_id = auth.uid()
  )
);

-- Shop onboarding: staff updates their own shop onboarding, admin all
CREATE POLICY "shop_onboarding_select"
ON shop_onboarding FOR SELECT
USING (is_admin() OR is_shop_staff(shop_onboarding.shop_id));

CREATE POLICY "shop_onboarding_upsert"
ON shop_onboarding FOR INSERT
WITH CHECK (is_admin() OR is_shop_staff(shop_onboarding.shop_id));

CREATE POLICY "shop_onboarding_update"
ON shop_onboarding FOR UPDATE
USING (is_admin() OR is_shop_staff(shop_onboarding.shop_id))
WITH CHECK (is_admin() OR is_shop_staff(shop_onboarding.shop_id));
