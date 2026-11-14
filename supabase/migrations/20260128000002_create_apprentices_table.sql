-- Apprentices Table
-- Links users to their apprenticeship enrollment and program

CREATE TABLE IF NOT EXISTS apprentices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Application reference (if came through application flow)
  application_id UUID,
  
  -- Program info
  program_id UUID,
  program_name TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'pending',
    'active', 
    'suspended',
    'completed',
    'withdrawn'
  )),
  
  -- Hours tracking
  total_hours_required INT DEFAULT 2000,
  hours_completed INT DEFAULT 0,
  transfer_hours_credited INT DEFAULT 0,
  
  -- Dates
  enrollment_date DATE,
  expected_completion_date DATE,
  actual_completion_date DATE,
  
  -- Current assignment
  current_shop_id UUID,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint on user_id (one apprentice record per user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_apprentices_user_id ON apprentices(user_id);

-- Index for program lookups
ALTER TABLE apprentices ADD COLUMN IF NOT EXISTS program_id UUID;
CREATE INDEX IF NOT EXISTS idx_apprentices_program ON apprentices(program_id);

-- Index for status filtering
ALTER TABLE apprentices ADD COLUMN IF NOT EXISTS status TEXT;
CREATE INDEX IF NOT EXISTS idx_apprentices_status ON apprentices(status);

-- Enable RLS
ALTER TABLE apprentices ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own apprentice record" ON apprentices;
CREATE POLICY "Users can view own apprentice record" ON apprentices
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all apprentices" ON apprentices;
CREATE POLICY "Admins can view all apprentices" ON apprentices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin', 'instructor')
    )
  );

DROP POLICY IF EXISTS "Admins can manage apprentices" ON apprentices;
CREATE POLICY "Admins can manage apprentices" ON apprentices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Service role full access" ON apprentices;
CREATE POLICY "Service role full access" ON apprentices
  FOR ALL USING (auth.role() = 'service_role');

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_apprentices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER apprentices_updated_at
  BEFORE UPDATE ON apprentices
  FOR EACH ROW
  EXECUTE FUNCTION update_apprentices_updated_at();

-- Add comment
COMMENT ON TABLE apprentices IS 'Active apprentice enrollments linked to users';
