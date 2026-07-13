-- Cohort audit trail + immutability hardening
-- APPLIED TO PRODUCTION: 2026-03-01
--
-- Makes cohort instructional records tamper-evident:
-- - All INSERTs and UPDATEs logged to cohort_change_log
-- - Hard DELETEs blocked on sessions and attendance (no exceptions)
-- - Completed cohorts auto-finalize sessions; reopening is logged
-- - Reason field for audit-grade change justification

-- 1. Audit fields
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS updated_by uuid;
ALTER TABLE cohort_sessions ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE cohort_sessions ADD COLUMN IF NOT EXISTS updated_by uuid;
ALTER TABLE cohort_sessions ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
ALTER TABLE cohort_sessions ADD COLUMN IF NOT EXISTS finalized boolean DEFAULT false;
ALTER TABLE cohort_attendance ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE cohort_attendance ADD COLUMN IF NOT EXISTS updated_by uuid;
ALTER TABLE cohort_attendance ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Change log table
CREATE TABLE IF NOT EXISTS cohort_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  field_name text NOT NULL,
  old_value text,
  new_value text,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now(),
  reason text
);

CREATE INDEX IF NOT EXISTS idx_cohort_change_log_record ON cohort_change_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_cohort_change_log_time ON cohort_change_log(changed_at);
ALTER TABLE cohort_change_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_change_log" ON cohort_change_log FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. Session UPDATE trigger (logs changes, blocks finalized edits)
CREATE OR REPLACE FUNCTION log_cohort_session_changes()
RETURNS TRIGGER AS $fn$
BEGIN
  IF OLD.finalized = true THEN
    RAISE EXCEPTION 'Cannot modify finalized session (id: %)', OLD.id USING ERRCODE = '23514';
  END IF;
  IF OLD.session_date IS DISTINCT FROM NEW.session_date THEN
    INSERT INTO cohort_change_log (table_name, record_id, field_name, old_value, new_value, changed_by)
    VALUES ('cohort_sessions', OLD.id, 'session_date', OLD.session_date::text, NEW.session_date::text, NEW.updated_by);
  END IF;
  IF OLD.delivered_minutes IS DISTINCT FROM NEW.delivered_minutes THEN
    INSERT INTO cohort_change_log (table_name, record_id, field_name, old_value, new_value, changed_by)
    VALUES ('cohort_sessions', OLD.id, 'delivered_minutes', OLD.delivered_minutes::text, NEW.delivered_minutes::text, NEW.updated_by);
  END IF;
  IF OLD.duration_minutes IS DISTINCT FROM NEW.duration_minutes THEN
    INSERT INTO cohort_change_log (table_name, record_id, field_name, old_value, new_value, changed_by)
    VALUES ('cohort_sessions', OLD.id, 'duration_minutes', OLD.duration_minutes::text, NEW.duration_minutes::text, NEW.updated_by);
  END IF;
  IF OLD.start_time IS DISTINCT FROM NEW.start_time THEN
    INSERT INTO cohort_change_log (table_name, record_id, field_name, old_value, new_value, changed_by)
    VALUES ('cohort_sessions', OLD.id, 'start_time', OLD.start_time::text, NEW.start_time::text, NEW.updated_by);
  END IF;
  IF OLD.end_time IS DISTINCT FROM NEW.end_time THEN
    INSERT INTO cohort_change_log (table_name, record_id, field_name, old_value, new_value, changed_by)
    VALUES ('cohort_sessions', OLD.id, 'end_time', OLD.end_time::text, NEW.end_time::text, NEW.updated_by);
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

-- 4. Session INSERT trigger (logs creation)
CREATE OR REPLACE FUNCTION log_cohort_session_insert()
RETURNS TRIGGER AS $fn$
BEGIN
  INSERT INTO cohort_change_log (table_name, record_id, field_name, old_value, new_value, changed_by)
  VALUES ('cohort_sessions', NEW.id, 'CREATED', NULL,
    format('date=%s time=%s-%s minutes=%s modality=%s', NEW.session_date, NEW.start_time, NEW.end_time, NEW.duration_minutes, NEW.modality),
    NEW.created_by);
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

