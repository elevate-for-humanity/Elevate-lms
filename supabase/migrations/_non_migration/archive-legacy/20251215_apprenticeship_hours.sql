-- Apprenticeship Hour Tracking
-- RAPIDS/WIOA-ready hour tracking for apprenticeship programs

CREATE TABLE IF NOT EXISTS public.apprenticeship_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id),
  program_slug text NOT NULL,
  date_worked date NOT NULL,
  hours numeric(4,2) NOT NULL CHECK (hours > 0 AND hours <= 24),
  category text NOT NULL CHECK (category IN ('classroom', 'on-the-job')),
  notes text,
  approved boolean DEFAULT false,
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_apprenticeship_hours_student ON apprenticeship_hours(student_id);
CREATE INDEX IF NOT EXISTS idx_apprenticeship_hours_program ON apprenticeship_hours(program_slug);
CREATE INDEX IF NOT EXISTS idx_apprenticeship_hours_date ON apprenticeship_hours(date_worked DESC);
CREATE INDEX IF NOT EXISTS idx_apprenticeship_hours_approved ON apprenticeship_hours(approved);

-- RLS Policies
ALTER TABLE apprenticeship_hours ENABLE ROW LEVEL SECURITY;

-- Students can view their own hours
CREATE POLICY "Students can view their hours"
  ON apprenticeship_hours
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Students can insert their own hours
CREATE POLICY "Students can insert their hours"
  ON apprenticeship_hours
  FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- Students can update their own unapproved hours
CREATE POLICY "Students can update unapproved hours"
  ON apprenticeship_hours
  FOR UPDATE
  TO authenticated
  USING (student_id = auth.uid() AND approved = false);

-- Admins can view all hours
CREATE POLICY "Admins can view all hours"
  ON apprenticeship_hours
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Admins can approve hours
CREATE POLICY "Admins can approve hours"
  ON apprenticeship_hours
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

-- Service role can manage everything
CREATE POLICY "Service role can manage hours"
  ON apprenticeship_hours
  FOR ALL
  TO service_role
  USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_apprenticeship_hours_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER apprenticeship_hours_updated_at
  BEFORE UPDATE ON apprenticeship_hours
  FOR EACH ROW
  EXECUTE FUNCTION update_apprenticeship_hours_updated_at();

-- Comments
COMMENT ON TABLE apprenticeship_hours IS 'RAPIDS/WIOA-ready apprenticeship hour tracking';
COMMENT ON COLUMN apprenticeship_hours.category IS 'classroom or on-the-job training';
COMMENT ON COLUMN apprenticeship_hours.approved IS 'Whether hours have been approved by supervisor/admin';
