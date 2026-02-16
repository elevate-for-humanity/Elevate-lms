-- =====================================================
-- DAILY ATTENDANCE ALERTS SYSTEM
-- =====================================================
-- Purpose: Automated daily attendance monitoring with streak tracking,
-- deduped alerts, and escalation logic
-- Runs: Daily at 6 AM (via cron)
-- Rules: Day 1 missing = warning, Day 2 = high, Day 3+ = critical
-- =====================================================

-- =====================================================
-- 1. ADD STREAK TRACKING TO ENROLLMENTS
-- =====================================================
-- Add columns to existing enrollments table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'enrollments' AND column_name = 'missing_attendance_streak') THEN
    ALTER TABLE enrollments ADD COLUMN missing_attendance_streak INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'enrollments' AND column_name = 'last_attendance_date') THEN
    ALTER TABLE enrollments ADD COLUMN last_attendance_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'enrollments' AND column_name = 'partner_owner_user_id') THEN
    ALTER TABLE enrollments ADD COLUMN partner_owner_user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

COMMENT ON COLUMN enrollments.missing_attendance_streak IS 'Consecutive days without attendance (resets on attendance)';
COMMENT ON COLUMN enrollments.last_attendance_date IS 'Last date student had attendance logged';
COMMENT ON COLUMN enrollments.partner_owner_user_id IS 'Partner responsible for this enrollment (for alert assignment)';

-- =====================================================
-- 2. ADD OPENED_DATE TO ALERTS FOR DEDUPLICATION
-- =====================================================
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'alerts' AND column_name = 'opened_date') THEN
    ALTER TABLE alerts ADD COLUMN opened_date DATE GENERATED ALWAYS AS (opened_at::date) STORED;
  END IF;
END $$;

COMMENT ON COLUMN alerts.opened_date IS 'Date portion of opened_at for daily deduplication';

-- Create unique index for daily alert deduplication
CREATE UNIQUE INDEX IF NOT EXISTS alerts_daily_unique
  ON alerts (student_id, program_id, alert_type, opened_date)
  WHERE resolved_at IS NULL;

COMMENT ON INDEX alerts_daily_unique IS 'Ensures one alert per student/program/type/day';

-- =====================================================
-- 3. UPDATE ALERT_TYPE ENUM TO INCLUDE DAILY ATTENDANCE
-- =====================================================
-- Drop existing constraint and recreate with new value
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_alert_type_check;
ALTER TABLE alerts ADD CONSTRAINT alerts_alert_type_check 
  CHECK (alert_type IN ('no_login', 'no_attendance', 'missing_attendance_daily', 'missed_milestone', 'document_missing', 'behavior', 'custom'));

