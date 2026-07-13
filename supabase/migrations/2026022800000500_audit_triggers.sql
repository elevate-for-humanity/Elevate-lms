-- Audit triggers for HIGH-severity tables.
-- These fire on INSERT/UPDATE/DELETE and write to audit_logs.
-- This is the safety net: even if application code misses an audit call,
-- the database trigger captures the mutation.
--
-- The trigger uses auth.uid() when available (RLS context) and falls back
-- to the session user for service-role operations.

CREATE OR REPLACE FUNCTION audit_trigger_fn()
RETURNS TRIGGER AS $$
DECLARE
  _user_id uuid;
  _action text;
  _target_id text;
  _metadata jsonb;
BEGIN
  -- Resolve actor: auth.uid() in RLS context, or current_user for service role
  BEGIN
    _user_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    _user_id := NULL;
  END;

  -- Determine action
  _action := TG_TABLE_NAME || '_' || lower(TG_OP);

  -- Determine target ID
  IF TG_OP = 'DELETE' THEN
    _target_id := OLD.id::text;
    _metadata := jsonb_build_object('op', 'DELETE', 'old_row', to_jsonb(OLD) - 'ssn' - 'ssn_hash' - 'password');
  ELSIF TG_OP = 'INSERT' THEN
    _target_id := NEW.id::text;
    _metadata := jsonb_build_object('op', 'INSERT');
  ELSE
    _target_id := NEW.id::text;
    -- Capture changed columns only (diff), excluding PII
    _metadata := jsonb_build_object(
      'op', 'UPDATE',
      'changed_columns', (
        SELECT jsonb_object_agg(key, value)
        FROM jsonb_each(to_jsonb(NEW))
        WHERE key NOT IN (
          'ssn', 'ssn_hash', 'ssn_last4', 'ssn_last_4', 'password',
          'date_of_birth', 'dob',
          'address', 'address_line1', 'address_line2', 'street_address',
          'phone', 'phone_number', 'mobile',
          'file_path', 'file_url', 'signed_url', 'document_url',
          'tax_id', 'itin', 'ein',
          'bank_account', 'routing_number', 'account_number',
          'driver_license', 'state_id', 'government_id',
          'created_at'
        )
          AND (to_jsonb(OLD) -> key) IS DISTINCT FROM value
      )
    );
  END IF;

  -- Write audit log (best-effort, never block the mutation)
  BEGIN
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, metadata, created_at)
    VALUES (_user_id, _action, TG_TABLE_NAME, _target_id, _metadata, now());
  EXCEPTION WHEN OTHERS THEN
    -- Swallow errors: audit must not block operations
    RAISE WARNING 'audit_trigger_fn failed for %.%: %', TG_TABLE_NAME, TG_OP, SQLERRM;
  END;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply triggers to HIGH-severity tables
-- These are the tables where unaudited mutations are a compliance risk.

DO $$
DECLARE
  _tables text[] := ARRAY[
    'profiles',
    'licenses',
    'license_requests',
    'program_holders',
    'program_holder_verification',
    'program_holder_documents',
    'program_holder_banking',
    'wotc_applications',
    'grant_applications',
    'grant_opportunities',
    'tax_applications',
    'tax_filing_applications',
    'apprentice_payroll',
    'documents',
    'id_verifications',
    'signatures',
    'transfer_hours',
    'partner_inquiries',
    'affiliates',
    'applications',
    'wioa_applications',
    'wioa_participants',
    'certificates',
    'issued_certificates',
    'automated_decisions'
  ];
  _t text;
BEGIN
  FOREACH _t IN ARRAY _tables LOOP
    -- Drop existing trigger if any
    EXECUTE format('DROP TRIGGER IF EXISTS audit_trigger ON %I', _t);
    -- Create trigger
    EXECUTE format(
      'CREATE TRIGGER audit_trigger
       AFTER INSERT OR UPDATE OR DELETE ON %I
       FOR EACH ROW EXECUTE FUNCTION audit_trigger_fn()',
      _t
    );
    RAISE NOTICE 'Created audit trigger on %', _t;
  END LOOP;
END;
$$;
