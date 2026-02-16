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
-- Phase 2: Atomic Enrollment Orchestration
-- Eliminates partial writes by moving all enrollment logic to database

-- ============================================
-- 1. Idempotency Keys Table
-- ============================================
CREATE TABLE IF NOT EXISTS idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  operation TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, operation, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_idempotency_keys_lookup 
  ON idempotency_keys(user_id, operation, idempotency_key);

-- ============================================
-- 2. Unique Constraints (prevent duplicates)
-- ============================================
-- Ensure one enrollment per user per program
DO $$ BEGIN
  ALTER TABLE program_enrollments 
    ADD CONSTRAINT uq_program_enrollments_user_program 
    UNIQUE (student_id, program_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Ensure one enrollment per user per course
DO $$ BEGIN
  ALTER TABLE enrollments 
    ADD CONSTRAINT uq_enrollments_user_course 
    UNIQUE (user_id, course_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 3. Enrollment Status Enum (if not exists)
-- ============================================
DO $$ BEGIN
  CREATE TYPE enrollment_status AS ENUM (
    'pending',
    'in_progress',
    'active',
    'completed',
    'cancelled',
    'suspended'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 4. Main RPC: rpc_enroll_student
-- ============================================
CREATE OR REPLACE FUNCTION rpc_enroll_student(
  p_user_id UUID,
  p_program_id UUID,
  p_idempotency_key TEXT,
  p_source TEXT DEFAULT 'app',
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS JSONB AS $$
DECLARE
  v_existing_result JSONB;
  v_program_enrollment_id UUID;
  v_program_holder_id UUID;
  v_funding_source TEXT;
  v_course_record RECORD;
  v_courses_enrolled INTEGER := 0;
  v_steps_created INTEGER := 0;
  v_program_name TEXT;
  v_student_name TEXT;
  v_student_email TEXT;
BEGIN
  -- ========================================
  -- IDEMPOTENCY CHECK
  -- ========================================
  SELECT result INTO v_existing_result
  FROM idempotency_keys
  WHERE user_id = p_user_id
    AND operation = 'enroll_student'
    AND idempotency_key = p_idempotency_key;

  IF v_existing_result IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'idempotent', true,
      'enrollment_id', v_existing_result->>'enrollment_id',
      'message', 'Enrollment already processed'
    );
  END IF;

  -- ========================================
  -- LOCK: Prevent concurrent enrollment
  -- ========================================
  -- Lock the user's profile row to serialize enrollment attempts
  PERFORM 1 FROM profiles WHERE id = p_user_id FOR UPDATE;

  -- Check if already enrolled in this program
  SELECT id INTO v_program_enrollment_id
  FROM program_enrollments
  WHERE student_id = p_user_id AND program_id = p_program_id
  FOR UPDATE;

  IF v_program_enrollment_id IS NOT NULL THEN
    -- Already enrolled, return existing
    INSERT INTO idempotency_keys (user_id, operation, idempotency_key, result)
    VALUES (p_user_id, 'enroll_student', p_idempotency_key, 
      jsonb_build_object('enrollment_id', v_program_enrollment_id, 'already_enrolled', true)
    ) ON CONFLICT (user_id, operation, idempotency_key) DO NOTHING;

    RETURN jsonb_build_object(
      'success', true,
      'enrollment_id', v_program_enrollment_id,
      'already_enrolled', true,
      'message', 'Already enrolled in this program'
    );
  END IF;

  -- ========================================
  -- GATHER REQUIRED DATA
  -- ========================================
  -- Get program holder and funding info from profile
  SELECT program_holder_id, COALESCE(p_metadata->>'funding_source', 'WIOA')
  INTO v_program_holder_id, v_funding_source
  FROM profiles
  WHERE id = p_user_id;

  -- Get program name
  SELECT name INTO v_program_name
  FROM programs
  WHERE id = p_program_id;

  -- Get student info
  SELECT full_name, email INTO v_student_name, v_student_email
  FROM profiles
  WHERE id = p_user_id;

  -- ========================================
  -- STEP 1: Create program enrollment
  -- ========================================
  INSERT INTO program_enrollments (
    student_id,
    program_id,
    program_holder_id,
    funding_source,
    status,
    created_at
  ) VALUES (
    p_user_id,
    p_program_id,
    v_program_holder_id,
    v_funding_source,
    'IN_PROGRESS',
    NOW()
  )
  RETURNING id INTO v_program_enrollment_id;

  -- ========================================
  -- STEP 2: Create course enrollments
  -- ========================================
  FOR v_course_record IN
    SELECT c.id, c.title
    FROM program_courses pc
    JOIN courses c ON c.id = pc.course_id
    WHERE pc.program_id = p_program_id
      AND c.is_published = true
  LOOP
    INSERT INTO enrollments (
      user_id,
      course_id,
      status,
      progress_percent,
      started_at,
      enrollment_method,
      funding_source
    ) VALUES (
      p_user_id,
      v_course_record.id,
      'active',
      0,
      NOW(),
      'program',
      v_funding_source
    )
    ON CONFLICT (user_id, course_id) DO NOTHING;
    
    v_courses_enrolled := v_courses_enrolled + 1;
  END LOOP;

  -- Also enroll in courses directly linked via program_id
  FOR v_course_record IN
    SELECT id, title
    FROM courses
    WHERE program_id = p_program_id
      AND is_published = true
  LOOP
    INSERT INTO enrollments (
      user_id,
      course_id,
      status,
      progress_percent,
      started_at,
      enrollment_method,
      funding_source
    ) VALUES (
      p_user_id,
      v_course_record.id,
      'active',
      0,
      NOW(),
      'program',
      v_funding_source
    )
    ON CONFLICT (user_id, course_id) DO NOTHING;
    
    v_courses_enrolled := v_courses_enrolled + 1;
  END LOOP;

  -- ========================================
  -- STEP 3: Generate enrollment steps (if RPC exists)
  -- ========================================
  BEGIN
    SELECT generate_enrollment_steps(v_program_enrollment_id) INTO v_steps_created;
  EXCEPTION WHEN undefined_function THEN
    v_steps_created := 0;
  END;

  -- ========================================
  -- STEP 4: Update profile status
  -- ========================================
  UPDATE profiles
  SET 
    enrollment_status = 'active',
    updated_at = NOW()
  WHERE id = p_user_id;

  -- ========================================
  -- STEP 5: Create notification
  -- ========================================
  INSERT INTO notifications (
    user_id,
    type,
    title,
    message,
    action_url,
    action_label,
    metadata,
    read,
    created_at
  ) VALUES (
    p_user_id,
    'system',
    'Enrollment Confirmed',
    format('You have been enrolled in %s', COALESCE(v_program_name, 'the program')),
    '/lms',
    'Start Learning',
    jsonb_build_object(
      'enrollment_id', v_program_enrollment_id,
      'program_id', p_program_id,
      'source', p_source
    ),
    false,
    NOW()
  );

  -- Notify program holder if assigned
  IF v_program_holder_id IS NOT NULL THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      action_url,
      action_label,
      metadata,
      read,
      created_at
    )
    SELECT
      ph.user_id,
      'system',
      'New Student Enrolled',
      format('%s has been enrolled in %s', COALESCE(v_student_name, 'A student'), COALESCE(v_program_name, 'the program')),
      '/program-holder/students',
      'View Students',
      jsonb_build_object(
        'enrollment_id', v_program_enrollment_id,
        'student_id', p_user_id,
        'program_id', p_program_id
      ),
      false,
      NOW()
    FROM program_holders ph
    WHERE ph.id = v_program_holder_id;
  END IF;

  -- ========================================
  -- STEP 6: Create delivery log for email
  -- ========================================
  INSERT INTO delivery_logs (
    notification_id,
    channel,
    recipient,
    status,
    sent_at
  )
  SELECT 
    n.id,
    'email',
    v_student_email,
    'pending',
    NULL
  FROM notifications n
  WHERE n.metadata->>'enrollment_id' = v_program_enrollment_id::text
    AND n.user_id = p_user_id
  LIMIT 1;

  -- ========================================
  -- STEP 7: Write audit log
  -- ========================================
  INSERT INTO audit_logs (
    action,
    entity_type,
    entity_id,
    details,
    created_at
  ) VALUES (
    'enrollment_created',
    'program_enrollment',
    v_program_enrollment_id,
    jsonb_build_object(
      'user_id', p_user_id,
      'program_id', p_program_id,
      'idempotency_key', p_idempotency_key,
      'source', p_source,
      'courses_enrolled', v_courses_enrolled,
      'steps_created', v_steps_created
    ),
    NOW()
  );

  -- ========================================
  -- STEP 8: Record idempotency key
  -- ========================================
  INSERT INTO idempotency_keys (user_id, operation, idempotency_key, result)
  VALUES (
    p_user_id, 
    'enroll_student', 
    p_idempotency_key,
    jsonb_build_object(
      'enrollment_id', v_program_enrollment_id,
      'courses_enrolled', v_courses_enrolled,
      'steps_created', v_steps_created
    )
  );

  -- ========================================
  -- SUCCESS
  -- ========================================
  RETURN jsonb_build_object(
    'success', true,
    'enrollment_id', v_program_enrollment_id,
    'courses_enrolled', v_courses_enrolled,
    'steps_created', v_steps_created,
    'message', 'Enrollment completed successfully'
  );

EXCEPTION WHEN OTHERS THEN
  -- Transaction will rollback automatically
  -- Return structured error
  RETURN jsonb_build_object(
    'success', false,
    'code', SQLSTATE,
    'message', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. Grant Permissions
-- ============================================
GRANT EXECUTE ON FUNCTION rpc_enroll_student TO authenticated, service_role;

-- ============================================
-- 6. Documentation
-- ============================================
COMMENT ON FUNCTION rpc_enroll_student IS 
'Atomic enrollment orchestration. Creates program enrollment, course enrollments, 
notifications, and audit logs in a single transaction. Idempotent via idempotency_key.
All writes succeed or all fail - no partial state.';

COMMENT ON TABLE idempotency_keys IS
'Tracks idempotent operations to prevent duplicate processing on retries.';
-- Application State Events Table
-- Immutable append-only log of all state transitions for regulatory traceability
-- Addresses: state history capped at 20, no actor tracking, mutable JSONB

-- 1. Create immutable events table
CREATE TABLE IF NOT EXISTS application_state_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES career_applications(id) ON DELETE CASCADE,
  from_state application_state,
  to_state application_state NOT NULL,
  actor_id UUID REFERENCES auth.users(id),
  actor_role TEXT,
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Indexes for efficient querying
CREATE INDEX idx_app_state_events_application ON application_state_events(application_id);
CREATE INDEX idx_app_state_events_created ON application_state_events(created_at DESC);
CREATE INDEX idx_app_state_events_actor ON application_state_events(actor_id);

-- 3. Enable RLS
ALTER TABLE application_state_events ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies - append-only, no updates or deletes
CREATE POLICY "Admins can view all state events" ON application_state_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can view own application events" ON application_state_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM career_applications ca
      WHERE ca.id = application_state_events.application_id
      AND ca.user_id = auth.uid()
    )
  );

-- INSERT only via RPC (SECURITY DEFINER), no direct inserts
-- This ensures all events go through validated state machine

-- 5. Function to record state event (called from advance_application_state)
CREATE OR REPLACE FUNCTION record_application_state_event(
  p_application_id UUID,
  p_from_state application_state,
  p_to_state application_state,
  p_actor_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_event_id UUID;
  v_actor_role TEXT;
BEGIN
  -- Get actor role if actor provided
  IF p_actor_id IS NOT NULL THEN
    SELECT role INTO v_actor_role FROM profiles WHERE id = p_actor_id;
  END IF;

  INSERT INTO application_state_events (
    application_id,
    from_state,
    to_state,
    actor_id,
    actor_role,
    reason,
    metadata
  ) VALUES (
    p_application_id,
    p_from_state,
    p_to_state,
    p_actor_id,
    v_actor_role,
    p_reason,
    p_metadata
  )
  RETURNING id INTO v_event_id;

  RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Update advance_application_state to record events
CREATE OR REPLACE FUNCTION advance_application_state(
  p_application_id UUID,
  p_next_state application_state,
  p_data JSONB DEFAULT '{}'::jsonb,
  p_actor_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
  v_current_state application_state;
  v_valid BOOLEAN;
  v_history JSONB;
  v_event_id UUID;
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
    -- Log invalid transition attempt to audit_logs
    INSERT INTO audit_logs (
      action,
      actor_id,
      target_type,
      target_id,
      metadata,
      created_at
    ) VALUES (
      'invalid_state_transition',
      p_actor_id,
      'career_application',
      p_application_id::TEXT,
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

  -- Record event in immutable events table
  v_event_id := record_application_state_event(
    p_application_id,
    v_current_state,
    p_next_state,
    p_actor_id,
    p_reason,
    p_data
  );

  -- Build new history entry (keep JSONB for backward compat, but events table is source of truth)
  v_history := v_history || jsonb_build_array(jsonb_build_object(
    'state', p_next_state,
    'timestamp', NOW(),
    'from_state', v_current_state,
    'event_id', v_event_id
  ));
  
  -- Cap JSONB history to last 20 (events table has full history)
  IF jsonb_array_length(v_history) > 20 THEN
    v_history := (SELECT jsonb_agg(elem) FROM (
      SELECT elem FROM jsonb_array_elements(v_history) AS elem
      ORDER BY (elem->>'timestamp')::timestamptz DESC
      LIMIT 20
    ) sub);
  END IF;

  -- Update state with field whitelisting per state
  UPDATE career_applications
  SET 
    application_state = p_next_state,
    last_transition_at = NOW(),
    state_history = v_history,
    updated_at = NOW(),
    -- Personal info: only writable in 'started' state
    first_name = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'first_name', first_name) ELSE first_name END,
    last_name = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'last_name', last_name) ELSE last_name END,
    email = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'email', email) ELSE email END,
    phone = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'phone', phone) ELSE phone END,
    date_of_birth = CASE WHEN v_current_state = 'started' THEN COALESCE((p_data->>'date_of_birth')::DATE, date_of_birth) ELSE date_of_birth END,
    address = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'address', address) ELSE address END,
    city = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'city', city) ELSE city END,
    state = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'state', state) ELSE state END,
    zip_code = CASE WHEN v_current_state = 'started' THEN COALESCE(p_data->>'zip_code', zip_code) ELSE zip_code END,
    -- Education: only writable in 'started' or 'eligibility_complete'
    high_school = CASE WHEN v_current_state IN ('started', 'eligibility_complete') THEN COALESCE(p_data->>'high_school', high_school) ELSE high_school END,
    graduation_year = CASE WHEN v_current_state IN ('started', 'eligibility_complete') THEN COALESCE(p_data->>'graduation_year', graduation_year) ELSE graduation_year END,
    gpa = CASE WHEN v_current_state IN ('started', 'eligibility_complete') THEN COALESCE(p_data->>'gpa', gpa) ELSE gpa END,
    college = CASE WHEN v_current_state IN ('started', 'eligibility_complete') THEN COALESCE(p_data->>'college', college) ELSE college END,
    major = CASE WHEN v_current_state IN ('started', 'eligibility_complete') THEN COALESCE(p_data->>'major', major) ELSE major END,
    -- Program selection: only writable before review_ready
    program_id = CASE WHEN v_current_state IN ('started', 'eligibility_complete', 'documents_complete') THEN COALESCE((p_data->>'program_id')::UUID, program_id) ELSE program_id END,
    funding_type = CASE WHEN v_current_state IN ('started', 'eligibility_complete', 'documents_complete') THEN COALESCE(p_data->>'funding_type', funding_type) ELSE funding_type END,
    -- Employment: only writable before review_ready
    employment_status = CASE WHEN v_current_state IN ('started', 'eligibility_complete', 'documents_complete') THEN COALESCE(p_data->>'employment_status', employment_status) ELSE employment_status END,
    current_employer = CASE WHEN v_current_state IN ('started', 'eligibility_complete', 'documents_complete') THEN COALESCE(p_data->>'current_employer', current_employer) ELSE current_employer END,
    years_experience = CASE WHEN v_current_state IN ('started', 'eligibility_complete', 'documents_complete') THEN COALESCE(p_data->>'years_experience', years_experience) ELSE years_experience END,
    -- Submitted timestamp: only set when transitioning to submitted
    submitted_at = CASE WHEN p_next_state = 'submitted' THEN NOW() ELSE submitted_at END
  WHERE id = p_application_id;

  RETURN jsonb_build_object(
    'success', true,
    'application_id', p_application_id,
    'previous_state', v_current_state,
    'new_state', p_next_state,
    'event_id', v_event_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Backfill existing state_history to events table
DO $$
DECLARE
  app RECORD;
  hist_entry JSONB;
  prev_state application_state;
BEGIN
  FOR app IN SELECT id, state_history FROM career_applications WHERE state_history IS NOT NULL AND jsonb_array_length(state_history) > 0 LOOP
    prev_state := NULL;
    FOR hist_entry IN SELECT * FROM jsonb_array_elements(app.state_history) LOOP
      INSERT INTO application_state_events (
        application_id,
        from_state,
        to_state,
        reason,
        metadata,
        created_at
      ) VALUES (
        app.id,
        prev_state,
        (hist_entry->>'state')::application_state,
        hist_entry->>'action',
        jsonb_build_object('backfilled', true),
        COALESCE((hist_entry->>'timestamp')::timestamptz, NOW())
      )
      ON CONFLICT DO NOTHING;
      
      prev_state := (hist_entry->>'state')::application_state;
    END LOOP;
  END LOOP;
END $$;

COMMENT ON TABLE application_state_events IS 'Immutable append-only audit trail of application state transitions. Source of truth for regulatory compliance.';
-- application_intake: universal secure buffer for anonymous public submissions.
-- All public form submissions land here. A processor function validates,
-- resolves tenant_id from program_id, and inserts into the correct
-- workflow table (student_applications, employer_applications, etc.).
--
-- Only service_role can read/write this table.

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. Create the intake buffer table
-- ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.application_intake (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at          timestamptz NOT NULL DEFAULT now(),

  application_type    text NOT NULL,                          -- e.g. 'student', 'employer', 'career'
  program_id          uuid,                                   -- optional; validated against programs.id

  -- Raw public payload (all submitted fields, allowlisted by Edge Function)
  payload             jsonb NOT NULL,

  -- Routing / tenancy (derived server-side during processing)
  resolved_tenant_id  uuid,

  -- Lifecycle
  status              text NOT NULL DEFAULT 'received',       -- received | processed | rejected
  processed_at        timestamptz,
  error               text,                                   -- populated on processing failure

  -- Metadata
  ip_address          inet,
  user_agent          text,
  source              text NOT NULL DEFAULT 'public_form',    -- public_form | api | import
  destination_table   text,                                   -- set after successful processing
  destination_id      uuid                                    -- FK to the row created in workflow table
);

-- ────────────────────────────────────────────────────────────────
-- 2. Indexes
-- ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_intake_type       ON public.application_intake (application_type);
CREATE INDEX IF NOT EXISTS idx_intake_status     ON public.application_intake (status);
CREATE INDEX IF NOT EXISTS idx_intake_created    ON public.application_intake (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intake_program    ON public.application_intake (program_id);
CREATE INDEX IF NOT EXISTS idx_intake_ip_created ON public.application_intake (ip_address, created_at DESC);

-- ────────────────────────────────────────────────────────────────
-- 3. RLS — service_role only (explicit deny-all for anon/authenticated)
-- ────────────────────────────────────────────────────────────────
ALTER TABLE public.application_intake ENABLE ROW LEVEL SECURITY;

CREATE POLICY "application_intake_service_only_insert"
  ON public.application_intake
  FOR INSERT
  TO public
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "application_intake_service_only_select"
  ON public.application_intake
  FOR SELECT
  TO public
  USING (auth.role() = 'service_role');

CREATE POLICY "application_intake_service_only_update"
  ON public.application_intake
  FOR UPDATE
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Admin read access for staff dashboard
CREATE POLICY "application_intake_admin_read"
  ON public.application_intake
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

-- ────────────────────────────────────────────────────────────────
-- 4. Rate-limit helper: count recent submissions from an IP
-- ────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.intake_rate_check(
  p_ip inet,
  p_window_minutes int DEFAULT 15,
  p_max_submissions int DEFAULT 5
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*) < p_max_submissions
  FROM application_intake
  WHERE ip_address = p_ip
    AND created_at > now() - (p_window_minutes || ' minutes')::interval;
$$;

REVOKE ALL ON FUNCTION public.intake_rate_check(inet, int, int) FROM PUBLIC;

-- ────────────────────────────────────────────────────────────────
-- 5. Comments
-- ────────────────────────────────────────────────────────────────
COMMENT ON TABLE public.application_intake
  IS 'Universal intake buffer for anonymous public form submissions. Processed into workflow tables by process-intake.';
COMMENT ON COLUMN public.application_intake.application_type
  IS 'Maps to a destination workflow table via the routing config in the Edge Function.';
COMMENT ON COLUMN public.application_intake.payload
  IS 'Raw submitted fields. Allowlisted by the Edge Function before insert.';
COMMENT ON COLUMN public.application_intake.resolved_tenant_id
  IS 'Derived from programs.tenant_id when program_id is provided. Set during processing.';
COMMENT ON COLUMN public.application_intake.status
  IS 'received → processed | rejected';

COMMIT;
-- Seal all workflow application tables from anonymous/public inserts.
-- After this migration, only service_role can insert into these tables.
-- Public submissions go through application_intake via the public-submit
-- Edge Function.
--
-- Run AFTER 20260216_application_intake.sql

BEGIN;

-- ────────────────────────────────────────────────────────────────
-- 1. Drop any existing permissive anon INSERT policies
-- ────────────────────────────────────────────────────────────────

-- applications
DROP POLICY IF EXISTS "service insert" ON public.applications;
DROP POLICY IF EXISTS "Anyone can insert applications" ON public.applications;
REVOKE INSERT ON public.applications FROM anon;

-- career_applications (already blocked by state-machine migration,
-- but ensure no leftover policies)
DROP POLICY IF EXISTS "Users can insert own career applications" ON public.career_applications;

-- student_applications
DROP POLICY IF EXISTS "Anyone can insert student_applications" ON public.student_applications;
DROP POLICY IF EXISTS "Public insert student_applications" ON public.student_applications;
REVOKE INSERT ON public.student_applications FROM anon;

-- employer_applications
DROP POLICY IF EXISTS "Anyone can insert employer_applications" ON public.employer_applications;
DROP POLICY IF EXISTS "Public insert employer_applications" ON public.employer_applications;
REVOKE INSERT ON public.employer_applications FROM anon;

-- staff_applications
DROP POLICY IF EXISTS "Anyone can insert staff_applications" ON public.staff_applications;
DROP POLICY IF EXISTS "Public insert staff_applications" ON public.staff_applications;
REVOKE INSERT ON public.staff_applications FROM anon;

-- partner_applications
DROP POLICY IF EXISTS "Anyone can insert partner_applications" ON public.partner_applications;
DROP POLICY IF EXISTS "Public insert partner_applications" ON public.partner_applications;
REVOKE INSERT ON public.partner_applications FROM anon;

-- barbershop_partner_applications
DROP POLICY IF EXISTS "Anyone can insert barbershop_partner_applications" ON public.barbershop_partner_applications;
DROP POLICY IF EXISTS "Public insert barbershop_partner_applications" ON public.barbershop_partner_applications;
REVOKE INSERT ON public.barbershop_partner_applications FROM anon;

-- program_holder_applications
DROP POLICY IF EXISTS "Anyone can insert program_holder_applications" ON public.program_holder_applications;
DROP POLICY IF EXISTS "Public insert program_holder_applications" ON public.program_holder_applications;
REVOKE INSERT ON public.program_holder_applications FROM anon;

-- shop_applications
DROP POLICY IF EXISTS "Anyone can insert shop_applications" ON public.shop_applications;
DROP POLICY IF EXISTS "Public insert shop_applications" ON public.shop_applications;
REVOKE INSERT ON public.shop_applications FROM anon;

-- affiliate_applications
DROP POLICY IF EXISTS "Anyone can insert affiliate_applications" ON public.affiliate_applications;
DROP POLICY IF EXISTS "Public insert affiliate_applications" ON public.affiliate_applications;
REVOKE INSERT ON public.affiliate_applications FROM anon;

-- funding_applications
DROP POLICY IF EXISTS "Anyone can insert funding_applications" ON public.funding_applications;
DROP POLICY IF EXISTS "Public insert funding_applications" ON public.funding_applications;
REVOKE INSERT ON public.funding_applications FROM anon;

-- job_applications
DROP POLICY IF EXISTS "Anyone can insert job_applications" ON public.job_applications;
DROP POLICY IF EXISTS "Public insert job_applications" ON public.job_applications;
REVOKE INSERT ON public.job_applications FROM anon;

-- supersonic_applications
DROP POLICY IF EXISTS "Anyone can insert supersonic_applications" ON public.supersonic_applications;
DROP POLICY IF EXISTS "Public insert supersonic_applications" ON public.supersonic_applications;
REVOKE INSERT ON public.supersonic_applications FROM anon;

-- tax_applications
DROP POLICY IF EXISTS "Anyone can insert tax_applications" ON public.tax_applications;
DROP POLICY IF EXISTS "Public insert tax_applications" ON public.tax_applications;
REVOKE INSERT ON public.tax_applications FROM anon;

-- application_submissions
DROP POLICY IF EXISTS "Anyone can insert application_submissions" ON public.application_submissions;
DROP POLICY IF EXISTS "Public insert application_submissions" ON public.application_submissions;
REVOKE INSERT ON public.application_submissions FROM anon;

-- ────────────────────────────────────────────────────────────────
-- 2. Create service-only INSERT policies for each workflow table
-- ────────────────────────────────────────────────────────────────
-- These ensure only service_role (Edge Functions) can insert.
-- Authenticated users with admin/staff roles manage via RPCs or
-- admin endpoints that use service_role internally.

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'applications',
    'career_applications',
    'student_applications',
    'employer_applications',
    'staff_applications',
    'partner_applications',
    'barbershop_partner_applications',
    'program_holder_applications',
    'shop_applications',
    'affiliate_applications',
    'funding_applications',
    'job_applications',
    'supersonic_applications',
    'tax_applications',
    'application_submissions'
  ])
  LOOP
    -- Ensure RLS is enabled
    EXECUTE format('ALTER TABLE IF EXISTS public.%I ENABLE ROW LEVEL SECURITY', tbl);

    -- Drop any existing service-only insert policy to avoid conflicts
    EXECUTE format(
      'DROP POLICY IF EXISTS "%s_service_only_insert" ON public.%I',
      tbl, tbl
    );

    -- Create service-only insert policy
    EXECUTE format(
      'CREATE POLICY "%s_service_only_insert" ON public.%I FOR INSERT TO public WITH CHECK (auth.role() = ''service_role'')',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ────────────────────────────────────────────────────────────────
-- 3. Verification query (run manually to confirm)
-- ────────────────────────────────────────────────────────────────
-- SELECT tablename, policyname, cmd, roles::text
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND cmd = 'INSERT'
--   AND tablename LIKE '%application%'
-- ORDER BY tablename, policyname;

COMMIT;