-- 5. Session DELETE trigger (blocks all deletes)
CREATE OR REPLACE FUNCTION prevent_session_delete()
RETURNS TRIGGER AS $fn$
BEGIN
  INSERT INTO cohort_change_log (table_name, record_id, field_name, old_value, new_value, changed_by, reason)
  VALUES ('cohort_sessions', OLD.id, 'DELETE_BLOCKED',
    format('date=%s finalized=%s', OLD.session_date, OLD.finalized), 'BLOCKED', NULL, 'Hard delete attempted');
  RAISE EXCEPTION 'Cannot delete session records (id: %)', OLD.id USING ERRCODE = '23514';
END;
$fn$ LANGUAGE plpgsql;

-- 6. Attendance UPDATE trigger (logs changes, blocks finalized)
CREATE OR REPLACE FUNCTION log_cohort_attendance_changes()
RETURNS TRIGGER AS $fn$
BEGIN
  IF EXISTS (SELECT 1 FROM cohort_sessions WHERE id = OLD.cohort_session_id AND finalized = true) THEN
    RAISE EXCEPTION 'Cannot modify attendance for finalized session (id: %)', OLD.id USING ERRCODE = '23514';
  END IF;
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO cohort_change_log (table_name, record_id, field_name, old_value, new_value, changed_by)
    VALUES ('cohort_attendance', OLD.id, 'status', OLD.status, NEW.status, NEW.updated_by);
  END IF;
  IF OLD.minutes_attended IS DISTINCT FROM NEW.minutes_attended THEN
    INSERT INTO cohort_change_log (table_name, record_id, field_name, old_value, new_value, changed_by)
    VALUES ('cohort_attendance', OLD.id, 'minutes_attended', OLD.minutes_attended::text, NEW.minutes_attended::text, NEW.updated_by);
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

-- 7. Attendance INSERT trigger (logs creation)
CREATE OR REPLACE FUNCTION log_cohort_attendance_insert()
RETURNS TRIGGER AS $fn$
BEGIN
  INSERT INTO cohort_change_log (table_name, record_id, field_name, old_value, new_value, changed_by)
  VALUES ('cohort_attendance', NEW.id, 'CREATED', NULL,
    format('user=%s status=%s minutes=%s', NEW.user_id, NEW.status, NEW.minutes_attended),
    NEW.created_by);
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;

-- 8. Attendance DELETE trigger (blocks all deletes)
CREATE OR REPLACE FUNCTION prevent_attendance_delete()
RETURNS TRIGGER AS $fn$
BEGIN
  INSERT INTO cohort_change_log (table_name, record_id, field_name, old_value, new_value, changed_by, reason)
  VALUES ('cohort_attendance', OLD.id, 'DELETE_BLOCKED',
    format('user=%s status=%s', OLD.user_id, OLD.status), 'BLOCKED', NULL, 'Hard delete attempted');
  RAISE EXCEPTION 'Cannot delete attendance records (id: %)', OLD.id USING ERRCODE = '23514';
END;
$fn$ LANGUAGE plpgsql;

-- 9. Cohort status transition trigger (finalize on complete, log reopening)
CREATE OR REPLACE FUNCTION enforce_cohort_status_transitions()
RETURNS TRIGGER AS $fn$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
      INSERT INTO cohort_change_log (table_name, record_id, field_name, old_value, new_value, changed_by, reason)
      VALUES ('cohorts', OLD.id, 'status', OLD.status, NEW.status, NEW.updated_by, 'COHORT REOPENED - requires audit review');
    END IF;
    IF NEW.status = 'completed' THEN
      UPDATE cohort_sessions SET finalized = true, updated_at = now()
      WHERE cohort_id = NEW.id AND finalized = false;
    END IF;
    INSERT INTO cohort_change_log (table_name, record_id, field_name, old_value, new_value, changed_by)
    VALUES ('cohorts', OLD.id, 'status', OLD.status, NEW.status, NEW.updated_by);
  END IF;
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql;
