-- Application State Events Table
-- Immutable append-only log of all state transitions for regulatory traceability
-- Addresses: state history capped at 20, no actor tracking, mutable JSONB

-- 1. Create immutable events table
CREATE TABLE IF NOT EXISTS application_state_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
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
DROP POLICY IF EXISTS "Admins can view all state events" ON application_state_events;
CREATE POLICY "Admins can view all state events" ON application_state_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Users can view own application events" ON application_state_events;
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
  p_metadata JSONB DEFAULT '{}',
  p_application_type TEXT DEFAULT 'student'
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
    application_type,
    application_id,
    from_state,
    to_state,
    actor_id,
    reason,
    metadata
  ) VALUES (
    p_application_type,
    p_application_id,
    p_from_state,
    p_to_state,
    p_actor_id,
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
        application_type,
        application_id,
        from_state,
        to_state,
        reason,
        metadata,
        created_at
      ) VALUES (
        'student',
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
