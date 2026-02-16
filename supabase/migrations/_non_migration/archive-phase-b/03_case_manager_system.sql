-- supabase/migrations/03_case_manager_system.sql
-- Case Manager System: Assignments and Access Control

-- =====================================================
-- 1. USER PROFILES TABLE (if not exists)
-- =====================================================
-- Stores metadata for all users (students, admins, case managers, employers)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'case_manager', 'instructor', 'employer', 'program_holder', 'delegate')),
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  agency TEXT, -- For case managers: WorkOne, JRI, etc.
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Index for role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- =====================================================
-- 2. CASE MANAGER ASSIGNMENTS TABLE
-- =====================================================
-- Maps which learners belong to which case manager
CREATE TABLE IF NOT EXISTS case_manager_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  assigned_by UUID REFERENCES profiles(id), -- Admin who made the assignment
  notes TEXT, -- Assignment notes (e.g., "WorkOne referral", "JRI participant")
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'transferred', 'completed', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  
  -- Prevent duplicate assignments
  UNIQUE(case_manager_id, learner_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_case_mgr_cm_id ON case_manager_assignments(case_manager_id);
CREATE INDEX IF NOT EXISTS idx_case_mgr_learner_id ON case_manager_assignments(learner_id);
CREATE INDEX IF NOT EXISTS idx_case_mgr_status ON case_manager_assignments(status);

-- =====================================================
-- 3. CASE MANAGER NOTES TABLE
-- =====================================================
-- Track interactions, check-ins, barriers, and wins
CREATE TABLE IF NOT EXISTS case_manager_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  learner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  note_type TEXT DEFAULT 'check_in' CHECK (note_type IN ('check_in', 'barrier', 'win', 'coordination', 'other')),
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  updated_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- Index for learner notes
CREATE INDEX IF NOT EXISTS idx_cm_notes_learner ON case_manager_notes(learner_id);
CREATE INDEX IF NOT EXISTS idx_cm_notes_cm ON case_manager_notes(case_manager_id);
CREATE INDEX IF NOT EXISTS idx_cm_notes_created ON case_manager_notes(created_at DESC);

-- =====================================================
-- 4. HELPER FUNCTIONS
-- =====================================================

-- Function to get all learners assigned to a case manager
CREATE OR REPLACE FUNCTION get_case_manager_learners(cm_id UUID)
RETURNS TABLE (
  learner_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  assigned_at TIMESTAMPTZ,
  assignment_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    p.phone,
    cma.assigned_at,
    cma.status
  FROM profiles p
  INNER JOIN case_manager_assignments cma ON cma.learner_id = p.id
  WHERE cma.case_manager_id = cm_id
    AND cma.status = 'active'
  ORDER BY cma.assigned_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if a case manager has access to a learner
CREATE OR REPLACE FUNCTION case_manager_has_access(cm_id UUID, learner_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM case_manager_assignments
    WHERE case_manager_id = cm_id
      AND learner_id = learner_id
      AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_manager_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE case_manager_notes ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can see their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Profiles: Admins can see all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Profiles: Case managers can see their assigned learners
CREATE POLICY "Case managers can view assigned learners"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM case_manager_assignments cma
      WHERE cma.learner_id = profiles.id
        AND cma.case_manager_id = auth.uid()
        AND cma.status = 'active'
    )
  );

-- Case Manager Assignments: Case managers can see their own assignments
CREATE POLICY "Case managers can view own assignments"
  ON case_manager_assignments FOR SELECT
  USING (case_manager_id = auth.uid());

-- Case Manager Assignments: Admins can manage all assignments
CREATE POLICY "Admins can manage assignments"
  ON case_manager_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Case Manager Notes: Case managers can manage their own notes
CREATE POLICY "Case managers can manage own notes"
  ON case_manager_notes FOR ALL
  USING (case_manager_id = auth.uid());

-- Case Manager Notes: Admins can view all notes
CREATE POLICY "Admins can view all notes"
  ON case_manager_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- =====================================================
-- 6. ENROLLMENTS RLS FOR CASE MANAGERS
-- =====================================================

-- Case managers can see enrollments for their assigned learners
CREATE POLICY "Case managers can view assigned learner enrollments"
  ON enrollments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM case_manager_assignments cma
      WHERE cma.learner_id = enrollments.user_id
        AND cma.case_manager_id = auth.uid()
        AND cma.status = 'active'
    )
  );

-- =====================================================
-- 7. PROGRESS RLS FOR CASE MANAGERS
-- =====================================================

-- Case managers can see progress for their assigned learners
CREATE POLICY "Case managers can view assigned learner progress"
  ON progress FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM case_manager_assignments cma
      INNER JOIN enrollments e ON e.user_id = cma.learner_id
      WHERE e.id = progress.enrollment_id
        AND cma.case_manager_id = auth.uid()
        AND cma.status = 'active'
    )
  );

-- =====================================================
-- 8. CERTIFICATES RLS FOR CASE MANAGERS
-- =====================================================

-- Case managers can see certificates for their assigned learners
CREATE POLICY "Case managers can view assigned learner certificates"
  ON certificates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM case_manager_assignments cma
      WHERE cma.learner_id = certificates.user_id
        AND cma.case_manager_id = auth.uid()
        AND cma.status = 'active'
    )
  );

-- =====================================================
-- 9. TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_manager_assignments_updated_at
  BEFORE UPDATE ON case_manager_assignments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_case_manager_notes_updated_at
  BEFORE UPDATE ON case_manager_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE profiles IS 'User profiles with role-based access control';
COMMENT ON TABLE case_manager_assignments IS 'Maps case managers to their assigned learners';
COMMENT ON TABLE case_manager_notes IS 'Case manager interaction notes and coordination logs';
COMMENT ON FUNCTION get_case_manager_learners IS 'Returns all active learners assigned to a case manager';
COMMENT ON FUNCTION case_manager_has_access IS 'Checks if a case manager has access to a specific learner';
