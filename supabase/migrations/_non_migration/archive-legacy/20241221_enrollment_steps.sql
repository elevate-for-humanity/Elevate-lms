-- ============================================================
-- ENROLLMENT STEPS - State Machine for Multi-Partner Progress
-- ============================================================

-- 1. Create enrollment_steps table
CREATE TABLE IF NOT EXISTS enrollment_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES partner_lms_providers(id),
  sequence_order INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'skipped')),
  
  -- Tracking
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  
  -- Partner enrollment reference
  external_enrollment_id TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(enrollment_id, provider_id)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_enrollment_steps_enrollment ON enrollment_steps(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_steps_status ON enrollment_steps(status);
CREATE INDEX IF NOT EXISTS idx_enrollment_steps_sequence ON enrollment_steps(enrollment_id, sequence_order);
CREATE INDEX IF NOT EXISTS idx_enrollment_steps_provider ON enrollment_steps(provider_id);

-- 3. Updated_at trigger
CREATE OR REPLACE FUNCTION update_enrollment_steps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enrollment_steps_updated_at ON enrollment_steps;
CREATE TRIGGER enrollment_steps_updated_at
  BEFORE UPDATE ON enrollment_steps
  FOR EACH ROW
  EXECUTE FUNCTION update_enrollment_steps_updated_at();

-- 4. RLS Policies
ALTER TABLE enrollment_steps ENABLE ROW LEVEL SECURITY;

-- Students can view their own enrollment steps
CREATE POLICY "Students can view own enrollment steps"
  ON enrollment_steps FOR SELECT
  USING (
    enrollment_id IN (
      SELECT id FROM enrollments WHERE user_id = auth.uid()
    )
  );

-- Admins can view all enrollment steps
CREATE POLICY "Admins can view all enrollment steps"
  ON enrollment_steps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- Service role can manage all enrollment steps
CREATE POLICY "Service role can manage enrollment steps"
  ON enrollment_steps FOR ALL
  USING ((auth.jwt() ->> 'role') = 'service_role');

-- 5. Generate enrollment steps function
CREATE OR REPLACE FUNCTION generate_enrollment_steps(p_enrollment_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Insert steps from program_partner_lms
  INSERT INTO enrollment_steps (
    enrollment_id,
    provider_id,
    sequence_order,
    status
  )
  SELECT 
    p_enrollment_id,
    ppl.provider_id,
    ppl.sequence_order,
    'pending'
  FROM program_partner_lms ppl
  JOIN enrollments e ON e.program_id = ppl.program_id
  WHERE e.id = p_enrollment_id
  AND ppl.is_required = true
  ORDER BY ppl.sequence_order
  ON CONFLICT (enrollment_id, provider_id) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Mark first step as in_progress
  UPDATE enrollment_steps
  SET 
    status = 'in_progress',
    started_at = NOW()
  WHERE enrollment_id = p_enrollment_id
  AND sequence_order = (
    SELECT MIN(sequence_order) 
    FROM enrollment_steps 
    WHERE enrollment_id = p_enrollment_id
  )
  AND status = 'pending';
  
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION generate_enrollment_steps(UUID) TO authenticated, service_role;

-- 6. Get current step function
CREATE OR REPLACE FUNCTION get_current_step(p_enrollment_id UUID)
RETURNS TABLE (
  step_id UUID,
  provider_id UUID,
  provider_name TEXT,
  sequence_order INTEGER,
  status TEXT,
  started_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    es.id,
    es.provider_id,
    plp.provider_name,
    es.sequence_order,
    es.status,
    es.started_at
  FROM enrollment_steps es
  JOIN partner_lms_providers plp ON plp.id = es.provider_id
  WHERE es.enrollment_id = p_enrollment_id
  AND es.status = 'in_progress'
  ORDER BY es.sequence_order
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_current_step(UUID) TO authenticated, service_role;

-- 7. Advance to next step function
CREATE OR REPLACE FUNCTION advance_to_next_step(p_enrollment_id UUID)
RETURNS UUID AS $$
DECLARE
  v_next_step_id UUID;
BEGIN
  -- Get next pending step
  SELECT id INTO v_next_step_id
  FROM enrollment_steps
  WHERE enrollment_id = p_enrollment_id
  AND status = 'pending'
  ORDER BY sequence_order
  LIMIT 1;
  
  IF v_next_step_id IS NOT NULL THEN
    -- Mark as in_progress
    UPDATE enrollment_steps
    SET 
      status = 'in_progress',
      started_at = NOW()
    WHERE id = v_next_step_id;
  END IF;
  
  RETURN v_next_step_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION advance_to_next_step(UUID) TO service_role;

-- 8. Mark step complete function
CREATE OR REPLACE FUNCTION mark_step_complete(
  p_step_id UUID,
  p_external_enrollment_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_enrollment_id UUID;
  v_next_step_id UUID;
BEGIN
  -- Mark current step complete
  UPDATE enrollment_steps
  SET 
    status = 'completed',
    completed_at = NOW(),
    external_enrollment_id = COALESCE(p_external_enrollment_id, external_enrollment_id)
  WHERE id = p_step_id
  RETURNING enrollment_id INTO v_enrollment_id;
  
  -- Advance to next step
  v_next_step_id := advance_to_next_step(v_enrollment_id);
  
  RETURN v_next_step_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION mark_step_complete(UUID, TEXT) TO service_role;

-- 9. Check if enrollment complete function
CREATE OR REPLACE FUNCTION is_enrollment_complete(p_enrollment_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_pending_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_pending_count
  FROM enrollment_steps
  WHERE enrollment_id = p_enrollment_id
  AND status IN ('pending', 'in_progress');
  
  RETURN v_pending_count = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION is_enrollment_complete(UUID) TO authenticated, service_role;

-- Comments
COMMENT ON TABLE enrollment_steps IS 'State machine for multi-partner enrollment progress';
COMMENT ON FUNCTION generate_enrollment_steps IS 'Generate steps from program_partner_lms and start first step';
COMMENT ON FUNCTION get_current_step IS 'Get the current in_progress step for an enrollment';
COMMENT ON FUNCTION advance_to_next_step IS 'Move to next pending step';
COMMENT ON FUNCTION mark_step_complete IS 'Mark step complete and advance to next';
COMMENT ON FUNCTION is_enrollment_complete IS 'Check if all steps are complete';