-- =====================================================
-- 4. DAILY ATTENDANCE SCAN FUNCTION (MAIN LOGIC)
-- =====================================================
CREATE OR REPLACE FUNCTION run_daily_attendance_alerts(p_date DATE DEFAULT (CURRENT_DATE - 1))
RETURNS TABLE(
  processed_count INTEGER,
  alert_count INTEGER,
  critical_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_date DATE := p_date;
  v_processed INTEGER := 0;
  v_alerts INTEGER := 0;
  v_critical INTEGER := 0;
BEGIN
  -- =====================================================
  -- STEP 1: Reset streak for students WITH attendance
  -- =====================================================
  UPDATE enrollments e
  SET 
    last_attendance_date = v_date,
    missing_attendance_streak = 0
  WHERE e.status = 'active'
    AND EXISTS (
      SELECT 1
      FROM attendance_events a
      WHERE a.student_id = e.student_id
        AND a.program_id = e.program_id
        AND a.session_date = v_date
        AND a.event_type != 'absence'
    );

  GET DIAGNOSTICS v_processed = ROW_COUNT;

  -- =====================================================
  -- STEP 2: Increment streak for students WITHOUT attendance
  -- =====================================================
  UPDATE enrollments e
  SET missing_attendance_streak = COALESCE(e.missing_attendance_streak, 0) + 1
  WHERE e.status = 'active'
    AND NOT EXISTS (
      SELECT 1
      FROM attendance_events a
      WHERE a.student_id = e.student_id
        AND a.program_id = e.program_id
        AND a.session_date = v_date
        AND a.event_type != 'absence'
    );

  -- =====================================================
  -- STEP 3: Create/update alerts for missing attendance
  -- =====================================================
  INSERT INTO alerts (
    scope,
    student_id,
    program_id,
    partner_user_id,
    alert_type,
    severity,
    title,
    message,
    opened_at,
    assigned_to_user_id,
    metadata
  )
  SELECT
    'student' AS scope,
    e.student_id,
    e.program_id,
    e.partner_owner_user_id,
    'missing_attendance_daily' AS alert_type,
    CASE
      WHEN e.missing_attendance_streak >= 3 THEN 'critical'
      WHEN e.missing_attendance_streak = 2 THEN 'escalate'
      ELSE 'warn'
    END AS severity,
    CASE
      WHEN e.missing_attendance_streak >= 3 THEN 'Critical: ' || e.missing_attendance_streak || ' days no attendance'
      WHEN e.missing_attendance_streak = 2 THEN 'Escalated: ' || e.missing_attendance_streak || ' days no attendance'
      ELSE 'Warning: No attendance yesterday'
    END AS title,
    'Student ' || p.full_name || ' has not logged attendance for ' || e.missing_attendance_streak || ' consecutive day(s). Last attendance: ' || 
    COALESCE(e.last_attendance_date::text, 'never') AS message,
    NOW() AS opened_at,
    e.partner_owner_user_id AS assigned_to_user_id,
    jsonb_build_object(
      'streak', e.missing_attendance_streak,
      'last_attendance', e.last_attendance_date,
      'check_date', v_date
    ) AS metadata
  FROM enrollments e
  JOIN profiles p ON e.student_id = p.id
  WHERE e.status = 'active'
    AND NOT EXISTS (
      SELECT 1
      FROM attendance_events a
      WHERE a.student_id = e.student_id
        AND a.program_id = e.program_id
        AND a.session_date = v_date
        AND a.event_type != 'absence'
    )
  ON CONFLICT (student_id, program_id, alert_type, opened_date)
  DO UPDATE SET
    severity = EXCLUDED.severity,
    title = EXCLUDED.title,
    message = EXCLUDED.message,
    metadata = EXCLUDED.metadata;

  GET DIAGNOSTICS v_alerts = ROW_COUNT;

  -- Count critical alerts created
  SELECT COUNT(*) INTO v_critical
  FROM alerts
  WHERE alert_type = 'missing_attendance_daily'
    AND severity = 'critical'
    AND opened_date = v_date;

  -- =====================================================
  -- STEP 4: Auto-escalate Day 3+ to admin
  -- =====================================================
  -- Create duplicate alert for admin on critical cases
  INSERT INTO alerts (
    scope,
    student_id,
    program_id,
    alert_type,
    severity,
    title,
    message,
    opened_at,
    assigned_to_user_id,
    metadata
  )
  SELECT
    'global' AS scope,
    e.student_id,
    e.program_id,
    'missing_attendance_daily' AS alert_type,
    'critical' AS severity,
    'ADMIN ESCALATION: ' || e.missing_attendance_streak || ' days no attendance' AS title,
    'Student ' || p.full_name || ' (Program: ' || pr.name || ') has missed ' || 
    e.missing_attendance_streak || ' consecutive days. Immediate intervention required.' AS message,
    NOW() AS opened_at,
    NULL AS assigned_to_user_id, -- Admin sees all unassigned
    jsonb_build_object(
      'streak', e.missing_attendance_streak,
      'last_attendance', e.last_attendance_date,
      'check_date', v_date,
      'escalated_from_partner', e.partner_owner_user_id
    ) AS metadata
  FROM enrollments e
  JOIN profiles p ON e.student_id = p.id
  LEFT JOIN programs pr ON e.program_id = pr.id
  WHERE e.status = 'active'
    AND e.missing_attendance_streak >= 3
    AND NOT EXISTS (
      SELECT 1
      FROM attendance_events a
      WHERE a.student_id = e.student_id
        AND a.program_id = e.program_id
        AND a.session_date = v_date
        AND a.event_type != 'absence'
    )
  ON CONFLICT (student_id, program_id, alert_type, opened_date)
  DO NOTHING;

  -- Return summary
  RETURN QUERY SELECT v_processed, v_alerts, v_critical;
END;
$$;

COMMENT ON FUNCTION run_daily_attendance_alerts IS 'Daily attendance scan: updates streaks, creates alerts, escalates critical cases';

-- =====================================================
-- 5. HELPER FUNCTION: GET PARTNER DAILY DIGEST
-- =====================================================
CREATE OR REPLACE FUNCTION get_partner_daily_digest(p_partner_user_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
  alert_id UUID,
  student_id UUID,
  student_name TEXT,
  program_name TEXT,
  severity TEXT,
  streak INTEGER,
  last_attendance DATE,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id AS alert_id,
    a.student_id,
    p.full_name AS student_name,
    pr.name AS program_name,
    a.severity,
    (a.metadata->>'streak')::INTEGER AS streak,
    (a.metadata->>'last_attendance')::DATE AS last_attendance,
    a.message
  FROM alerts a
  JOIN profiles p ON a.student_id = p.id
  LEFT JOIN programs pr ON a.program_id = pr.id
  WHERE a.assigned_to_user_id = p_partner_user_id
    AND a.alert_type = 'missing_attendance_daily'
    AND a.opened_date = p_date
    AND a.resolved_at IS NULL
  ORDER BY a.severity DESC, (a.metadata->>'streak')::INTEGER DESC;
END;
$$;

COMMENT ON FUNCTION get_partner_daily_digest IS 'Returns daily attendance alerts for a specific partner';

-- =====================================================
-- 6. HELPER FUNCTION: GET ADMIN DAILY DIGEST
-- =====================================================
CREATE OR REPLACE FUNCTION get_admin_daily_digest(p_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
  alert_id UUID,
  student_id UUID,
  student_name TEXT,
  program_name TEXT,
  partner_name TEXT,
  severity TEXT,
  streak INTEGER,
  last_attendance DATE,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    a.id AS alert_id,
    a.student_id,
    p.full_name AS student_name,
    pr.name AS program_name,
    pp.full_name AS partner_name,
    a.severity,
    (a.metadata->>'streak')::INTEGER AS streak,
    (a.metadata->>'last_attendance')::DATE AS last_attendance,
    a.message
  FROM alerts a
  JOIN profiles p ON a.student_id = p.id
  LEFT JOIN programs pr ON a.program_id = pr.id
  LEFT JOIN profiles pp ON a.partner_user_id = pp.id
  WHERE a.alert_type = 'missing_attendance_daily'
    AND a.opened_date = p_date
    AND a.resolved_at IS NULL
  ORDER BY a.severity DESC, (a.metadata->>'streak')::INTEGER DESC;
END;
$$;

COMMENT ON FUNCTION get_admin_daily_digest IS 'Returns all daily attendance alerts for admin dashboard';

-- =====================================================
-- 7. HELPER FUNCTION: RESOLVE ALERT (WHEN ATTENDANCE LOGGED)
-- =====================================================
CREATE OR REPLACE FUNCTION resolve_attendance_alert(p_student_id UUID, p_program_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE alerts
  SET 
    resolved_at = NOW(),
    resolved_by = auth.uid()
  WHERE student_id = p_student_id
    AND program_id = p_program_id
    AND alert_type = 'missing_attendance_daily'
    AND resolved_at IS NULL;
END;
$$;

COMMENT ON FUNCTION resolve_attendance_alert IS 'Auto-resolves attendance alerts when attendance is logged';

-- =====================================================
-- 8. TRIGGER: AUTO-RESOLVE ALERTS ON ATTENDANCE
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_resolve_attendance_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only resolve if this is a real attendance event (not absence)
  IF NEW.event_type != 'absence' THEN
    PERFORM resolve_attendance_alert(NEW.student_id, NEW.program_id);
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS attendance_event_resolve_alert ON attendance_events;
CREATE TRIGGER attendance_event_resolve_alert
  AFTER INSERT ON attendance_events
  FOR EACH ROW
  EXECUTE FUNCTION trigger_resolve_attendance_alert();

COMMENT ON TRIGGER attendance_event_resolve_alert ON attendance_events IS 'Auto-resolves attendance alerts when student logs attendance';

-- =====================================================
-- 9. VIEW: ACTIVE ATTENDANCE ALERTS SUMMARY
-- =====================================================
CREATE OR REPLACE VIEW active_attendance_alerts AS
SELECT
  a.id,
  a.student_id,
  p.full_name AS student_name,
  p.email AS student_email,
  pr.name AS program_name,
  a.severity,
  (a.metadata->>'streak')::INTEGER AS streak,
  (a.metadata->>'last_attendance')::DATE AS last_attendance,
  a.opened_at,
  a.assigned_to_user_id,
  pp.full_name AS assigned_to_name,
  a.message
FROM alerts a
JOIN profiles p ON a.student_id = p.id
LEFT JOIN programs pr ON a.program_id = pr.id
LEFT JOIN profiles pp ON a.assigned_to_user_id = pp.id
WHERE a.alert_type = 'missing_attendance_daily'
  AND a.resolved_at IS NULL
ORDER BY a.severity DESC, (a.metadata->>'streak')::INTEGER DESC;

COMMENT ON VIEW active_attendance_alerts IS 'All active attendance alerts with student and partner details';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration creates:
-- ✅ Streak tracking in enrollments table
-- ✅ Daily attendance scan function with escalation logic
-- ✅ Deduplication via unique index
-- ✅ Partner and admin digest functions
-- ✅ Auto-resolve trigger when attendance logged
-- ✅ Active alerts view for dashboards
--
-- Next steps:
-- 1. Create Vercel cron: POST /api/cron/daily-attendance-alerts
-- 2. Add alert cards to partner dashboards
-- 3. Add daily digest email (optional)
-- =====================================================
