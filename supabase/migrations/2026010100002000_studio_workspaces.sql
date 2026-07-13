-- Studio Workspaces: Persistent file storage for admin IDE
-- This enables full dev environment functionality without external services

-- Workspaces table: each admin can have multiple workspaces
CREATE TABLE IF NOT EXISTS studio_workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  repo_url TEXT, -- Optional GitHub repo to sync with
  repo_branch TEXT DEFAULT 'main',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW()
  UNIQUE(user_id, name)
);

-- Files table: stores all workspace files with content
CREATE TABLE IF NOT EXISTS studio_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  path TEXT NOT NULL, -- e.g., 'src/index.ts'
  content TEXT, -- File content (NULL for directories)
  is_directory BOOLEAN DEFAULT FALSE,
  size_bytes INTEGER DEFAULT 0,
  mime_type TEXT,
  checksum TEXT, -- For sync conflict detection
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
  UNIQUE(workspace_id, path)
);

-- Terminal sessions: track command history and output
CREATE TABLE IF NOT EXISTS studio_terminal_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'error')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Terminal commands: individual commands and their output
CREATE TABLE IF NOT EXISTS studio_terminal_commands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  command TEXT NOT NULL,
  output TEXT,
  exit_code INTEGER,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER
);

-- Indexes for performance
ALTER TABLE studio_workspaces ADD COLUMN IF NOT EXISTS user_id UUID;
CREATE INDEX IF NOT EXISTS idx_studio_workspaces_user ON studio_workspaces(user_id);
ALTER TABLE studio_files ADD COLUMN IF NOT EXISTS workspace_id UUID;
CREATE INDEX IF NOT EXISTS idx_studio_files_workspace ON studio_files(workspace_id);
CREATE INDEX IF NOT EXISTS idx_studio_files_path ON studio_files(workspace_id, path);
ALTER TABLE studio_terminal_sessions ADD COLUMN IF NOT EXISTS workspace_id UUID;
CREATE INDEX IF NOT EXISTS idx_studio_terminal_sessions_workspace ON studio_terminal_sessions(workspace_id);
ALTER TABLE studio_terminal_commands ADD COLUMN IF NOT EXISTS session_id UUID;
CREATE INDEX IF NOT EXISTS idx_studio_terminal_commands_session ON studio_terminal_commands(session_id);

-- RLS Policies
ALTER TABLE studio_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_terminal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE studio_terminal_commands ENABLE ROW LEVEL SECURITY;

-- Workspace policies: users can only access their own workspaces
DROP POLICY IF EXISTS "studio_workspaces_select" ON studio_workspaces;
CREATE POLICY studio_workspaces_select ON studio_workspaces
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "studio_workspaces_insert" ON studio_workspaces;
CREATE POLICY studio_workspaces_insert ON studio_workspaces
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "studio_workspaces_update" ON studio_workspaces;
CREATE POLICY studio_workspaces_update ON studio_workspaces
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "studio_workspaces_delete" ON studio_workspaces;
CREATE POLICY studio_workspaces_delete ON studio_workspaces
  FOR DELETE USING (auth.uid() = user_id);

-- File policies: access through workspace ownership
DROP POLICY IF EXISTS "studio_files_select" ON studio_files;
CREATE POLICY studio_files_select ON studio_files
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM studio_workspaces WHERE id = workspace_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "studio_files_insert" ON studio_files;
CREATE POLICY studio_files_insert ON studio_files
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM studio_workspaces WHERE id = workspace_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "studio_files_update" ON studio_files;
CREATE POLICY studio_files_update ON studio_files
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM studio_workspaces WHERE id = workspace_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "studio_files_delete" ON studio_files;
CREATE POLICY studio_files_delete ON studio_files
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM studio_workspaces WHERE id = workspace_id AND user_id = auth.uid())
  );

-- Terminal session policies
DROP POLICY IF EXISTS "studio_terminal_sessions_select" ON studio_terminal_sessions;
CREATE POLICY studio_terminal_sessions_select ON studio_terminal_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "studio_terminal_sessions_insert" ON studio_terminal_sessions;
CREATE POLICY studio_terminal_sessions_insert ON studio_terminal_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "studio_terminal_sessions_update" ON studio_terminal_sessions;
CREATE POLICY studio_terminal_sessions_update ON studio_terminal_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Terminal command policies (through session ownership)
DROP POLICY IF EXISTS "studio_terminal_commands_select" ON studio_terminal_commands;
CREATE POLICY studio_terminal_commands_select ON studio_terminal_commands
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM studio_terminal_sessions WHERE id = session_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "studio_terminal_commands_insert" ON studio_terminal_commands;
CREATE POLICY studio_terminal_commands_insert ON studio_terminal_commands
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM studio_terminal_sessions WHERE id = session_id AND user_id = auth.uid())
  );

-- Enable realtime for collaborative editing
ALTER PUBLICATION supabase_realtime ADD TABLE studio_files;
ALTER PUBLICATION supabase_realtime ADD TABLE studio_terminal_commands;

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_studio_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER studio_workspaces_updated_at
  BEFORE UPDATE ON studio_workspaces
  FOR EACH ROW EXECUTE FUNCTION update_studio_updated_at();

CREATE TRIGGER studio_files_updated_at
  BEFORE UPDATE ON studio_files
  FOR EACH ROW EXECUTE FUNCTION update_studio_updated_at();
