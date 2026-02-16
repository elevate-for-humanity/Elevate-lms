-- Create user_onboarding table
CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  flow_id TEXT NOT NULL,
  current_step INTEGER DEFAULT 0,
  completed_steps TEXT[] DEFAULT '{}',
  completed BOOLEAN DEFAULT FALSE,
  skipped BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, flow_id)
);

-- Create user_tutorials table
CREATE TABLE IF NOT EXISTS user_tutorials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tutorial_id TEXT NOT NULL,
  current_step INTEGER DEFAULT 0,
  completed_steps TEXT[] DEFAULT '{}',
  completed BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, tutorial_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_onboarding_user_id ON user_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_flow_id ON user_onboarding(flow_id);
CREATE INDEX IF NOT EXISTS idx_user_onboarding_completed ON user_onboarding(completed);

CREATE INDEX IF NOT EXISTS idx_user_tutorials_user_id ON user_tutorials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_tutorials_tutorial_id ON user_tutorials(tutorial_id);
CREATE INDEX IF NOT EXISTS idx_user_tutorials_completed ON user_tutorials(completed);

-- Enable Row Level Security
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tutorials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_onboarding
CREATE POLICY "Users can view their own onboarding progress"
  ON user_onboarding FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own onboarding progress"
  ON user_onboarding FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own onboarding progress"
  ON user_onboarding FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own onboarding progress"
  ON user_onboarding FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_tutorials
CREATE POLICY "Users can view their own tutorial progress"
  ON user_tutorials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tutorial progress"
  ON user_tutorials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tutorial progress"
  ON user_tutorials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tutorial progress"
  ON user_tutorials FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_onboarding_updated_at
  BEFORE UPDATE ON user_onboarding
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_tutorials_updated_at
  BEFORE UPDATE ON user_tutorials
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE user_onboarding IS 'Tracks user progress through onboarding flows';
COMMENT ON TABLE user_tutorials IS 'Tracks user progress through interactive tutorials';

COMMENT ON COLUMN user_onboarding.flow_id IS 'ID of the onboarding flow (e.g., student_welcome, instructor_welcome)';
COMMENT ON COLUMN user_onboarding.current_step IS 'Index of the current step in the flow';
COMMENT ON COLUMN user_onboarding.completed_steps IS 'Array of completed step IDs';
COMMENT ON COLUMN user_onboarding.skipped IS 'Whether the user skipped the onboarding';

COMMENT ON COLUMN user_tutorials.tutorial_id IS 'ID of the tutorial (e.g., video_features, note_taking)';
COMMENT ON COLUMN user_tutorials.current_step IS 'Index of the current step in the tutorial';
COMMENT ON COLUMN user_tutorials.completed_steps IS 'Array of completed step IDs';
