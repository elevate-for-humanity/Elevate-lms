-- Automatic audit logging for partner identity changes.
-- Captures INSERT/UPDATE/DELETE on partner_users and role changes on profiles.
-- Uses the existing audit_logs table.

-- Trigger: log partner_users changes (link/unlink/role change)
CREATE OR REPLACE FUNCTION audit_partner_users_change()
RETURNS TRIGGER AS $fn$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (action, actor_id, target_type, target_id, metadata)
    VALUES (
      'partner.user_linked',
      NEW.user_id,
      'partner_users',
      NEW.id::text,
      jsonb_build_object(
        'partner_id', NEW.partner_id,
        'role', NEW.role,
        'operation', 'INSERT'
      )
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log if role or status changed
    IF OLD.role IS DISTINCT FROM NEW.role OR OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO audit_logs (action, actor_id, target_type, target_id, metadata)
      VALUES (
        'partner.user_role_changed',
        NEW.user_id,
        'partner_users',
        NEW.id::text,
        jsonb_build_object(
          'partner_id', NEW.partner_id,
          'old_role', OLD.role,
          'new_role', NEW.role,
          'old_status', OLD.status,
          'new_status', NEW.status,
          'operation', 'UPDATE'
        )
      );
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (action, actor_id, target_type, target_id, metadata)
    VALUES (
      'partner.user_unlinked',
      OLD.user_id,
      'partner_users',
      OLD.id::text,
      jsonb_build_object(
        'partner_id', OLD.partner_id,
        'role', OLD.role,
        'operation', 'DELETE'
      )
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_partner_users ON partner_users;
CREATE TRIGGER trg_audit_partner_users
  AFTER INSERT OR UPDATE OR DELETE ON partner_users
  FOR EACH ROW
  EXECUTE FUNCTION audit_partner_users_change();

-- Trigger: log profiles.role changes
CREATE OR REPLACE FUNCTION audit_profile_role_change()
RETURNS TRIGGER AS $fn$
BEGIN
  IF OLD.role IS DISTINCT FROM NEW.role THEN
    INSERT INTO audit_logs (action, actor_id, target_type, target_id, metadata)
    VALUES (
      'admin.user_role_change',
      NEW.id,
      'profiles',
      NEW.id::text,
      jsonb_build_object(
        'old_role', OLD.role,
        'new_role', NEW.role,
        'email', NEW.email
      )
    );
  END IF;
  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_profile_role ON profiles;
CREATE TRIGGER trg_audit_profile_role
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION audit_profile_role_change();

-- Extend webhook_events_processed to support JotForm provider
ALTER TABLE webhook_events_processed
  DROP CONSTRAINT IF EXISTS webhook_events_processed_provider_check;
ALTER TABLE webhook_events_processed
  ADD CONSTRAINT webhook_events_processed_provider_check
  CHECK (provider IN ('stripe', 'sezzle', 'affirm', 'jotform'));

-- Fix status constraint to include all valid states
ALTER TABLE webhook_events_processed
  DROP CONSTRAINT IF EXISTS webhook_events_processed_status_check;
ALTER TABLE webhook_events_processed
  ADD CONSTRAINT webhook_events_processed_status_check
  CHECK (status IN ('processing', 'processed', 'failed', 'skipped', 'errored'));
