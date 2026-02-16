-- Add forum content moderation

-- Add moderation fields to forum_posts
ALTER TABLE forum_posts
ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS flagged_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS flag_reason TEXT,
ADD COLUMN IF NOT EXISTS moderated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS moderation_action TEXT,
ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false;

-- Add moderation fields to forum_threads
ALTER TABLE forum_threads
ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flagged_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS flagged_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS flag_reason TEXT,
ADD COLUMN IF NOT EXISTS moderated BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS moderation_action TEXT,
ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false;

-- Create moderation queue table
CREATE TABLE IF NOT EXISTS forum_moderation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type TEXT NOT NULL CHECK (content_type IN ('thread', 'post')),
  content_id UUID NOT NULL,
  flagged_by UUID NOT NULL REFERENCES auth.users(id),
  flag_reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  action_taken TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user suspension table
CREATE TABLE IF NOT EXISTS user_suspensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  suspended_by UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  suspended_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  permanent BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_forum_posts_flagged ON forum_posts(flagged);
CREATE INDEX IF NOT EXISTS idx_forum_posts_hidden ON forum_posts(hidden);
CREATE INDEX IF NOT EXISTS idx_forum_threads_flagged ON forum_threads(flagged);
CREATE INDEX IF NOT EXISTS idx_forum_threads_locked ON forum_threads(locked);
CREATE INDEX IF NOT EXISTS idx_forum_threads_hidden ON forum_threads(hidden);
CREATE INDEX IF NOT EXISTS idx_moderation_queue_status ON forum_moderation_queue(status);
CREATE INDEX IF NOT EXISTS idx_user_suspensions_active ON user_suspensions(active);
CREATE INDEX IF NOT EXISTS idx_user_suspensions_user_id ON user_suspensions(user_id);

-- Function to flag content
CREATE OR REPLACE FUNCTION flag_forum_content(
  content_type TEXT,
  content_id UUID,
  user_id UUID,
  reason TEXT
)
RETURNS UUID AS $$
DECLARE
  queue_id UUID;
BEGIN
  -- Add to moderation queue
  INSERT INTO forum_moderation_queue (content_type, content_id, flagged_by, flag_reason)
  VALUES (content_type, content_id, user_id, reason)
  RETURNING id INTO queue_id;
  
  -- Mark content as flagged
  IF content_type = 'post' THEN
    UPDATE forum_posts
    SET flagged = true, flagged_at = NOW(), flagged_by = user_id, flag_reason = reason
    WHERE id = content_id;
  ELSIF content_type = 'thread' THEN
    UPDATE forum_threads
    SET flagged = true, flagged_at = NOW(), flagged_by = user_id, flag_reason = reason
    WHERE id = content_id;
  END IF;
  
  RETURN queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to suspend user
CREATE OR REPLACE FUNCTION suspend_user(
  target_user_id UUID,
  admin_id UUID,
  reason TEXT,
  duration_days INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  suspension_id UUID;
  expires TIMESTAMPTZ;
BEGIN
  -- Calculate expiration
  IF duration_days IS NOT NULL THEN
    expires := NOW() + (duration_days || ' days')::INTERVAL;
  END IF;
  
  -- Create suspension
  INSERT INTO user_suspensions (user_id, suspended_by, reason, expires_at, permanent)
  VALUES (target_user_id, admin_id, reason, expires, duration_days IS NULL)
  RETURNING id INTO suspension_id;
  
  RETURN suspension_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is suspended
CREATE OR REPLACE FUNCTION is_user_suspended(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_suspensions
    WHERE user_suspensions.user_id = is_user_suspended.user_id
    AND active = true
    AND (permanent = true OR expires_at > NOW())
  );
END;
$$ LANGUAGE plpgsql;

-- RLS policies
ALTER TABLE forum_moderation_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_suspensions ENABLE ROW LEVEL SECURITY;

-- Only admins can view moderation queue
CREATE POLICY "Admins can view moderation queue"
  ON forum_moderation_queue FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Only admins can view suspensions
CREATE POLICY "Admins can view suspensions"
  ON user_suspensions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Hide flagged/hidden content from regular users
CREATE POLICY "Hidden posts not visible to regular users"
  ON forum_posts FOR SELECT
  USING (
    hidden = false OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Hidden threads not visible to regular users"
  ON forum_threads FOR SELECT
  USING (
    hidden = false OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Comments
COMMENT ON TABLE forum_moderation_queue IS 'Queue of flagged content awaiting moderation';
COMMENT ON TABLE user_suspensions IS 'User suspensions and bans';
COMMENT ON COLUMN forum_posts.flagged IS 'Whether post has been flagged for moderation';
COMMENT ON COLUMN forum_posts.hidden IS 'Whether post is hidden from regular users';
COMMENT ON COLUMN forum_threads.locked IS 'Whether thread is locked (no new posts)';
COMMENT ON COLUMN forum_threads.hidden IS 'Whether thread is hidden from regular users';
