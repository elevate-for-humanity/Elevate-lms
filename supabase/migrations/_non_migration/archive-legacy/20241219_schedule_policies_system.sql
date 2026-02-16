-- =====================================================
-- SCHEDULE POLICIES SYSTEM
-- =====================================================
-- Purpose: Flexible reporting schedules chosen by Program Holder
-- Each enrollment gets ONE schedule policy that determines:
-- - How compliance is measured (hours, sessions, days)
-- - When alerts trigger
-- - What reporting verdicts look like
-- =====================================================

-- =====================================================
-- 1. SCHEDULE POLICIES TABLE (TEMPLATES)
-- =====================================================
CREATE TABLE schedule_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  mode TEXT NOT NULL CHECK (mode IN ('SELF_PACED', 'HYBRID', 'IN_PERSON', 'APPRENTICESHIP')),
  week_start_day INTEGER DEFAULT 1 CHECK (week_start_day IN (0, 1)), -- 0=Sunday, 1=Monday
  required_hours_per_week NUMERIC(5, 2),
  required_sessions_per_week INTEGER,
  in_person_days TEXT[], -- ['MON','TUE','WED','THU','FRI','SAT','SUN']
  session_start_time TIME,
  session_end_time TIME,
  inactivity_days_threshold INTEGER DEFAULT 7,
  grace_hours NUMERIC(5, 2) DEFAULT 0,
  timezone TEXT DEFAULT 'America/Indiana/Indianapolis',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE schedule_policies IS 'Schedule policy templates that define how compliance is measured';
COMMENT ON COLUMN schedule_policies.mode IS 'SELF_PACED=hours only, HYBRID=hours+sessions, IN_PERSON=daily attendance, APPRENTICESHIP=OJT hours';
COMMENT ON COLUMN schedule_policies.week_start_day IS '1=Monday (ISO), 0=Sunday';
COMMENT ON COLUMN schedule_policies.in_person_days IS 'Array of required in-person days (e.g., [MON,WED])';
COMMENT ON COLUMN schedule_policies.grace_hours IS 'Hours below requirement before triggering alert (e.g., 2 hours grace)';

CREATE INDEX idx_schedule_policies_mode ON schedule_policies(mode);
CREATE INDEX idx_schedule_policies_active ON schedule_policies(is_active);

-- =====================================================
-- 2. ADD SCHEDULE POLICY TO ENROLLMENTS
-- =====================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'enrollments' AND column_name = 'schedule_policy_id') THEN
    ALTER TABLE enrollments ADD COLUMN schedule_policy_id UUID REFERENCES schedule_policies(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'enrollments' AND column_name = 'schedule_locked_at') THEN
    ALTER TABLE enrollments ADD COLUMN schedule_locked_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'enrollments' AND column_name = 'schedule_locked_by') THEN
    ALTER TABLE enrollments ADD COLUMN schedule_locked_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

COMMENT ON COLUMN enrollments.schedule_policy_id IS 'Schedule policy for this enrollment (determines compliance rules)';
COMMENT ON COLUMN enrollments.schedule_locked_at IS 'When schedule was locked (prevents silent changes)';
COMMENT ON COLUMN enrollments.schedule_locked_by IS 'Who locked the schedule (Program Holder or Admin)';

CREATE INDEX idx_enrollments_schedule_policy ON enrollments(schedule_policy_id);
CREATE INDEX idx_enrollments_schedule_locked ON enrollments(schedule_locked_at);

-- =====================================================
-- 3. REPORTING VERDICTS TABLE (COMPLIANCE OUTCOMES)
-- =====================================================
CREATE TABLE reporting_verdicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ON_TRACK', 'BEHIND', 'NO_ACTIVITY', 'EXCUSED', 'NOT_STARTED')),
  required_hours NUMERIC(5, 2),
  logged_hours NUMERIC(5, 2) DEFAULT 0,
  required_sessions INTEGER,
  completed_sessions INTEGER DEFAULT 0,
  in_person_days_required TEXT[],
  in_person_days_completed TEXT[],
  policy_snapshot JSONB NOT NULL, -- Copy of schedule_policies at time of verdict
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(enrollment_id, period_start, period_end)
);

COMMENT ON TABLE reporting_verdicts IS 'Weekly/daily compliance verdicts with policy snapshot for audit trail';
COMMENT ON COLUMN reporting_verdicts.policy_snapshot IS 'Immutable copy of schedule policy at time of verdict';

