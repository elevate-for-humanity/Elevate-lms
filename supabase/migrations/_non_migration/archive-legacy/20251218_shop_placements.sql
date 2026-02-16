-- Shop Placements Table
-- Tracks employer/shop assignments for on-the-job training

CREATE TABLE IF NOT EXISTS shop_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  shop_address TEXT,
  supervisor_name TEXT,
  supervisor_email TEXT,
  supervisor_phone TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id)
);

-- Index for student lookups
CREATE INDEX IF NOT EXISTS idx_shop_placements_student_id ON shop_placements(student_id);

-- Index for status queries
CREATE INDEX IF NOT EXISTS idx_shop_placements_status ON shop_placements(status);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_shop_placements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_shop_placements_updated_at
  BEFORE UPDATE ON shop_placements
  FOR EACH ROW
  EXECUTE FUNCTION update_shop_placements_updated_at();

-- Comments for audit trail
COMMENT ON TABLE shop_placements IS 'Tracks employer/shop assignments for OJT hours';
COMMENT ON COLUMN shop_placements.status IS 'active: currently placed, inactive: removed, completed: finished program';
COMMENT ON COLUMN shop_placements.supervisor_email IS 'Used for hour approval notifications';
