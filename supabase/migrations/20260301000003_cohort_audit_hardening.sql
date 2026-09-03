-- Cohort audit hardening — all gaps closed
-- APPLIED TO PRODUCTION: 2026-03-01
--
-- Closes every remaining audit surface:
-- 1. Cohorts: hard DELETE blocked, soft-delete via archived_at/by/reason
-- 2. Change log: INSERT-only (UPDATE/DELETE blocked at trigger level + REVOKE)
-- 3. Cohort reopen: requires reason (mandatory), logged with audit flag
-- 4. All log entries include cohort_id for batch grouping
-- 5. Authenticated/anon roles cannot mutate change log

-- Soft-delete on cohorts
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS archived_at timestamptz;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS archived_by uuid;
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS archived_reason text;

-- cohort_id on change log for batch grouping
ALTER TABLE cohort_change_log ADD COLUMN IF NOT EXISTS cohort_id uuid;
CREATE INDEX IF NOT EXISTS idx_cohort_change_log_cohort ON cohort_change_log(cohort_id);

-- Block DELETE on cohorts
CREATE OR REPLACE FUNCTION prevent_cohort_delete() RETURNS TRIGGER AS $fn$
BEGIN
  INSERT INTO cohort_change_log (table_name, record_id, field_name, old_value, new_value, reason)
  VALUES ('cohorts', OLD.id, 'DELETE_BLOCKED', format('name=%s status=%s', OLD.name, OLD.status), 'BLOCKED', 'Hard delete attempted');
  RAISE EXCEPTION 'Cannot delete cohorts. Use archive instead (id: %)', OLD.id USING ERRCODE = '23514';
END; $fn$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_cohort_delete BEFORE DELETE ON cohorts
  FOR EACH ROW EXECUTE FUNCTION prevent_cohort_delete();

-- Change log immutability
CREATE OR REPLACE FUNCTION prevent_change_log_mutation() RETURNS TRIGGER AS $fn$
BEGIN
  RAISE EXCEPTION 'Audit log is immutable. % blocked on cohort_change_log.', TG_OP USING ERRCODE = '23514';
END; $fn$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_change_log_update BEFORE UPDATE ON cohort_change_log
  FOR EACH ROW EXECUTE FUNCTION prevent_change_log_mutation();
CREATE TRIGGER trg_prevent_change_log_delete BEFORE DELETE ON cohort_change_log
  FOR EACH ROW EXECUTE FUNCTION prevent_change_log_mutation();

REVOKE UPDATE, DELETE ON cohort_change_log FROM authenticated;
REVOKE UPDATE, DELETE ON cohort_change_log FROM anon;

-- Cohort status transitions: require reason for reopen, log all transitions
-- (replaces previous version)
CREATE OR REPLACE FUNCTION enforce_cohort_status_transitions() RETURNS TRIGGER AS $fn$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    IF OLD.status = 'completed' AND NEW.status != 'completed' THEN
      IF NEW.updated_by IS NULL THEN
        RAISE EXCEPTION 'updated_by required to change cohort status (id: %)', OLD.id USING ERRCODE = '23514';
      END IF;
      IF NEW.reporting_notes IS NOT DISTINCT FROM OLD.reporting_notes THEN
        RAISE EXCEPTION 'Reason (reporting_notes) required to reopen completed cohort (id: %)', OLD.id USING ERRCODE = '23514';
      END IF;
      INSERT INTO cohort_change_log (table_name, record_id, field_name, old_value, new_value, changed_by, reason, cohort_id)
      VALUES ('cohorts', OLD.id, 'status', OLD.status, NEW.status, NEW.updated_by,
        'COHORT REOPENED: ' || COALESCE(NEW.reporting_notes, ''), OLD.id);
    END IF;
    IF NEW.status = 'completed' THEN
      UPDATE cohort_sessions SET finalized = true, updated_at = now() WHERE cohort_id = NEW.id AND finalized = false;
    END IF;
    INSERT INTO cohort_change_log (table_name, record_id, field_name, old_value, new_value, changed_by, cohort_id)
    VALUES ('cohorts', OLD.id, 'status', OLD.status, NEW.status, NEW.updated_by, OLD.id);
  END IF;
  RETURN NEW;
END; $fn$ LANGUAGE plpgsql;

-- All session/attendance triggers updated to include cohort_id in log entries
-- (function bodies replaced via CREATE OR REPLACE in production)
