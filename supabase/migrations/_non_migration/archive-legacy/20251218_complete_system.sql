-- Complete System Architecture
-- WIOA Case Managers, External Credentials, Exam Readiness, Multi-State Support

-- 1️⃣ WIOA CASE MANAGER SUPPORT
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS case_manager_id uuid REFERENCES auth.users(id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_case_manager ON user_profiles(case_manager_id);

COMMENT ON COLUMN user_profiles.case_manager_id IS 'WIOA case manager assigned to this student';

-- 2️⃣ EXTERNAL CREDENTIALS (Milady RISE, etc)
CREATE TABLE IF NOT EXISTS public.external_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id),
  provider text NOT NULL,
  course_name text NOT NULL,
  status text DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed')),
  assigned_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_external_credentials_student ON external_credentials(student_id);
CREATE INDEX IF NOT EXISTS idx_external_credentials_provider ON external_credentials(provider);
CREATE INDEX IF NOT EXISTS idx_external_credentials_status ON external_credentials(status);

-- RLS for external credentials
ALTER TABLE external_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their credentials"
  ON external_credentials
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Service role can manage credentials"
  ON external_credentials
  FOR ALL
  TO service_role
  USING (true);

COMMENT ON TABLE external_credentials IS 'External certifications like Milady RISE';

-- 3️⃣ STATE BOARD EXAM READINESS
CREATE TABLE IF NOT EXISTS public.exam_readiness (
  student_id uuid PRIMARY KEY REFERENCES auth.users(id),
  theory_complete boolean DEFAULT false,
  practical_complete boolean DEFAULT false,
  hours_complete boolean DEFAULT false,
  ready_for_exam boolean DEFAULT false,
  verified_by uuid REFERENCES auth.users(id),
  verified_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS for exam readiness
ALTER TABLE exam_readiness ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their readiness"
  ON exam_readiness
  FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY "Admins can manage readiness"
  ON exam_readiness
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.role = 'admin'
    )
  );

CREATE POLICY "Service role can manage readiness"
  ON exam_readiness
  FOR ALL
  TO service_role
  USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_exam_readiness_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER exam_readiness_updated_at
  BEFORE UPDATE ON exam_readiness
  FOR EACH ROW
  EXECUTE FUNCTION update_exam_readiness_updated_at();

COMMENT ON TABLE exam_readiness IS 'State board exam readiness tracking';

-- 4️⃣ MULTI-STATE SUPPORT
ALTER TABLE public.programs
ADD COLUMN IF NOT EXISTS state_code text DEFAULT 'IN';

CREATE INDEX IF NOT EXISTS idx_programs_state ON programs(state_code);

COMMENT ON COLUMN programs.state_code IS 'State code for multi-state apprenticeship support (IN, OH, TX, etc)';

-- 5️⃣ PWA OFFLINE SYNC TRACKING
CREATE TABLE IF NOT EXISTS public.offline_sync_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id),
  action_type text NOT NULL,
  payload jsonb NOT NULL,
  synced boolean DEFAULT false,
  synced_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_offline_sync_student ON offline_sync_queue(student_id);
CREATE INDEX IF NOT EXISTS idx_offline_sync_synced ON offline_sync_queue(synced);

-- RLS for offline sync
ALTER TABLE offline_sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can manage their sync queue"
  ON offline_sync_queue
  FOR ALL
  TO authenticated
  USING (student_id = auth.uid());

COMMENT ON TABLE offline_sync_queue IS 'PWA offline action queue for sync when online';

-- Function to auto-update exam readiness
CREATE OR REPLACE FUNCTION check_exam_readiness()
RETURNS TRIGGER AS $$
DECLARE
  total_hours numeric;
  required_hours numeric := 2000; -- Barber apprenticeship requirement
BEGIN
  -- Calculate total approved hours
  SELECT COALESCE(SUM(hours), 0) INTO total_hours
  FROM apprenticeship_hours
  WHERE student_id = NEW.student_id
  AND approved = true;

  -- Update or insert exam readiness
  INSERT INTO exam_readiness (student_id, hours_complete)
  VALUES (NEW.student_id, total_hours >= required_hours)
  ON CONFLICT (student_id)
  DO UPDATE SET
    hours_complete = total_hours >= required_hours,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update exam readiness when hours are approved
CREATE TRIGGER apprenticeship_hours_exam_readiness
  AFTER INSERT OR UPDATE ON apprenticeship_hours
  FOR EACH ROW
  WHEN (NEW.approved = true)
  EXECUTE FUNCTION check_exam_readiness();

-- Comments
COMMENT ON FUNCTION check_exam_readiness IS 'Auto-updates exam readiness when hours are approved';