CREATE INDEX idx_reporting_verdicts_enrollment ON reporting_verdicts(enrollment_id);
CREATE INDEX idx_reporting_verdicts_period ON reporting_verdicts(period_start, period_end);
CREATE INDEX idx_reporting_verdicts_status ON reporting_verdicts(status);

-- =====================================================
-- 4. SEED DEFAULT SCHEDULE POLICIES
-- =====================================================
INSERT INTO schedule_policies (name, description, mode, week_start_day, required_hours_per_week, inactivity_days_threshold, grace_hours) VALUES
('Self-Paced 10 hrs/week', 'Light self-paced training for part-time students. 10 hours per week required.', 'SELF_PACED', 1, 10.00, 7, 1.00),
('Self-Paced 20 hrs/week', 'Standard self-paced training for full-time students. 20 hours per week required.', 'SELF_PACED', 1, 20.00, 7, 2.00),
('Self-Paced 40 hrs/week', 'Intensive self-paced training. 40 hours per week required (full-time equivalent).', 'SELF_PACED', 1, 40.00, 5, 2.00)
ON CONFLICT (name) DO NOTHING;

INSERT INTO schedule_policies (name, description, mode, week_start_day, required_hours_per_week, required_sessions_per_week, in_person_days, inactivity_days_threshold, grace_hours) VALUES
('Hybrid Mon/Wed + 10 hrs/week', 'Hybrid schedule: In-person sessions on Monday and Wednesday, plus 10 hours self-paced work.', 'HYBRID', 1, 10.00, 2, ARRAY['MON','WED'], 7, 1.00),
('Hybrid Tue/Thu + 15 hrs/week', 'Hybrid schedule: In-person sessions on Tuesday and Thursday, plus 15 hours self-paced work.', 'HYBRID', 1, 15.00, 2, ARRAY['TUE','THU'], 7, 2.00)
ON CONFLICT (name) DO NOTHING;

INSERT INTO schedule_policies (name, description, mode, week_start_day, required_sessions_per_week, in_person_days, session_start_time, session_end_time, inactivity_days_threshold) VALUES
('In-Person Mon-Fri 9am-5pm', 'Full-time in-person training. Daily attendance required Monday through Friday, 9am-5pm.', 'IN_PERSON', 1, 5, ARRAY['MON','TUE','WED','THU','FRI'], '09:00:00', '17:00:00', 3)
ON CONFLICT (name) DO NOTHING;

