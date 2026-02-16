-- ============================================================
-- CLAIM APPLICATIONS FOR AUTHENTICATED USER
-- Allows users to claim applications they submitted before logging in
-- ============================================================

CREATE OR REPLACE FUNCTION public.claim_applications_for_current_user()
RETURNS integer
LANGUAGE plpgsql
SECURITY definer
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_email text;
  v_count integer;
BEGIN
  v_uid := auth.uid();
  
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Must be authenticated';
  END IF;

  SELECT email INTO v_email
  FROM auth.users
  WHERE id = v_uid;

  IF v_email IS NULL THEN
    RETURN 0;
  END IF;

  UPDATE public.applications
  SET user_id = v_uid
  WHERE user_id IS NULL
    AND lower(email) = lower(v_email);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.claim_applications_for_current_user() TO authenticated;

COMMENT ON FUNCTION public.claim_applications_for_current_user IS 'Claims applications submitted before login by matching email address';
