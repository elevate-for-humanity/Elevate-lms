-- Program Discussions Tables
-- Community discussion threads per program for enrolled learners

-- Main discussion threads
CREATE TABLE IF NOT EXISTS program_discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES programs(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  pinned boolean DEFAULT false,
  locked boolean DEFAULT false,
  likes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Discussion replies
CREATE TABLE IF NOT EXISTS program_discussion_replies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES program_discussions(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  likes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_program_discussions_program ON program_discussions(program_id);
CREATE INDEX IF NOT EXISTS idx_program_discussions_author ON program_discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_program_discussions_pinned ON program_discussions(pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_program_discussion_replies_thread ON program_discussion_replies(thread_id);
CREATE INDEX IF NOT EXISTS idx_program_discussion_replies_author ON program_discussion_replies(author_id);

-- RLS
ALTER TABLE program_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_discussion_replies ENABLE ROW LEVEL SECURITY;

-- Anyone can read discussions (public community)
CREATE POLICY program_discussions_select ON program_discussions
  FOR SELECT TO authenticated
  USING (true);

-- Enrolled users can create discussions
CREATE POLICY program_discussions_insert ON program_discussions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM enrollments 
      WHERE enrollments.program_id = program_discussions.program_id 
      AND enrollments.user_id = auth.uid()
    )
  );

-- Authors can update their own discussions
CREATE POLICY program_discussions_update ON program_discussions
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Authors and admins can delete discussions
CREATE POLICY program_discussions_delete ON program_discussions
  FOR DELETE TO authenticated
  USING (
    author_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'instructor')
    )
  );

-- Anyone can read replies
CREATE POLICY program_discussion_replies_select ON program_discussion_replies
  FOR SELECT TO authenticated
  USING (true);

-- Enrolled users can create replies
CREATE POLICY program_discussion_replies_insert ON program_discussion_replies
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM program_discussions pd
      JOIN enrollments e ON e.program_id = pd.program_id
      WHERE pd.id = program_discussion_replies.thread_id
      AND e.user_id = auth.uid()
    )
  );

-- Authors can update their own replies
CREATE POLICY program_discussion_replies_update ON program_discussion_replies
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Authors and admins can delete replies
CREATE POLICY program_discussion_replies_delete ON program_discussion_replies
  FOR DELETE TO authenticated
  USING (
    author_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin', 'instructor')
    )
  );

COMMENT ON TABLE program_discussions IS 'Community discussion threads for program learners';
COMMENT ON TABLE program_discussion_replies IS 'Replies to program discussion threads';
