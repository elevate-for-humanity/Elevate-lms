-- external_course_completions
--
-- Tracks learner self-reported completion of partner-hosted external courses
-- (e.g. CareerSafe OSHA 10/30). manual_completion_enabled must be true on
-- the parent program_external_courses row for a record to be written here.

CREATE TABLE IF NOT EXISTS external_course_completions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  external_course_id  uuid NOT NULL REFERENCES program_external_courses(id) ON DELETE CASCADE,
  program_id          uuid NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  completed_at        timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now()

  UNIQUE (user_id, external_course_id)
);

ALTER TABLE external_course_completions ENABLE ROW LEVEL SECURITY;

-- Learners can read and insert their own completions
CREATE POLICY "learner_read_own_completions"
  ON external_course_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "learner_insert_own_completions"
  ON external_course_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins and staff can read all
CREATE POLICY "admin_read_all_completions"
  ON external_course_completions FOR SELECT
  USING (is_admin());

CREATE INDEX idx_ext_completions_user    ON external_course_completions(user_id);
CREATE INDEX idx_ext_completions_program ON external_course_completions(program_id);
