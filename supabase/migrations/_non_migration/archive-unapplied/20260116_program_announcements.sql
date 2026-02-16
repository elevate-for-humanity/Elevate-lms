-- Program Announcements Table
-- Allows instructors to post announcements to all students in a program

CREATE TABLE IF NOT EXISTS program_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES programs(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_program_announcements_program ON program_announcements(program_id);
CREATE INDEX IF NOT EXISTS idx_program_announcements_author ON program_announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_program_announcements_created ON program_announcements(created_at DESC);

-- RLS
ALTER TABLE program_announcements ENABLE ROW LEVEL SECURITY;

-- Instructors and admins can create announcements
CREATE POLICY program_announcements_insert ON program_announcements
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('instructor', 'admin', 'super_admin')
    )
  );

-- Anyone enrolled can read announcements
CREATE POLICY program_announcements_select ON program_announcements
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM enrollments 
      WHERE enrollments.program_id = program_announcements.program_id 
      AND enrollments.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('instructor', 'admin', 'super_admin')
    )
  );

-- Authors can update their own announcements
CREATE POLICY program_announcements_update ON program_announcements
  FOR UPDATE TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

-- Authors and admins can delete announcements
CREATE POLICY program_announcements_delete ON program_announcements
  FOR DELETE TO authenticated
  USING (
    author_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

COMMENT ON TABLE program_announcements IS 'Instructor announcements for program-wide communication';
