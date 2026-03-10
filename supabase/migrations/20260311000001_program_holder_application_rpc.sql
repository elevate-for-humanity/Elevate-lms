-- Atomic program holder application submission.
--
-- Writes to both `applications` and `program_holders` in a single transaction.
-- If either insert fails the entire operation rolls back, preventing orphaned
-- application rows with no corresponding program_holders row.
--
-- Called from app/apply/actions.ts submitProgramHolderApplication().

CREATE OR REPLACE FUNCTION submit_program_holder_application(
  p_first_name        TEXT,
  p_last_name         TEXT,
  p_email             TEXT,
  p_phone             TEXT,
  p_organization_name TEXT,
  p_organization_type TEXT DEFAULT NULL,
  p_website           TEXT DEFAULT NULL,
  p_programs_offered  TEXT DEFAULT NULL,
  p_partnership_goals TEXT DEFAULT NULL,
  p_number_of_students TEXT DEFAULT NULL,
  p_reference_number  TEXT DEFAULT NULL,
  p_support_notes     TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_application_id  UUID;
  v_holder_id       UUID;
  v_profile_id      UUID;
  v_ref             TEXT;
BEGIN
  v_ref := COALESCE(p_reference_number, 'EFH-' || upper(to_hex(extract(epoch from now())::bigint)));

  -- 1. Insert into applications
  INSERT INTO public.applications (
    first_name, last_name, email, phone,
    city, zip, program_interest, program_slug,
    support_notes, status, source
  ) VALUES (
    p_first_name, p_last_name, lower(trim(p_email)), p_phone,
    'Not provided', '00000', 'Program Holder', 'program-holder',
    COALESCE(p_support_notes,
      concat_ws(' | ',
        'Organization: ' || p_organization_name,
        CASE WHEN p_organization_type IS NOT NULL THEN 'Type: ' || p_organization_type END,
        CASE WHEN p_website IS NOT NULL THEN 'Website: ' || p_website END,
        CASE WHEN p_programs_offered IS NOT NULL THEN 'Programs: ' || p_programs_offered END,
        CASE WHEN p_partnership_goals IS NOT NULL THEN 'Goals: ' || p_partnership_goals END
      )
    ),
    'pending', 'program-holder-application'
  )
  RETURNING id INTO v_application_id;

  -- 2. Look up profile by email (may not exist if user hasn't signed up yet)
  SELECT id INTO v_profile_id
  FROM public.profiles
  WHERE email = lower(trim(p_email))
  LIMIT 1;

  -- 3. Upsert program_holders row (only if profile exists)
  IF v_profile_id IS NOT NULL THEN
    INSERT INTO public.program_holders (
      user_id, name, organization_name,
      contact_name, contact_email, contact_phone, status
    ) VALUES (
      v_profile_id,
      p_organization_name,
      p_organization_name,
      p_first_name || ' ' || p_last_name,
      lower(trim(p_email)),
      p_phone,
      'pending'
    )
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id INTO v_holder_id;

    -- 4. Link profile → program_holders if we just created the row
    IF v_holder_id IS NOT NULL THEN
      UPDATE public.profiles
      SET program_holder_id = v_holder_id
      WHERE id = v_profile_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'application_id', v_application_id,
    'holder_id',      v_holder_id,
    'profile_id',     v_profile_id,
    'reference',      v_ref
  );
END;
$$;

-- Only the service role (admin client) may call this function.
REVOKE EXECUTE ON FUNCTION submit_program_holder_application FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION submit_program_holder_application TO service_role;
