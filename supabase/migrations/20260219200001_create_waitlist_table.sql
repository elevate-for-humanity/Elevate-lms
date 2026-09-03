-- Waitlist for program cohorts
CREATE TABLE IF NOT EXISTS waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_id uuid REFERENCES cohorts(id),
  program_slug text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL,
  phone text,
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'notified', 'enrolled', 'cancelled')),
  position integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  notified_at timestamptz,
  notes text
);

CREATE INDEX IF NOT EXISTS idx_waitlist_program ON waitlist(program_slug);
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_cohort ON waitlist(cohort_id);

-- RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (join waitlist)
CREATE POLICY "Anyone can join waitlist" ON waitlist FOR INSERT WITH CHECK (true);
-- Users can see their own entries
CREATE POLICY "Users can view own waitlist" ON waitlist FOR SELECT USING (
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);
-- Admins can see all
CREATE POLICY "Admins can manage waitlist" ON waitlist FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
