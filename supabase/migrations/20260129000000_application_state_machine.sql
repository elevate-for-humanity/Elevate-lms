-- Application State Machine Migration
-- Enforces canonical flow for career applications
-- States: started -> eligibility_complete -> documents_complete -> review_ready -> submitted -> rejected

-- 1. Create state enum
DO $$ BEGIN
  CREATE TYPE application_state AS ENUM (
    'started',
    'eligibility_complete', 
    'documents_complete',
    'review_ready',
    'submitted',
    'rejected'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add state columns to career_applications
ALTER TABLE career_applications 
  ADD COLUMN IF NOT EXISTS application_state application_state DEFAULT 'started',
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_transition_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS state_history JSONB DEFAULT '[]'::jsonb;

-- 3. Create index on application_state
CREATE INDEX IF NOT EXISTS idx_career_applications_state 
  ON career_applications(application_state);

-- 4. State transition validation function
CREATE OR REPLACE FUNCTION validate_application_state_transition(
  current_state application_state,
  next_state application_state
) RETURNS BOOLEAN AS $$
BEGIN
  -- Define valid transitions
  RETURN CASE
    WHEN current_state = 'started' AND next_state = 'eligibility_complete' THEN TRUE
    WHEN current_state = 'eligibility_complete' AND next_state = 'documents_complete' THEN TRUE
    WHEN current_state = 'documents_complete' AND next_state = 'review_ready' THEN TRUE
    WHEN current_state = 'review_ready' AND next_state = 'submitted' THEN TRUE
    WHEN current_state = 'review_ready' AND next_state = 'rejected' THEN TRUE
    WHEN current_state = 'submitted' AND next_state = 'rejected' THEN TRUE
    -- Allow going back one step for corrections
    WHEN current_state = 'eligibility_complete' AND next_state = 'started' THEN TRUE
    WHEN current_state = 'documents_complete' AND next_state = 'eligibility_complete' THEN TRUE
    WHEN current_state = 'review_ready' AND next_state = 'documents_complete' THEN TRUE
    ELSE FALSE
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 5. RPC: Start a new application
CREATE OR REPLACE FUNCTION start_application(
  p_user_id UUID DEFAULT NULL,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_application_id UUID;
  v_existing_id UUID;
BEGIN
  -- Check for existing in-progress application by email
  IF p_email IS NOT NULL THEN
    SELECT id INTO v_existing_id
    FROM career_applications
    WHERE email = p_email
      AND application_state NOT IN ('submitted', 'rejected')
    LIMIT 1;
    
    IF v_existing_id IS NOT NULL THEN
      RETURN jsonb_build_object(
        'success', true,
        'application_id', v_existing_id,
        'resumed', true,
        'message', 'Existing application found'
      );
    END IF;
  END IF;

  -- Create new application in 'started' state
  INSERT INTO career_applications (
    user_id,
    first_name,
    last_name,
    email,
    phone,
    application_state,
    last_transition_at,
    state_history,
    status
  ) VALUES (
    p_user_id,
    COALESCE(p_first_name, ''),
    COALESCE(p_last_name, ''),
    COALESCE(p_email, ''),
    COALESCE(p_phone, ''),
    'started',
    NOW(),
    jsonb_build_array(jsonb_build_object(
      'state', 'started',
      'timestamp', NOW(),
      'action', 'created'
    )),
    'draft'
  )
  RETURNING id INTO v_application_id;

  RETURN jsonb_build_object(
    'success', true,
    'application_id', v_application_id,
    'resumed', false,
    'message', 'Application started'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC: Advance application state with validation
CREATE OR REPLACE FUNCTION advance_application_state(
  p_application_id UUID,
  p_next_state application_state,
  p_data JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
  v_current_state application_state;
  v_valid BOOLEAN;
  v_history JSONB;
BEGIN
  -- Get current state
  SELECT application_state, state_history 
  INTO v_current_state, v_history
  FROM career_applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF v_current_state IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Application not found',
      'code', 'NOT_FOUND'
    );
  END IF;

  -- Validate transition
  v_valid := validate_application_state_transition(v_current_state, p_next_state);
  
  IF NOT v_valid THEN
    -- Log invalid transition attempt
    INSERT INTO audit_logs (
      action,
      entity_type,
      entity_id,
      details,
      created_at
    ) VALUES (
      'invalid_state_transition',
      'career_application',
      p_application_id,
      jsonb_build_object(
        'from_state', v_current_state,
        'attempted_state', p_next_state,
        'data', p_data
      ),
      NOW()
    );

    RETURN jsonb_build_object(
      'success', false,
      'error', format('Invalid transition from %s to %s', v_current_state, p_next_state),
      'code', 'INVALID_TRANSITION',
      'current_state', v_current_state
    );
  END IF;

  -- Build new history entry and cap to last 20 transitions
  v_history := v_history || jsonb_build_array(jsonb_build_object(
    'state', p_next_state,
    'timestamp', NOW(),
    'from_state', v_current_state
  ));
  -- Cap history to last 20 entries to prevent unbounded growth
  IF jsonb_array_length(v_history) > 20 THEN
    v_history := (SELECT jsonb_agg(elem) FROM (
      SELECT elem FROM jsonb_array_elements(v_history) AS elem
      ORDER BY (elem->>'timestamp')::timestamptz DESC
      LIMIT 20
    ) sub);
  END IF;

  -- Update state with field whitelisting per state
  -- Fields are only writable at specific states to prevent data tampering
  UPDATE career_applications
  SET 
    application_state = p_next_state,
    last_transition_at = NOW(),
    state_history = v_history,
    updated_at = NOW(),
    -- Personal info: only writable in 'started' state or when transitioning TO eligibility_complete
    first_name = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'first_name', first_name) ELSE first_name END,
    last_name = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'last_name', last_name) ELSE last_name END,
    email = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'email', email) ELSE email END,
    phone = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'phone', phone) ELSE phone END,
    date_of_birth = CASE WHEN v_current_state = 'started' THEN COALESCE((p_data->>'date_of_birth')::DATE, date_of_birth) ELSE date_of_birth END,
    address = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'address', address) ELSE address END,
    city = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'city', city) ELSE city END,
    state = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'state', state) ELSE state END,
    zip_code = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'zip_code', zip_code) ELSE zip_code END,
    -- Education: only writable in 'eligibility_complete' state or earlier
    high_school = CASE WHEN v_current_state IN ('started', 'eligibility_complete') THEN COALESCE(p_data->>'high_school', high_school) ELSE high_school END,
    graduation_year = CASE WHEN v_current_state IN ('started', 'eligibility_complete') THEN COALESCE(p_data->>'graduation_year', graduation_year) ELSE graduation_year END,
    gpa = CASE WHEN v_current_state IN ('started', 'eligibility_complete') THEN COALESCE(p_data->>'gpa', gpa) ELSE gpa END,
    college = CASE WHEN v_current_state IN ('started', 'eligibility_complete') THEN COALESCE(p_data->>'college', college) ELSE college END,
    major = CASE WHEN v_current_state IN ('started', 'eligibility_complete') THEN COALESCE(p_data->>'major', major) ELSE major END,
    -- Program selection: only writable in 'documents_complete' state or earlier
    program_id = CASE WHEN v_current_state IN ('started', 'eligibility_complete', 'documents_complete') THEN COALESCE((p_data->>'program_id')::UUID, program_id) ELSE program_id END,
    funding_type = CASE WHEN v_current_state IN ('started', 'eligibility_complete', 'documents_complete') THEN COALESCE(p_data->>'funding_type', funding_type) ELSE funding_type END,
    -- Employment: only writable before review_ready
    employment_status = CASE WHEN v_current_state IN ('started', 'eligibility_complete', 'documents_complete') THEN COALESCE(p_data->>'employment_status', employment_status) ELSE employment_status END,
    current_employer = CASE WHEN v_current_state IN ('started', 'eligibility_complete', 'documents_complete') THEN COALESCE(p_data->>'current_employer', current_employer) ELSE current_employer END,
    years_experience = CASE WHEN v_current_state IN ('started', 'eligibility_complete', 'documents_complete') THEN COALESCE(p_data->>'years_experience', years_experience) ELSE years_experience END
  WHERE id = p_application_id;

  RETURN jsonb_build_object(
    'success', true,
    'application_id', p_application_id,
    'previous_state', v_current_state,
    'current_state', p_next_state,
    'message', format('Transitioned from %s to %s', v_current_state, p_next_state)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC: Submit application (final state transition)
CREATE OR REPLACE FUNCTION submit_application(
  p_application_id UUID,
  p_agree_terms BOOLEAN DEFAULT FALSE
) RETURNS JSONB AS $$
DECLARE
  v_current_state application_state;
  v_email TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
BEGIN
  -- Get current state and validate
  SELECT application_state, email, first_name, last_name
  INTO v_current_state, v_email, v_first_name, v_last_name
  FROM career_applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF v_current_state IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Application not found',
      'code', 'NOT_FOUND'
    );
  END IF;

  -- Must be in review_ready state to submit
  IF v_current_state != 'review_ready' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Cannot submit application in state: %s. Must complete all steps first.', v_current_state),
      'code', 'INVALID_STATE',
      'current_state', v_current_state,
      'required_state', 'review_ready'
    );
  END IF;

  -- Must agree to terms
  IF NOT p_agree_terms THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Must agree to terms and conditions',
      'code', 'TERMS_NOT_ACCEPTED'
    );
  END IF;

  -- Validate required fields
  IF v_email IS NULL OR v_email = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Email is required',
      'code', 'MISSING_REQUIRED_FIELD'
    );
  END IF;

  IF v_first_name IS NULL OR v_first_name = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'First name is required',
      'code', 'MISSING_REQUIRED_FIELD'
    );
  END IF;

  IF v_last_name IS NULL OR v_last_name = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Last name is required',
      'code', 'MISSING_REQUIRED_FIELD'
    );
  END IF;

  -- Perform final submission
  UPDATE career_applications
  SET 
    application_state = 'submitted',
    submitted_at = NOW(),
    last_transition_at = NOW(),
    status = 'submitted',
    state_history = state_history || jsonb_build_array(jsonb_build_object(
      'state', 'submitted',
      'timestamp', NOW(),
      'from_state', v_current_state,
      'terms_accepted', true
    )),
    updated_at = NOW()
  WHERE id = p_application_id;

  -- Log successful submission
  INSERT INTO audit_logs (
    action,
    entity_type,
    entity_id,
    details,
    created_at
  ) VALUES (
    'application_submitted',
    'career_application',
    p_application_id,
    jsonb_build_object(
      'email', v_email,
      'name', v_first_name || ' ' || v_last_name
    ),
    NOW()
  );

  RETURN jsonb_build_object(
    'success', true,
    'application_id', p_application_id,
    'submitted_at', NOW(),
    'message', 'Application submitted successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RPC: Get application state (for UI)
CREATE OR REPLACE FUNCTION get_application_state(
  p_application_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'application_id', id,
    'current_state', application_state,
    'submitted_at', submitted_at,
    'last_transition_at', last_transition_at,
    'state_history', state_history,
    'can_submit', application_state = 'review_ready'
  ) INTO v_result
  FROM career_applications
  WHERE id = p_application_id;

  IF v_result IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Application not found'
    );
  END IF;

  RETURN jsonb_build_object('success', true) || v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Grant permissions