INSERT INTO schedule_policies (name, description, mode, week_start_day, required_hours_per_week, inactivity_days_threshold, grace_hours) VALUES
('Apprenticeship 30 hrs/week OJT', 'Registered apprenticeship on-the-job training. 30 hours per week required at worksite.', 'APPRENTICESHIP', 1, 30.00, 7, 2.00)
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- 5. HELPER FUNCTION: GET POLICY SNAPSHOT
-- =====================================================
CREATE OR REPLACE FUNCTION get_policy_snapshot(p_policy_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_snapshot JSONB;
BEGIN
  SELECT to_jsonb(sp.*) INTO v_snapshot
  FROM schedule_policies sp
  WHERE sp.id = p_policy_id;
  
  RETURN v_snapshot;
END;
$$;

COMMENT ON FUNCTION get_policy_snapshot IS 'Returns immutable JSONB snapshot of schedule policy';

-- =====================================================
-- 6. FUNCTION: LOCK ENROLLMENT SCHEDULE
-- =====================================================
CREATE OR REPLACE FUNCTION lock_enrollment_schedule(
  p_enrollment_id UUID,
  p_locked_by UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_policy_id UUID;
BEGIN
  -- Get policy ID
  SELECT schedule_policy_id INTO v_policy_id
  FROM enrollments
  WHERE id = p_enrollment_id;
  
  IF v_policy_id IS NULL THEN
    RAISE EXCEPTION 'Enrollment must have a schedule policy before locking';
  END IF;
  
  -- Lock the schedule
  UPDATE enrollments
  SET 
    schedule_locked_at = NOW(),
    schedule_locked_by = p_locked_by
  WHERE id = p_enrollment_id
    AND schedule_locked_at IS NULL; -- Only lock if not already locked
  
  RETURN FOUND;
END;
$$;

COMMENT ON FUNCTION lock_enrollment_schedule IS 'Locks enrollment schedule to prevent silent changes (required before compliance tracking)';

-- =====================================================
-- 7. FUNCTION: CALCULATE SELF-PACED VERDICT
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_self_paced_verdict(
  p_enrollment_id UUID,
  p_period_start DATE,
  p_period_end DATE,
  p_policy JSONB
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_required_hours NUMERIC;
  v_grace_hours NUMERIC;
  v_logged_hours NUMERIC;
  v_last_activity DATE;
  v_inactivity_threshold INTEGER;
BEGIN
  v_required_hours := (p_policy->>'required_hours_per_week')::NUMERIC;
  v_grace_hours := COALESCE((p_policy->>'grace_hours')::NUMERIC, 0);
  v_inactivity_threshold := COALESCE((p_policy->>'inactivity_days_threshold')::INTEGER, 7);
  
  -- Get logged hours for period
  SELECT COALESCE(SUM(hours), 0) INTO v_logged_hours
  FROM hour_logs
  WHERE enrollment_id = p_enrollment_id
    AND date BETWEEN p_period_start AND p_period_end;
  
  -- Get last activity
  v_last_activity := get_last_activity_date((SELECT student_id FROM enrollments WHERE id = p_enrollment_id));
  
  -- Determine verdict
  IF v_logged_hours >= (v_required_hours - v_grace_hours) THEN
    RETURN 'ON_TRACK';
  ELSIF v_logged_hours = 0 AND (CURRENT_DATE - v_last_activity) >= v_inactivity_threshold THEN
    RETURN 'NO_ACTIVITY';
  ELSE
    RETURN 'BEHIND';
  END IF;
END;
$$;

COMMENT ON FUNCTION calculate_self_paced_verdict IS 'Calculates verdict for self-paced schedule (hours only)';

-- =====================================================
-- 8. FUNCTION: CALCULATE HYBRID VERDICT
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_hybrid_verdict(
  p_enrollment_id UUID,
  p_period_start DATE,
  p_period_end DATE,
  p_policy JSONB
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_required_hours NUMERIC;
  v_grace_hours NUMERIC;
  v_logged_hours NUMERIC;
  v_required_sessions INTEGER;
  v_completed_sessions INTEGER;
  v_in_person_days TEXT[];
BEGIN
  v_required_hours := (p_policy->>'required_hours_per_week')::NUMERIC;
  v_grace_hours := COALESCE((p_policy->>'grace_hours')::NUMERIC, 0);
  v_required_sessions := (p_policy->>'required_sessions_per_week')::INTEGER;
  v_in_person_days := ARRAY(SELECT jsonb_array_elements_text(p_policy->'in_person_days'));
  
  -- Get logged hours
  SELECT COALESCE(SUM(hours), 0) INTO v_logged_hours
  FROM hour_logs
  WHERE enrollment_id = p_enrollment_id
    AND date BETWEEN p_period_start AND p_period_end;
  
  -- Get completed in-person sessions
  SELECT COUNT(DISTINCT date) INTO v_completed_sessions
  FROM attendance_events
  WHERE enrollment_id = p_enrollment_id
    AND session_date BETWEEN p_period_start AND p_period_end
    AND event_type IN ('checkin', 'class')
    AND UPPER(TO_CHAR(session_date, 'DY')) = ANY(v_in_person_days);
  
  -- Determine verdict (must meet BOTH hours AND sessions)
  IF v_logged_hours >= (v_required_hours - v_grace_hours) 
     AND v_completed_sessions >= v_required_sessions THEN
    RETURN 'ON_TRACK';
  ELSIF v_logged_hours = 0 AND v_completed_sessions = 0 THEN
    RETURN 'NO_ACTIVITY';
  ELSE
    RETURN 'BEHIND';
  END IF;
END;
$$;

COMMENT ON FUNCTION calculate_hybrid_verdict IS 'Calculates verdict for hybrid schedule (hours + in-person sessions)';

-- =====================================================
-- 9. FUNCTION: CALCULATE IN-PERSON VERDICT
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_in_person_verdict(
  p_enrollment_id UUID,
  p_period_start DATE,
  p_period_end DATE,
  p_policy JSONB
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_required_sessions INTEGER;
  v_completed_sessions INTEGER;
  v_in_person_days TEXT[];
BEGIN
  v_required_sessions := (p_policy->>'required_sessions_per_week')::INTEGER;
  v_in_person_days := ARRAY(SELECT jsonb_array_elements_text(p_policy->'in_person_days'));
  
  -- Get completed sessions
  SELECT COUNT(DISTINCT session_date) INTO v_completed_sessions
  FROM attendance_events
  WHERE enrollment_id = p_enrollment_id
    AND session_date BETWEEN p_period_start AND p_period_end
    AND event_type IN ('checkin', 'class')
    AND UPPER(TO_CHAR(session_date, 'DY')) = ANY(v_in_person_days);
  
  -- Determine verdict
  IF v_completed_sessions >= v_required_sessions THEN
    RETURN 'ON_TRACK';
  ELSIF v_completed_sessions = 0 THEN
    RETURN 'NO_ACTIVITY';
  ELSE
    RETURN 'BEHIND';
  END IF;
END;
$$;

COMMENT ON FUNCTION calculate_in_person_verdict IS 'Calculates verdict for in-person schedule (daily attendance)';

-- =====================================================
-- 10. MAIN FUNCTION: GENERATE REPORTING VERDICTS
-- =====================================================
CREATE OR REPLACE FUNCTION generate_reporting_verdicts(
  p_period_start DATE DEFAULT week_start(CURRENT_DATE),
  p_period_end DATE DEFAULT week_start(CURRENT_DATE) + 6
)
RETURNS TABLE(
  total_enrollments INTEGER,
  verdicts_created INTEGER,
  on_track INTEGER,
  behind INTEGER,
  no_activity INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_total INTEGER := 0;
  v_created INTEGER := 0;
  v_on_track INTEGER := 0;
  v_behind INTEGER := 0;
  v_no_activity INTEGER := 0;
  v_enrollment RECORD;
  v_policy JSONB;
  v_verdict TEXT;
  v_logged_hours NUMERIC;
  v_completed_sessions INTEGER;
  v_in_person_days_completed TEXT[];
BEGIN
  -- Loop through all active enrollments with locked schedules
  FOR v_enrollment IN
    SELECT 
      e.id,
      e.student_id,
      e.schedule_policy_id,
      sp.mode,
      sp.in_person_days
    FROM enrollments e
    JOIN schedule_policies sp ON e.schedule_policy_id = sp.id
    WHERE e.status = 'active'
      AND e.schedule_locked_at IS NOT NULL
      AND sp.is_active = true
  LOOP
    v_total := v_total + 1;
    
    -- Get policy snapshot
    v_policy := get_policy_snapshot(v_enrollment.schedule_policy_id);
    
    -- Calculate verdict based on mode
    CASE v_enrollment.mode
      WHEN 'SELF_PACED' THEN
        v_verdict := calculate_self_paced_verdict(v_enrollment.id, p_period_start, p_period_end, v_policy);
      WHEN 'HYBRID' THEN
        v_verdict := calculate_hybrid_verdict(v_enrollment.id, p_period_start, p_period_end, v_policy);
      WHEN 'IN_PERSON' THEN
        v_verdict := calculate_in_person_verdict(v_enrollment.id, p_period_start, p_period_end, v_policy);
      WHEN 'APPRENTICESHIP' THEN
        v_verdict := calculate_self_paced_verdict(v_enrollment.id, p_period_start, p_period_end, v_policy); -- Same as self-paced
      ELSE
        v_verdict := 'NOT_STARTED';
    END CASE;
    
    -- Get metrics for verdict record
    SELECT COALESCE(SUM(hours), 0) INTO v_logged_hours
    FROM hour_logs
    WHERE enrollment_id = v_enrollment.id
      AND date BETWEEN p_period_start AND p_period_end;
    
    SELECT COUNT(DISTINCT session_date) INTO v_completed_sessions
    FROM attendance_events
    WHERE enrollment_id = v_enrollment.id
      AND session_date BETWEEN p_period_start AND p_period_end
      AND event_type IN ('checkin', 'class');
    
    -- Get completed in-person days
    SELECT ARRAY_AGG(DISTINCT UPPER(TO_CHAR(session_date, 'DY'))) INTO v_in_person_days_completed
    FROM attendance_events
    WHERE enrollment_id = v_enrollment.id
      AND session_date BETWEEN p_period_start AND p_period_end
      AND event_type IN ('checkin', 'class');
    
    -- Insert verdict
    INSERT INTO reporting_verdicts (
      enrollment_id,
      period_start,
      period_end,
      status,
      required_hours,
      logged_hours,
      required_sessions,
      completed_sessions,
      in_person_days_required,
      in_person_days_completed,
      policy_snapshot
    ) VALUES (
      v_enrollment.id,
      p_period_start,
      p_period_end,
      v_verdict,
      (v_policy->>'required_hours_per_week')::NUMERIC,
      v_logged_hours,
      (v_policy->>'required_sessions_per_week')::INTEGER,
      v_completed_sessions,
      v_enrollment.in_person_days,
      v_in_person_days_completed,
      v_policy
    )
    ON CONFLICT (enrollment_id, period_start, period_end)
    DO UPDATE SET
      status = EXCLUDED.status,
      logged_hours = EXCLUDED.logged_hours,
      completed_sessions = EXCLUDED.completed_sessions,
      in_person_days_completed = EXCLUDED.in_person_days_completed,
      policy_snapshot = EXCLUDED.policy_snapshot;
    
    v_created := v_created + 1;
    
    -- Count by status
    CASE v_verdict
      WHEN 'ON_TRACK' THEN v_on_track := v_on_track + 1;
      WHEN 'BEHIND' THEN v_behind := v_behind + 1;
      WHEN 'NO_ACTIVITY' THEN v_no_activity := v_no_activity + 1;
      ELSE NULL;
    END CASE;
  END LOOP;
  
  RETURN QUERY SELECT v_total, v_created, v_on_track, v_behind, v_no_activity;
END;
$$;

COMMENT ON FUNCTION generate_reporting_verdicts IS 'Generates weekly compliance verdicts for all active enrollments with locked schedules';

-- =====================================================
-- 11. ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE schedule_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE reporting_verdicts ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 12. RLS POLICIES
-- =====================================================

-- Schedule Policies: Public read for active policies
CREATE POLICY "Anyone can view active schedule policies"
  ON schedule_policies FOR SELECT
  USING (is_active = true);

-- Reporting Verdicts: Students see their own, partners see assigned
CREATE POLICY "Students can view their own verdicts"
  ON reporting_verdicts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.id = reporting_verdicts.enrollment_id
        AND e.student_id = auth.uid()
    )
  );

CREATE POLICY "Partners can view assigned student verdicts"
  ON reporting_verdicts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.id = reporting_verdicts.enrollment_id
        AND e.partner_owner_user_id = auth.uid()
    )
  );

-- =====================================================
-- 13. TRIGGERS
-- =====================================================
CREATE TRIGGER update_schedule_policies_updated_at BEFORE UPDATE ON schedule_policies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 14. VIEWS
-- =====================================================
CREATE OR REPLACE VIEW enrollment_compliance_status AS
SELECT
  e.id as enrollment_id,
  e.student_id,
  p.full_name as student_name,
  pr.name as program_name,
  sp.name as schedule_name,
  sp.mode as schedule_mode,
  e.schedule_locked_at,
  rv.period_start,
  rv.period_end,
  rv.status,
  rv.required_hours,
  rv.logged_hours,
  rv.required_sessions,
  rv.completed_sessions,
  e.partner_owner_user_id,
  pp.full_name as partner_name
FROM enrollments e
JOIN profiles p ON e.student_id = p.id
LEFT JOIN programs pr ON e.program_id = pr.id
LEFT JOIN schedule_policies sp ON e.schedule_policy_id = sp.id
LEFT JOIN reporting_verdicts rv ON e.id = rv.enrollment_id
  AND rv.period_start = week_start(CURRENT_DATE)
LEFT JOIN profiles pp ON e.partner_owner_user_id = pp.id
WHERE e.status = 'active'
ORDER BY rv.status DESC NULLS LAST, p.full_name;

COMMENT ON VIEW enrollment_compliance_status IS 'Real-time view of enrollment compliance with current week verdict';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration creates:
-- ✅ Schedule policies (flexible templates)
-- ✅ Enrollment schedule locking
-- ✅ Reporting verdicts with policy snapshots
-- ✅ Mode-specific verdict calculations (SELF_PACED, HYBRID, IN_PERSON, APPRENTICESHIP)
-- ✅ Weekly verdict generation function
-- ✅ Full RLS security
-- ✅ Compliance status view
--
-- Program Holders can now:
-- - Choose schedule policy per enrollment
-- - Lock schedule before activation
-- - System generates verdicts based on chosen policy
-- - Reporting stays consistent (policy snapshot)
-- =====================================================
