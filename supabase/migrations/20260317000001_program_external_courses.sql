-- program_external_courses
--
-- Stores partner-hosted training items attached to a program.
-- These are NOT internal LMS courses. They are external URLs that learners
-- click through to. They live in a separate table so they never pollute
-- training_courses or training_lessons with fake/empty rows.
--
-- Completion for external items is admin-managed (manual_completion_enabled).
-- When true, an admin can mark a learner's external item as complete via
-- program_external_completions. Auto-tracking is not possible for external URLs.

CREATE TABLE IF NOT EXISTS program_external_courses (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id              UUID NOT NULL,
  partner_name            TEXT NOT NULL,
  title                   TEXT NOT NULL,
  external_url            TEXT NOT NULL CHECK (external_url ~* '^https?://'),
  description             TEXT,
  duration_display        TEXT,                          -- e.g. "4 hours", "2 weeks"
  credential_type         TEXT,                          -- e.g. "Certificate", "Badge", "CEU"
  credential_name         TEXT,                          -- e.g. "OSHA 10-Hour Card"
  enrollment_instructions TEXT,
  opens_in_new_tab        BOOLEAN NOT NULL DEFAULT true,
  is_required             BOOLEAN NOT NULL DEFAULT true,
  sort_order              INTEGER NOT NULL DEFAULT 0,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  manual_completion_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by              UUID REFERENCES profiles(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_pec_program_id ON program_external_courses(program_id);
CREATE INDEX IF NOT EXISTS idx_pec_sort      ON program_external_courses(program_id, sort_order);

-- Admin-managed completion records for external items
CREATE TABLE IF NOT EXISTS program_external_completions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_course_id UUID NOT NULL REFERENCES program_external_courses(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_id        UUID NOT NULL,
  completed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  marked_by         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  notes             TEXT,
  proof_url         TEXT-- optional upload link
  UNIQUE (external_course_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_pec_completions_user    ON program_external_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_pec_completions_program ON program_external_completions(program_id);

-- RLS
ALTER TABLE program_external_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_external_completions ENABLE ROW LEVEL SECURITY;

-- Admins and staff manage external courses
CREATE POLICY "pec_admin_all" ON program_external_courses
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'org_admin', 'staff')
    )
  );

-- Authenticated learners can read active external courses
CREATE POLICY "pec_learner_read" ON program_external_courses
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Admins manage completions
CREATE POLICY "pec_completions_admin_all" ON program_external_completions
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'org_admin', 'staff')
    )
  );

-- Learners can read their own completions
CREATE POLICY "pec_completions_learner_read" ON program_external_completions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT ON program_external_courses TO authenticated;
GRANT ALL    ON program_external_courses TO service_role;
GRANT SELECT ON program_external_completions TO authenticated;
GRANT ALL    ON program_external_completions TO service_role;
