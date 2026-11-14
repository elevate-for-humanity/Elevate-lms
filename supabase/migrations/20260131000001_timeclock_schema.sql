-- Timeclock Schema Updates
-- Adds user linkage to apprentices and creates dedicated timeclock_shifts table

-- 1. Add user_id to apprentices for auth linkage
ALTER TABLE apprentices 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_apprentices_user_id 
ON apprentices(user_id) WHERE user_id IS NOT NULL;

-- 2. Create dedicated timeclock_shifts table
CREATE TABLE IF NOT EXISTS timeclock_shifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apprentice_id UUID NOT NULL,
  site_id UUID NOT NULL,
  
  -- Clock times
  clock_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  clock_out_at TIMESTAMPTZ,
  
  -- Lunch break
  lunch_start_at TIMESTAMPTZ,
  lunch_end_at TIMESTAMPTZ,
  
  -- Geofence verification
  clock_in_lat DECIMAL(10,8),
  clock_in_lng DECIMAL(11,8),
  clock_in_within_geofence BOOLEAN DEFAULT false,
  clock_out_lat DECIMAL(10,8),
  clock_out_lng DECIMAL(11,8),
  clock_out_within_geofence BOOLEAN,
  
  -- Computed hours (updated on clock out)
  total_hours DECIMAL(5,2),
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
ALTER TABLE timeclock_shifts ADD COLUMN IF NOT EXISTS apprentice_id TEXT;
CREATE INDEX IF NOT EXISTS idx_timeclock_shifts_apprentice ON timeclock_shifts(apprentice_id);
ALTER TABLE timeclock_shifts ADD COLUMN IF NOT EXISTS site_id UUID;
CREATE INDEX IF NOT EXISTS idx_timeclock_shifts_site ON timeclock_shifts(site_id);
ALTER TABLE timeclock_shifts ADD COLUMN IF NOT EXISTS apprentice_id TEXT;
CREATE INDEX IF NOT EXISTS idx_timeclock_shifts_active ON timeclock_shifts(apprentice_id) WHERE clock_out_at IS NULL;
ALTER TABLE timeclock_shifts ADD COLUMN IF NOT EXISTS clock_in_at TEXT;
CREATE INDEX IF NOT EXISTS idx_timeclock_shifts_date ON timeclock_shifts(clock_in_at);

-- Enable RLS
ALTER TABLE timeclock_shifts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Apprentices can view their own shifts
DROP POLICY IF EXISTS "Apprentices can view own shifts" ON timeclock_shifts;
CREATE POLICY "Apprentices can view own shifts"
  ON timeclock_shifts FOR SELECT
  USING (
    apprentice_id IN (
      SELECT id FROM apprentices WHERE user_id = auth.uid()
    )
  );

-- Apprentices can insert their own shifts (clock in)
DROP POLICY IF EXISTS "Apprentices can clock in" ON timeclock_shifts;
CREATE POLICY "Apprentices can clock in"
  ON timeclock_shifts FOR INSERT
  WITH CHECK (
    apprentice_id IN (
      SELECT id FROM apprentices WHERE user_id = auth.uid()
    )
  );

-- Apprentices can update their own active shifts (clock out, lunch)
DROP POLICY IF EXISTS "Apprentices can update own shifts" ON timeclock_shifts;
CREATE POLICY "Apprentices can update own shifts"
  ON timeclock_shifts FOR UPDATE
  USING (
    apprentice_id IN (
      SELECT id FROM apprentices WHERE user_id = auth.uid()
    )
  );

-- Admins/staff can manage all shifts
DROP POLICY IF EXISTS "Admins can manage all shifts" ON timeclock_shifts;
CREATE POLICY "Admins can manage all shifts"
  ON timeclock_shifts FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Service role full access
DROP POLICY IF EXISTS "Service role full access timeclock_shifts" ON timeclock_shifts;
CREATE POLICY "Service role full access timeclock_shifts"
  ON timeclock_shifts FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_timeclock_shift_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  -- Calculate total hours on clock out
  IF NEW.clock_out_at IS NOT NULL AND OLD.clock_out_at IS NULL THEN
    NEW.total_hours = EXTRACT(EPOCH FROM (NEW.clock_out_at - NEW.clock_in_at)) / 3600.0;
    -- Subtract lunch if taken
    IF NEW.lunch_start_at IS NOT NULL AND NEW.lunch_end_at IS NOT NULL THEN
      NEW.total_hours = NEW.total_hours - (EXTRACT(EPOCH FROM (NEW.lunch_end_at - NEW.lunch_start_at)) / 3600.0);
    END IF;
    NEW.status = 'completed';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER timeclock_shifts_updated_at
  BEFORE UPDATE ON timeclock_shifts
  FOR EACH ROW EXECUTE FUNCTION update_timeclock_shift_updated_at();
