-- Create studio_conversations table for Open Studio persistence
-- Stores conversation history and configuration for each user

CREATE TABLE IF NOT EXISTS studio_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'New Conversation',
  messages JSONB DEFAULT '[]'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_studio_conversations_user ON studio_conversations(user_id);

-- Index for ordering by updated_at
CREATE INDEX IF NOT EXISTS idx_studio_conversations_updated ON studio_conversations(updated_at DESC);

-- Add RLS policies
ALTER TABLE studio_conversations ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conversations
CREATE POLICY "Users can view own conversations" ON studio_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON studio_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON studio_conversations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" ON studio_conversations
  FOR DELETE USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_studio_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_studio_conversations_updated_at
  BEFORE UPDATE ON studio_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_studio_conversations_updated_at();

COMMENT ON TABLE studio_conversations IS 'Open Studio AI conversation history - stores messages, configuration, and metadata for each user session';