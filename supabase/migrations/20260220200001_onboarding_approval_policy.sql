-- ============================================================
-- Enrollment Verification & Auto-Approval Policy
--
-- verify_enrollment_complete(user_id) checks ALL 9 requirements:
--   1. Profile complete (name, phone, email)
--   2. Enrollment agreement signed
--   3. Participation agreement signed
--   4. FERPA consent signed
--   5. Student handbook acknowledged (all 5 policies)
--   6. Government ID uploaded
--   7. Social Security card uploaded
--   8. Transfer hours documentation uploaded
--   9. Orientation completed
--
-- Only when ALL pass → application approved, enrollment activated
-- Trigger fires on UPDATE to onboarding_progress
-- ============================================================

CREATE OR REPLACE FUNCTION verify_enrollment_complete(p_user_id UUID)
RETURNS TABLE(requirement TEXT, status TEXT, verified BOOLEAN) AS $$
DECLARE
  v_profile_ok           BOOLEAN := false;
  v_enrollment_signed    BOOLEAN := false;
  v_participation_signed BOOLEAN := false;
  v_ferpa_signed         BOOLEAN := false;
  v_handbook_ok          BOOLEAN := false;
  v_gov_id               BOOLEAN := false;
  v_ssn_card             BOOLEAN := false;
  v_transfer_hours       BOOLEAN := false;
  v_orientation_ok       BOOLEAN := false;
  v_all_passed           BOOLEAN := false;
BEGIN
  SELECT (full_name IS NOT NULL AND phone IS NOT NULL AND email IS NOT NULL)
  INTO v_profile_ok FROM profiles WHERE id = p_user_id;

  SELECT (orientation_completed = true)
  INTO v_orientation_ok FROM profiles WHERE id = p_user_id;

  SELECT EXISTS(SELECT 1 FROM license_agreement_acceptances
    WHERE user_id = p_user_id AND agreement_type = 'enrollment')
  INTO v_enrollment_signed;

  SELECT EXISTS(SELECT 1 FROM license_agreement_acceptances
    WHERE user_id = p_user_id AND agreement_type = 'participation')
  INTO v_participation_signed;

  SELECT EXISTS(SELECT 1 FROM license_agreement_acceptances
    WHERE user_id = p_user_id AND agreement_type = 'ferpa')
  INTO v_ferpa_signed;

  SELECT EXISTS(SELECT 1 FROM handbook_acknowledgments
    WHERE user_id = p_user_id AND full_acknowledgment = true)
  INTO v_handbook_ok;

  SELECT EXISTS(SELECT 1 FROM user_documents
    WHERE user_id = p_user_id AND document_type = 'government_id')
  INTO v_gov_id;

  SELECT EXISTS(SELECT 1 FROM user_documents
    WHERE user_id = p_user_id AND document_type = 'social_security_card')
  INTO v_ssn_card;

  SELECT EXISTS(SELECT 1 FROM user_documents
    WHERE user_id = p_user_id AND document_type = 'transfer_hours')
  INTO v_transfer_hours;

  v_all_passed :=
    COALESCE(v_profile_ok, false)
    AND v_enrollment_signed AND v_participation_signed AND v_ferpa_signed
    AND v_handbook_ok
    AND v_gov_id AND v_ssn_card AND v_transfer_hours
    AND COALESCE(v_orientation_ok, false);

  IF v_all_passed THEN
    UPDATE applications SET status = 'approved', updated_at = NOW()
    WHERE user_id = p_user_id AND status = 'pending';

    UPDATE program_enrollments
    SET enrollment_state = 'approved', status = 'active', next_required_action = NULL
    WHERE user_id = p_user_id AND enrollment_state = 'onboarding';

    UPDATE onboarding_progress
    SET is_complete = true, status = 'complete', completed_at = NOW()
    WHERE user_id = p_user_id;
  END IF;

  RETURN QUERY SELECT 'Profile complete'::TEXT, CASE WHEN COALESCE(v_profile_ok,false) THEN 'verified' ELSE 'missing' END, COALESCE(v_profile_ok,false);
  RETURN QUERY SELECT 'Enrollment agreement signed'::TEXT, CASE WHEN v_enrollment_signed THEN 'verified' ELSE 'missing' END, v_enrollment_signed;
  RETURN QUERY SELECT 'Participation agreement signed'::TEXT, CASE WHEN v_participation_signed THEN 'verified' ELSE 'missing' END, v_participation_signed;
  RETURN QUERY SELECT 'FERPA consent signed'::TEXT, CASE WHEN v_ferpa_signed THEN 'verified' ELSE 'missing' END, v_ferpa_signed;
  RETURN QUERY SELECT 'Student handbook acknowledged'::TEXT, CASE WHEN v_handbook_ok THEN 'verified' ELSE 'missing' END, v_handbook_ok;
  RETURN QUERY SELECT 'Government ID uploaded'::TEXT, CASE WHEN v_gov_id THEN 'verified' ELSE 'missing' END, v_gov_id;
  RETURN QUERY SELECT 'Social Security card uploaded'::TEXT, CASE WHEN v_ssn_card THEN 'verified' ELSE 'missing' END, v_ssn_card;
  RETURN QUERY SELECT 'Transfer hours documentation'::TEXT, CASE WHEN v_transfer_hours THEN 'verified' ELSE 'missing' END, v_transfer_hours;
  RETURN QUERY SELECT 'Orientation completed'::TEXT, CASE WHEN COALESCE(v_orientation_ok,false) THEN 'verified' ELSE 'missing' END, COALESCE(v_orientation_ok,false);
  RETURN QUERY SELECT 'ALL REQUIREMENTS MET'::TEXT, CASE WHEN v_all_passed THEN 'APPROVED' ELSE 'INCOMPLETE' END, v_all_passed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION trg_check_enrollment_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.profile_completed = true
     AND NEW.agreements_completed = true
     AND NEW.handbook_acknowledged = true
     AND NEW.documents_uploaded = true
     AND (OLD.is_complete IS DISTINCT FROM true)
  THEN
    PERFORM verify_enrollment_complete(NEW.user_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_onboarding_approval ON onboarding_progress;
CREATE TRIGGER trg_onboarding_approval
  BEFORE UPDATE ON onboarding_progress
  FOR EACH ROW
  EXECUTE FUNCTION trg_check_enrollment_approval();
