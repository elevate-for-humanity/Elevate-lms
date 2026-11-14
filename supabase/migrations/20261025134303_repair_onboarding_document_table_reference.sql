CREATE OR REPLACE FUNCTION public.verify_enrollment_complete_internal(p_user_id uuid)
 RETURNS TABLE(requirement text, status text, verified boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
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

  SELECT EXISTS(SELECT 1 FROM public.documents
    WHERE user_id = p_user_id AND document_type = 'government_id')
  INTO v_gov_id;

  SELECT EXISTS(SELECT 1 FROM public.documents
    WHERE user_id = p_user_id AND document_type = 'social_security_card')
  INTO v_ssn_card;

  SELECT EXISTS(SELECT 1 FROM public.documents
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
$function$
