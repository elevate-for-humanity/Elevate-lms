-- Add active flag to shop_staff for staff deactivation without row deletion
-- Enables clean partner access revocation

ALTER TABLE shop_staff
  ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_shop_staff_active
  ON shop_staff(user_id, active) WHERE active = true;

-- Update existing RLS read policy to exclude inactive staff
DROP POLICY IF EXISTS "shop_staff_read" ON shop_staff;
CREATE POLICY "shop_staff_read"
  ON shop_staff FOR SELECT
  USING (
    is_admin() OR
    (shop_staff.user_id = auth.uid() AND shop_staff.active = true) OR
    (is_shop_staff(shop_staff.shop_id) AND shop_staff.active = true)
  );