GRANT EXECUTE ON FUNCTION start_application TO authenticated, anon;
GRANT EXECUTE ON FUNCTION advance_application_state TO authenticated, anon;
GRANT EXECUTE ON FUNCTION submit_application TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_application_state TO authenticated, anon;
GRANT EXECUTE ON FUNCTION validate_application_state_transition TO authenticated, anon;

-- 10. Add missing columns to career_applications if they don't exist
-- (These may be needed for the full application form)
DO $$ BEGIN
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS date_of_birth DATE;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS address TEXT;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS city TEXT;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS state TEXT;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS zip_code TEXT;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS high_school TEXT;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS graduation_year TEXT;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS gpa TEXT;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS college TEXT;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS major TEXT;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS program_id UUID;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS funding_type TEXT;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS employment_status TEXT;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS current_employer TEXT;
  ALTER TABLE career_applications ADD COLUMN IF NOT EXISTS years_experience TEXT;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- 11. RLS policies to prevent direct state manipulation
-- Users can only read their own applications
DROP POLICY IF EXISTS "Users can view own applications" ON career_applications;
CREATE POLICY "Users can view own applications" ON career_applications
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR user_id IS NULL  -- Allow anonymous applications to be viewed during session
    OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin', 'staff'))
  );

-- Block ALL direct inserts - must use start_application RPC
DROP POLICY IF EXISTS "Block direct inserts" ON career_applications;
CREATE POLICY "Block direct inserts" ON career_applications
  FOR INSERT
  WITH CHECK (FALSE);  -- Always deny direct inserts

-- Block ALL direct updates - must use RPCs
DROP POLICY IF EXISTS "Block direct updates" ON career_applications;
CREATE POLICY "Block direct updates" ON career_applications
  FOR UPDATE
  USING (FALSE)  -- Always deny direct updates
  WITH CHECK (FALSE);

-- Block ALL direct deletes
DROP POLICY IF EXISTS "Block direct deletes" ON career_applications;
CREATE POLICY "Block direct deletes" ON career_applications
  FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- 12. Comment documentation
COMMENT ON TYPE application_state IS 'Canonical states for application lifecycle: started -> eligibility_complete -> documents_complete -> review_ready -> submitted | rejected';
COMMENT ON FUNCTION start_application IS 'Initialize a new application or resume existing. Returns application_id. SECURITY DEFINER bypasses RLS.';
COMMENT ON FUNCTION advance_application_state IS 'Transition application to next state with validation. Rejects invalid transitions. SECURITY DEFINER bypasses RLS.';
COMMENT ON FUNCTION submit_application IS 'Final submission. Requires state=review_ready and terms acceptance. SECURITY DEFINER bypasses RLS.';
COMMENT ON FUNCTION get_application_state IS 'Get current application state and history for UI. SECURITY DEFINER bypasses RLS.';
