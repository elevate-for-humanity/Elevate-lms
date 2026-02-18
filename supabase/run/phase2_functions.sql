-- ================================================================
-- PHASE 2: FUNCTIONS + TRIGGERS
-- Run after Phase 1 (tables must exist).
-- All use CREATE OR REPLACE — safe to re-run.
-- ================================================================

-- Check if user has signed required agreements
CREATE OR REPLACE FUNCTION check_user_agreements(
  p_user_id UUID,
  p_required_types TEXT[]
)
RETURNS TABLE (
  agreement_type TEXT,
  is_signed BOOLEAN,
  signed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    req.type,
    (laa.id IS NOT NULL) as is_signed,
    laa.accepted_at as signed_at
  FROM unnest(p_required_types) AS req(type)
  LEFT JOIN license_agreement_acceptances laa 
    ON laa.agreement_type = req.type 
    AND laa.user_id = p_user_id
    AND laa.document_version = COALESCE(
      (SELECT current_version FROM agreement_versions WHERE agreement_versions.agreement_type = req.type LIMIT 1),
      '1.0'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Prevent modification of immutable records
CREATE OR REPLACE FUNCTION prevent_agreement_modification()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'Record is immutable and cannot be modified. ID: %', OLD.id;
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Record is immutable and cannot be deleted. ID: %', OLD.id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Immutability triggers
DROP TRIGGER IF EXISTS enforce_agreement_immutability ON license_agreement_acceptances;
CREATE TRIGGER enforce_agreement_immutability
  BEFORE UPDATE OR DELETE ON license_agreement_acceptances
  FOR EACH ROW EXECUTE FUNCTION prevent_agreement_modification();

DROP TRIGGER IF EXISTS enforce_handbook_immutability ON handbook_acknowledgments;
CREATE TRIGGER enforce_handbook_immutability
  BEFORE UPDATE OR DELETE ON handbook_acknowledgments
  FOR EACH ROW EXECUTE FUNCTION prevent_agreement_modification();

DROP TRIGGER IF EXISTS enforce_audit_log_immutability ON compliance_audit_log;
CREATE TRIGGER enforce_audit_log_immutability
  BEFORE UPDATE OR DELETE ON compliance_audit_log
  FOR EACH ROW EXECUTE FUNCTION prevent_agreement_modification();

-- Log agreement acceptance to audit log
CREATE OR REPLACE FUNCTION log_agreement_acceptance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO compliance_audit_log (
    event_type, user_id, user_email, target_table, target_id, tenant_id,
    details, ip_address, user_agent
  ) VALUES (
    'agreement_signed', NEW.user_id, NEW.signer_email,
    'license_agreement_acceptances', NEW.id, NEW.tenant_id,
    jsonb_build_object(
      'agreement_type', NEW.agreement_type,
      'document_version', NEW.document_version,
      'signature_method', NEW.signature_method,
      'acceptance_context', NEW.acceptance_context
    ),
    NEW.ip_address::inet, NEW.user_agent
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW; -- Don't block the insert if audit logging fails
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_agreement_acceptance_trigger ON license_agreement_acceptances;
CREATE TRIGGER log_agreement_acceptance_trigger
  AFTER INSERT ON license_agreement_acceptances
  FOR EACH ROW EXECUTE FUNCTION log_agreement_acceptance();

-- Log handbook acknowledgment to audit log
CREATE OR REPLACE FUNCTION log_handbook_acknowledgment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO compliance_audit_log (
    event_type, user_id, target_table, target_id, tenant_id,
    details, ip_address, user_agent
  ) VALUES (
    'handbook_ack', NEW.user_id,
    'handbook_acknowledgments', NEW.id, NEW.tenant_id,
    jsonb_build_object(
      'handbook_version', NEW.handbook_version,
      'attendance_policy_ack', NEW.attendance_policy_ack,
      'conduct_policy_ack', NEW.conduct_policy_ack,
      'safety_policy_ack', NEW.safety_policy_ack
    ),
    NEW.ip_address, NEW.user_agent
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_handbook_ack_trigger ON handbook_acknowledgments;
CREATE TRIGGER log_handbook_ack_trigger
  AFTER INSERT ON handbook_acknowledgments
  FOR EACH ROW EXECUTE FUNCTION log_handbook_acknowledgment();

-- Check if user has completed onboarding
CREATE OR REPLACE FUNCTION is_onboarding_complete(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_status onboarding_status;
BEGIN
  SELECT status INTO v_status FROM onboarding_progress WHERE user_id = p_user_id;
  RETURN COALESCE(v_status = 'completed', FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
