-- Add moderation fields to discussion posts
ALTER TABLE discussion_posts ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT FALSE;
ALTER TABLE discussion_posts ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ;
ALTER TABLE discussion_posts ADD COLUMN IF NOT EXISTS flagged_by UUID REFERENCES auth.users(id);
ALTER TABLE discussion_posts ADD COLUMN IF NOT EXISTS flag_reason TEXT;
ALTER TABLE discussion_posts ADD COLUMN IF NOT EXISTS moderated BOOLEAN DEFAULT FALSE;
ALTER TABLE discussion_posts ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ;
ALTER TABLE discussion_posts ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id);
ALTER TABLE discussion_posts ADD COLUMN IF NOT EXISTS moderation_action TEXT; -- 'approved', 'removed', 'edited'

-- Create moderation queue table
CREATE TABLE IF NOT EXISTS moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES discussion_posts(id) ON DELETE CASCADE,
  flagged_by UUID REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'reviewed', 'actioned'
  reviewed_by UUID REFERENCES auth.users(id),
  action_taken TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Add user suspension capability
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- RLS for moderation queue
ALTER TABLE moderation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can flag posts" ON moderation_queue
  FOR INSERT TO authenticated
  WITH CHECK (flagged_by = auth.uid());

CREATE POLICY "Moderators can view queue" ON moderation_queue
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'moderator')
    )
  );

CREATE POLICY "Moderators can update queue" ON moderation_queue
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'moderator')
    )
  );

COMMENT ON TABLE moderation_queue IS 'Queue for flagged content requiring moderation';
