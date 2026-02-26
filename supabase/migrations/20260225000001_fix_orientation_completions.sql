-- Add missing columns to orientation_completions
-- The table was created with only (id, name, description, status, created_at, updated_at)
-- but code expects user_id, program_id, video_url, completed_at

ALTER TABLE orientation_completions ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE orientation_completions ADD COLUMN IF NOT EXISTS program_id UUID;
ALTER TABLE orientation_completions ADD COLUMN IF NOT EXISTS video_url TEXT;
ALTER TABLE orientation_completions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_orientation_completions_user_id ON orientation_completions(user_id);

-- RLS policy: users can read/write their own completions
ALTER TABLE orientation_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orientation completions" ON orientation_completions;
CREATE POLICY "Users can view own orientation completions"
  ON orientation_completions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own orientation completions" ON orientation_completions;
CREATE POLICY "Users can insert own orientation completions"
  ON orientation_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own orientation completions" ON orientation_completions;
CREATE POLICY "Users can update own orientation completions"
  ON orientation_completions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full access orientation completions" ON orientation_completions;
CREATE POLICY "Service role full access orientation completions"
  ON orientation_completions FOR ALL
  USING (auth.role() = 'service_role');
