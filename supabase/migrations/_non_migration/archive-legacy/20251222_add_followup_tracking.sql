-- Add follow-up tracking to applications
ALTER TABLE applications ADD COLUMN IF NOT EXISTS follow_up_status TEXT DEFAULT 'pending'; -- 'pending', 'contacted', 'completed', 'no_response'
ALTER TABLE applications ADD COLUMN IF NOT EXISTS follow_up_date TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS last_contact_at TIMESTAMPTZ;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS contact_attempts INTEGER DEFAULT 0;

-- Add follow-up tracking to contact messages
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS follow_up_status TEXT DEFAULT 'pending';
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS follow_up_date TIMESTAMPTZ;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS follow_up_notes TEXT;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS resolved BOOLEAN DEFAULT FALSE;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE contact_messages ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES auth.users(id);

-- Create follow-up reminders table
CREATE TABLE IF NOT EXISTS follow_up_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type TEXT NOT NULL, -- 'application', 'contact_message'
  record_id UUID NOT NULL,
  assigned_to UUID REFERENCES auth.users(id),
  due_date TIMESTAMPTZ NOT NULL,
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
  status TEXT DEFAULT 'pending', -- 'pending', 'completed', 'snoozed'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- RLS for follow-up reminders
ALTER TABLE follow_up_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view reminders" ON follow_up_reminders
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

CREATE POLICY "Staff can manage reminders" ON follow_up_reminders
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Create index for due date queries
CREATE INDEX IF NOT EXISTS idx_follow_up_reminders_due_date ON follow_up_reminders(due_date) WHERE status = 'pending';

COMMENT ON TABLE follow_up_reminders IS 'Automated reminders for follow-up actions';
