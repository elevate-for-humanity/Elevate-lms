-- workone_checklist
--
-- Per-student checklist tracking progress through WorkOne intake and
-- funding source steps. Seeded automatically when a student submits an
-- application with a WorkOne/WIOA funding source.
--
-- Steps are funding-source-specific (see /api/workone/seed).
-- Students update their own rows; staff can update any row.

CREATE TABLE IF NOT EXISTS workone_checklist (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  step_key        text NOT NULL,
  step_label      text NOT NULL,
  status          text NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo', 'in_progress', 'done')),
  notes           text,
  due_date        date,
  completed_at    timestamptz,
  sort_order      integer NOT NULL DEFAULT 0,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),

  UNIQUE (user_id, step_key)
);

-- Students read/update their own rows
ALTER TABLE workone_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "student_own_checklist"
  ON workone_checklist FOR ALL TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "admin_all_checklist"
  ON workone_checklist FOR ALL TO authenticated
  USING  (is_admin_role())
  WITH CHECK (is_admin_role());

-- updated_at trigger
CREATE OR REPLACE FUNCTION workone_checklist_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_workone_checklist_updated_at ON workone_checklist;
CREATE TRIGGER trg_workone_checklist_updated_at
  BEFORE UPDATE ON workone_checklist
  FOR EACH ROW EXECUTE FUNCTION workone_checklist_set_updated_at();

CREATE INDEX IF NOT EXISTS idx_workone_checklist_user
  ON workone_checklist(user_id, sort_order);
