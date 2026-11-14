-- Actor propagation for service-role writes.
-- When the application uses the service role key (bypassing RLS),
-- auth.uid() returns NULL. This migration updates the audit trigger
-- to read actor context from PostgreSQL session variables set by the app.
--
-- Application code sets these before writes:
--   await db.rpc('set_audit_context', { actor_user_id: '...', system_actor: 'stripe_webhook' })
-- or via raw SQL:
--   SET LOCAL app.actor_user_id = '...';
--   SET LOCAL app.system_actor = 'stripe_webhook';

-- RPC function for setting audit context from the application layer.
-- Uses SET LOCAL so the context is scoped to the current transaction.
CREATE OR REPLACE FUNCTION set_audit_context(
  actor_user_id text DEFAULT NULL,
  system_actor text DEFAULT NULL,
  request_id text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  IF actor_user_id IS NOT NULL THEN
    PERFORM set_config('app.actor_user_id', actor_user_id, true);
  END IF;
  IF system_actor IS NOT NULL THEN
    PERFORM set_config('app.system_actor', system_actor, true);
  END IF;
  IF request_id IS NOT NULL THEN
    PERFORM set_config('app.request_id', request_id, true);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the audit trigger to read actor context from session variables.
CREATE OR REPLACE FUNCTION audit_trigger_fn()
RETURNS TRIGGER AS $$
DECLARE
  _user_id uuid;
  _system_actor text;
  _request_id text;
  _action text;
  _target_id text;
  _metadata jsonb;
BEGIN
  -- Resolve actor: auth.uid() first, then session variable, then NULL
  BEGIN
    _user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    _user_id := NULL;
  END;

  -- If auth.uid() is NULL (service role), check session variable
  IF _user_id IS NULL THEN
    BEGIN
      _user_id := current_setting('app.actor_user_id', true)::uuid;
    EXCEPTION WHEN OTHERS THEN
      _user_id := NULL;
    END;
  END IF;

  -- Read system actor (webhook name, cron job, etc.)
  BEGIN
    _system_actor := current_setting('app.system_actor', true);
  EXCEPTION WHEN OTHERS THEN
    _system_actor := NULL;
  END;

  -- Read request ID for correlation
  BEGIN
    _request_id := current_setting('app.request_id', true);
  EXCEPTION WHEN OTHERS THEN
    _request_id := NULL;
  END;

  _action := TG_TABLE_NAME || '_' || lower(TG_OP);

  IF TG_OP = 'DELETE' THEN
    _target_id := OLD.id::text;
    _metadata := jsonb_build_object(
      'op', 'DELETE',
      'trigger', true,
      'system_actor', _system_actor,
      'request_id', _request_id
    );
  ELSIF TG_OP = 'INSERT' THEN
    _target_id := NEW.id::text;
    _metadata := jsonb_build_object(
      'op', 'INSERT',
      'trigger', true,
      'system_actor', _system_actor,
      'request_id', _request_id
    );
  ELSE
    _target_id := NEW.id::text;
    _metadata := jsonb_build_object(
      'op', 'UPDATE',
      'trigger', true,
      'system_actor', _system_actor,
      'request_id', _request_id,
      'changed_columns', (
        SELECT jsonb_object_agg(key, value)
        FROM jsonb_each(to_jsonb(NEW))
        WHERE key NOT IN ('ssn', 'ssn_hash', 'password', 'created_at')
          AND (to_jsonb(OLD) -> key) IS DISTINCT FROM value
      )
    );
  END IF;

  BEGIN
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata, created_at)
    VALUES (_user_id, _action, TG_TABLE_NAME, _target_id, _metadata, now());
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'audit_trigger_fn failed for %.%: %', TG_TABLE_NAME, TG_OP, SQLERRM;
  END;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
