-- QA Checklist System
-- Tables for quality assurance checklists and completions

-- QA Checklists Table
CREATE TABLE IF NOT EXISTS qa_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
  tasks JSONB DEFAULT '[]'::jsonb,
  assignee_role TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- QA Checklist Completions Table
CREATE TABLE IF NOT EXISTS qa_checklist_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id UUID NOT NULL REFERENCES qa_checklists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_qa_checklists_frequency ON qa_checklists(frequency);
CREATE INDEX IF NOT EXISTS idx_qa_checklists_role ON qa_checklists(assignee_role);
CREATE INDEX IF NOT EXISTS idx_qa_checklists_active ON qa_checklists(is_active);
CREATE INDEX IF NOT EXISTS idx_qa_completions_checklist ON qa_checklist_completions(checklist_id);
CREATE INDEX IF NOT EXISTS idx_qa_completions_user ON qa_checklist_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_qa_completions_date ON qa_checklist_completions(completed_at);

-- RLS
ALTER TABLE qa_checklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE qa_checklist_completions ENABLE ROW LEVEL SECURITY;

-- Staff can view active checklists
CREATE POLICY "Staff can view active checklists"
  ON qa_checklists FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff', 'advisor')
    )
  );

-- Admin can manage checklists
CREATE POLICY "Admin can manage checklists"
  ON qa_checklists FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Users can view their own completions
CREATE POLICY "Users can view own completions"
  ON qa_checklist_completions FOR SELECT
  USING (user_id = auth.uid());

-- Users can insert their own completions
CREATE POLICY "Users can insert own completions"
  ON qa_checklist_completions FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Admin can view all completions
CREATE POLICY "Admin can view all completions"
  ON qa_checklist_completions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

-- Admin can update completions (for approval)
CREATE POLICY "Admin can update completions"
  ON qa_checklist_completions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin')
    )
  );

COMMENT ON TABLE qa_checklists IS 'Quality assurance checklists';
COMMENT ON TABLE qa_checklist_completions IS 'Completed QA checklists';
