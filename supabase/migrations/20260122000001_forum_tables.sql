-- Forum Tables Migration
-- Community discussion forum for learners, partners, and staff

-- Step 1: Create forum_categories table
CREATE TABLE IF NOT EXISTS forum_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT DEFAULT 'MessageSquare',
  color TEXT DEFAULT 'blue',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Create forum_topics table
CREATE TABLE IF NOT EXISTS forum_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  reply_count INTEGER DEFAULT 0,
  last_reply_at TIMESTAMPTZ,
  last_reply_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 3: Create forum_replies table
CREATE TABLE IF NOT EXISTS forum_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID,
  author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID,
  content TEXT NOT NULL,
  is_solution BOOLEAN DEFAULT false,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 4: Create forum_upvotes table
CREATE TABLE IF NOT EXISTS forum_upvotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  reply_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, reply_id)
);

-- Step 5: Create indexes for performance
ALTER TABLE forum_topics ADD COLUMN IF NOT EXISTS category_id UUID;
CREATE INDEX IF NOT EXISTS idx_forum_topics_category ON forum_topics(category_id);
ALTER TABLE forum_topics ADD COLUMN IF NOT EXISTS author_id TEXT;
CREATE INDEX IF NOT EXISTS idx_forum_topics_author ON forum_topics(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_topics_created ON forum_topics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_topics_pinned ON forum_topics(is_pinned DESC, created_at DESC);
ALTER TABLE forum_replies ADD COLUMN IF NOT EXISTS topic_id UUID;
CREATE INDEX IF NOT EXISTS idx_forum_replies_topic ON forum_replies(topic_id);
ALTER TABLE forum_replies ADD COLUMN IF NOT EXISTS author_id TEXT;
CREATE INDEX IF NOT EXISTS idx_forum_replies_author ON forum_replies(author_id);
CREATE INDEX IF NOT EXISTS idx_forum_replies_created ON forum_replies(created_at DESC);
ALTER TABLE forum_upvotes ADD COLUMN IF NOT EXISTS reply_id UUID;
CREATE INDEX IF NOT EXISTS idx_forum_upvotes_reply ON forum_upvotes(reply_id);

-- Step 6: Enable RLS
ALTER TABLE forum_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_upvotes ENABLE ROW LEVEL SECURITY;

-- Step 7: RLS Policies for forum_categories
DROP POLICY IF EXISTS "Forum categories viewable by everyone" ON forum_categories;
CREATE POLICY "Forum categories viewable by everyone"
  ON forum_categories FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Forum categories manageable by admins" ON forum_categories;
CREATE POLICY "Forum categories manageable by admins"
  ON forum_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Step 8: RLS Policies for forum_topics
DROP POLICY IF EXISTS "Forum topics viewable by authenticated users" ON forum_topics;
CREATE POLICY "Forum topics viewable by authenticated users"
  ON forum_topics FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Forum topics creatable by authenticated users" ON forum_topics;
CREATE POLICY "Forum topics creatable by authenticated users"
  ON forum_topics FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "Forum topics editable by author or admin" ON forum_topics;
CREATE POLICY "Forum topics editable by author or admin"
  ON forum_topics FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

DROP POLICY IF EXISTS "Forum topics deletable by author or admin" ON forum_topics;
CREATE POLICY "Forum topics deletable by author or admin"
  ON forum_topics FOR DELETE
  TO authenticated
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Step 9: RLS Policies for forum_replies
DROP POLICY IF EXISTS "Forum replies viewable by authenticated users" ON forum_replies;
CREATE POLICY "Forum replies viewable by authenticated users"
  ON forum_replies FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Forum replies creatable by authenticated users" ON forum_replies;
CREATE POLICY "Forum replies creatable by authenticated users"
  ON forum_replies FOR INSERT
  TO authenticated
  WITH CHECK (author_id = auth.uid());

DROP POLICY IF EXISTS "Forum replies editable by author or admin" ON forum_replies;
CREATE POLICY "Forum replies editable by author or admin"
  ON forum_replies FOR UPDATE
  TO authenticated
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

DROP POLICY IF EXISTS "Forum replies deletable by author or admin" ON forum_replies;
CREATE POLICY "Forum replies deletable by author or admin"
  ON forum_replies FOR DELETE
  TO authenticated
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'staff')
    )
  );

-- Step 10: RLS Policies for forum_upvotes
DROP POLICY IF EXISTS "Forum upvotes viewable by authenticated users" ON forum_upvotes;
CREATE POLICY "Forum upvotes viewable by authenticated users"
  ON forum_upvotes FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Forum upvotes creatable by authenticated users" ON forum_upvotes;
CREATE POLICY "Forum upvotes creatable by authenticated users"
  ON forum_upvotes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Forum upvotes deletable by owner" ON forum_upvotes;
CREATE POLICY "Forum upvotes deletable by owner"
  ON forum_upvotes FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Step 11: Function to update reply count and last_reply info
CREATE OR REPLACE FUNCTION update_topic_reply_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_topics
    SET 
      reply_count = reply_count + 1,
      last_reply_at = NEW.created_at,
      last_reply_by = NEW.author_id
    WHERE id = NEW.topic_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_topics
    SET reply_count = reply_count - 1
    WHERE id = OLD.topic_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 12: Trigger for reply stats
DROP TRIGGER IF EXISTS update_topic_reply_stats_trigger ON forum_replies;
CREATE TRIGGER update_topic_reply_stats_trigger
  AFTER INSERT OR DELETE ON forum_replies
  FOR EACH ROW
  EXECUTE FUNCTION update_topic_reply_stats();

-- Step 13: Function to update upvote count
CREATE OR REPLACE FUNCTION update_reply_upvotes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE forum_replies
    SET upvotes = upvotes + 1
    WHERE id = NEW.reply_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE forum_replies
    SET upvotes = upvotes - 1
    WHERE id = OLD.reply_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 14: Trigger for upvote count
DROP TRIGGER IF EXISTS update_reply_upvotes_trigger ON forum_upvotes;
CREATE TRIGGER update_reply_upvotes_trigger
  AFTER INSERT OR DELETE ON forum_upvotes
  FOR EACH ROW
  EXECUTE FUNCTION update_reply_upvotes();

-- Step 15: Seed default categories
INSERT INTO forum_categories (name, slug, description, icon, color, sort_order) VALUES
  ('General Discussion', 'general', 'General topics and community chat', 'MessageSquare', 'blue', 1),
  ('Program Questions', 'programs', 'Questions about training programs and courses', 'GraduationCap', 'green', 2),
  ('Career Advice', 'careers', 'Job search tips, resume help, and career guidance', 'Briefcase', 'purple', 3),
  ('Technical Support', 'support', 'Help with platform issues and technical questions', 'HelpCircle', 'orange', 4),
  ('Success Stories', 'success', 'Share your achievements and inspire others', 'Trophy', 'yellow', 5),
  ('Study Groups', 'study-groups', 'Find study partners and form learning groups', 'Users', 'teal', 6)
ON CONFLICT (slug) DO NOTHING;

COMMENT ON TABLE forum_categories IS 'Forum discussion categories';
COMMENT ON TABLE forum_topics IS 'Forum discussion topics/threads';
COMMENT ON TABLE forum_replies IS 'Replies to forum topics';
COMMENT ON TABLE forum_upvotes IS 'Upvotes on forum replies';
