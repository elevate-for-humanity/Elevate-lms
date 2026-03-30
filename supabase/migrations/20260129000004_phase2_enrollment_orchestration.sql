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
  created_at TIMESTAMPTZ DEFAULT NOW()
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
  ALTER TABLE training_enrollments 
    ADD CONSTRAINT uq_training_enrollments_user_course 
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
  v_tenant_id UUID;
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
  -- Get tenant and funding info from profile
  SELECT tenant_id, COALESCE(p_metadata->>'funding_source', 'WIOA')
  INTO v_tenant_id, v_funding_source
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
    funding_source,
    status,
    created_at
  ) VALUES (
    p_user_id,
    p_program_id,
    v_funding_source,
    'IN_PROGRESS',
    NOW()
  )
  RETURNING id INTO v_program_enrollment_id;

  -- ========================================
  -- STEP 2: Create course enrollments
  -- ========================================
  FOR v_course_record IN
    SELECT tc.id, tc.course_name AS title
    FROM program_courses pc
    JOIN training_courses tc ON tc.id = pc.course_id
    WHERE pc.program_id = p_program_id
      AND tc.is_active = true
  LOOP
    INSERT INTO training_enrollments (
      user_id,
      course_id,
      tenant_id,
      status,
      progress,
      enrolled_at
    ) VALUES (
      p_user_id,
      v_course_record.id,
      v_tenant_id,
      'active',
      0,
      NOW()
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
