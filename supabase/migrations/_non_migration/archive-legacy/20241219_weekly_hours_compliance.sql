-- =====================================================
-- WEEKLY HOURS-BASED COMPLIANCE SYSTEM
-- =====================================================
-- Purpose: Self-paced training compliance based on weekly hours,
-- not daily attendance. Matches apprenticeship + self-paced model.
-- Week: Monday-Sunday (ISO standard for workforce reporting)
-- =====================================================

-- =====================================================
-- 1. ENROLLMENT REQUIREMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS enrollment_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  week_start_day INTEGER DEFAULT 1 CHECK (week_start_day IN (0, 1)), -- 0=Sunday, 1=Monday
  required_hours_per_week NUMERIC(5, 2) NOT NULL DEFAULT 10.00,
  expected_checkins_per_week INTEGER DEFAULT 0,
  inactivity_days_threshold INTEGER DEFAULT 7,
  timezone TEXT DEFAULT 'America/New_York',
  is_self_paced BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(enrollment_id)
);

COMMENT ON TABLE enrollment_requirements IS 'Weekly hour requirements per enrollment (self-paced training)';
COMMENT ON COLUMN enrollment_requirements.week_start_day IS '1=Monday (ISO), 0=Sunday';
COMMENT ON COLUMN enrollment_requirements.required_hours_per_week IS 'Minimum hours required per week';
COMMENT ON COLUMN enrollment_requirements.inactivity_days_threshold IS 'Days of no activity before check-in alert';

CREATE INDEX idx_enrollment_requirements_enrollment ON enrollment_requirements(enrollment_id);

-- =====================================================
-- 2. HOUR LOGS TABLE (SOURCE OF TRUTH)
-- =====================================================
CREATE TABLE IF NOT EXISTS hour_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours NUMERIC(5, 2) NOT NULL CHECK (hours > 0),
  source TEXT NOT NULL CHECK (source IN ('manual', 'scorm', 'partner', 'mobile', 'lms', 'coordinator')),
  verified_by UUID REFERENCES auth.users(id),
  verified_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE hour_logs IS 'Student hour logs for weekly compliance tracking';

CREATE INDEX idx_hour_logs_enrollment ON hour_logs(enrollment_id);
CREATE INDEX idx_hour_logs_student ON hour_logs(student_id);
CREATE INDEX idx_hour_logs_date ON hour_logs(date DESC);
CREATE INDEX idx_hour_logs_enrollment_date ON hour_logs(enrollment_id, date);

-- =====================================================
-- 3. ALERT NOTIFICATIONS TABLE (WEEKLY ALERTS)
-- =====================================================
CREATE TABLE IF NOT EXISTS alert_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL CHECK (alert_type IN ('weekly_hours_check', 'midweek_progress', 'inactivity_check', 'milestone_due', 'custom')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  partner_user_id UUID REFERENCES auth.users(id),
  message TEXT NOT NULL,
  payload JSONB DEFAULT '{}'::jsonb,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE alert_notifications IS 'Weekly compliance and inactivity alerts';

CREATE INDEX idx_alert_notifications_student ON alert_notifications(student_id);
CREATE INDEX idx_alert_notifications_enrollment ON alert_notifications(enrollment_id);
CREATE INDEX idx_alert_notifications_type ON alert_notifications(alert_type);
CREATE INDEX idx_alert_notifications_resolved ON alert_notifications(resolved_at);
CREATE INDEX idx_alert_notifications_created ON alert_notifications(created_at DESC);

-- =====================================================
-- 4. HELPER FUNCTION: WEEK START (MONDAY-BASED)
-- =====================================================
CREATE OR REPLACE FUNCTION week_start(d DATE)
RETURNS DATE
LANGUAGE sql
IMMUTABLE
AS $$
  -- ISO week: Monday = 1, Sunday = 7
  -- Subtract (day_of_week - 1) to get to Monday
  SELECT (d - ((EXTRACT(ISODOW FROM d)::INTEGER) - 1))::DATE;
$$;

COMMENT ON FUNCTION week_start IS 'Returns Monday of the week for given date (ISO standard)';

-- Test the function
-- SELECT week_start('2024-12-19'::date); -- Should return Monday of that week

-- =====================================================
-- 5. HELPER FUNCTION: GET WEEK HOURS FOR ENROLLMENT
-- =====================================================
CREATE OR REPLACE FUNCTION get_week_hours(p_enrollment_id UUID, p_date DATE DEFAULT CURRENT_DATE)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_week_start DATE := week_start(p_date);
  v_week_end DATE := v_week_start + 6;
  v_total_hours NUMERIC;
BEGIN
  SELECT COALESCE(SUM(hours), 0)
  INTO v_total_hours
  FROM hour_logs
  WHERE enrollment_id = p_enrollment_id
    AND date BETWEEN v_week_start AND v_week_end;
  
  RETURN v_total_hours;
END;
$$;

COMMENT ON FUNCTION get_week_hours IS 'Returns total hours logged for enrollment in current week';

-- =====================================================
-- 6. HELPER FUNCTION: GET LAST ACTIVITY DATE
-- =====================================================
CREATE OR REPLACE FUNCTION get_last_activity_date(p_student_id UUID)
RETURNS DATE
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_last_hour_log DATE;
  v_last_login DATE;
  v_last_activity DATE;
BEGIN
  -- Get last hour log
  SELECT MAX(date) INTO v_last_hour_log
  FROM hour_logs
  WHERE student_id = p_student_id;
  
  -- Get last login
  SELECT MAX(occurred_at::DATE) INTO v_last_login
  FROM login_events
  WHERE user_id = p_student_id;
  
  -- Return most recent
  v_last_activity := GREATEST(v_last_hour_log, v_last_login);
  
  RETURN v_last_activity;
END;
$$;

COMMENT ON FUNCTION get_last_activity_date IS 'Returns most recent activity date (hour log or login)';

-- =====================================================
-- 7. WEEKLY HOURS COMPLIANCE SCAN (MAIN FUNCTION)
-- =====================================================
CREATE OR REPLACE FUNCTION run_weekly_hours_alerts(
  p_today DATE DEFAULT CURRENT_DATE,
  p_alert_type TEXT DEFAULT 'weekly_hours_check'
)
RETURNS TABLE(
  total_checked INTEGER,
  on_track INTEGER,
  behind INTEGER,
  no_activity INTEGER,
  alerts_created INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_start DATE := week_start(p_today);
  v_week_end DATE := v_week_start + 6;
  v_total_checked INTEGER := 0;
  v_on_track INTEGER := 0;
  v_behind INTEGER := 0;
  v_no_activity INTEGER := 0;
  v_alerts_created INTEGER := 0;
BEGIN
  -- Count total active enrollments with requirements
  SELECT COUNT(*) INTO v_total_checked
  FROM enrollments e
  JOIN enrollment_requirements r ON r.enrollment_id = e.id
  WHERE e.status = 'active';

  -- Count on-track students
  SELECT COUNT(*) INTO v_on_track
  FROM enrollments e
  JOIN enrollment_requirements r ON r.enrollment_id = e.id
  LEFT JOIN (
    SELECT enrollment_id, SUM(hours) as total_hours
    FROM hour_logs
    WHERE date BETWEEN v_week_start AND v_week_end
    GROUP BY enrollment_id
  ) h ON h.enrollment_id = e.id
  WHERE e.status = 'active'
    AND COALESCE(h.total_hours, 0) >= r.required_hours_per_week;

  -- Insert alerts for behind/no-activity students
  WITH student_status AS (
    SELECT
      e.id as enrollment_id,
      e.student_id,
      e.partner_owner_user_id,
      r.required_hours_per_week,
      COALESCE(SUM(h.hours), 0) as logged_hours,
      get_last_activity_date(e.student_id) as last_activity,
      r.inactivity_days_threshold
    FROM enrollments e
    JOIN enrollment_requirements r ON r.enrollment_id = e.id
    LEFT JOIN hour_logs h ON h.enrollment_id = e.id
      AND h.date BETWEEN v_week_start AND v_week_end
    WHERE e.status = 'active'
    GROUP BY e.id, e.student_id, e.partner_owner_user_id, r.required_hours_per_week, r.inactivity_days_threshold
    HAVING COALESCE(SUM(h.hours), 0) < r.required_hours_per_week
  )
  INSERT INTO alert_notifications (
    alert_type,
    severity,
    student_id,
    enrollment_id,
    partner_user_id,
    message,
    payload,
    created_at
  )
  SELECT
    p_alert_type,
    CASE
      WHEN ss.logged_hours = 0 AND (p_today - ss.last_activity) >= ss.inactivity_days_threshold THEN 'high'
      WHEN ss.logged_hours = 0 THEN 'medium'
      WHEN ss.logged_hours < (ss.required_hours_per_week * 0.5) THEN 'medium'
      ELSE 'low'
    END as severity,
    ss.student_id,
    ss.enrollment_id,
    ss.partner_owner_user_id,
    CASE
      WHEN ss.logged_hours = 0 AND (p_today - ss.last_activity) >= ss.inactivity_days_threshold THEN
        'No hours logged this week and no activity for ' || (p_today - ss.last_activity) || ' days. Student may be disengaged.'
      WHEN ss.logged_hours = 0 THEN
        'No hours logged this week (0 of ' || ss.required_hours_per_week || ' required).'
      ELSE
        'Student is behind weekly hours target (' || ss.logged_hours || ' of ' || ss.required_hours_per_week || ' required).'
    END as message,
    jsonb_build_object(
      'week_start', v_week_start,
      'week_end', v_week_end,
      'required_hours', ss.required_hours_per_week,
      'logged_hours', ss.logged_hours,
      'hours_missing', ss.required_hours_per_week - ss.logged_hours,
      'last_activity', ss.last_activity,
      'days_inactive', CASE WHEN ss.last_activity IS NOT NULL THEN p_today - ss.last_activity ELSE NULL END
    ) as payload,
    NOW()
  FROM student_status ss
  WHERE ss.logged_hours < ss.required_hours_per_week;

  GET DIAGNOSTICS v_alerts_created = ROW_COUNT;

  -- Count behind and no-activity
  SELECT COUNT(*) INTO v_behind
  FROM enrollments e
  JOIN enrollment_requirements r ON r.enrollment_id = e.id
  LEFT JOIN (
    SELECT enrollment_id, SUM(hours) as total_hours
    FROM hour_logs
    WHERE date BETWEEN v_week_start AND v_week_end
    GROUP BY enrollment_id
  ) h ON h.enrollment_id = e.id
  WHERE e.status = 'active'
    AND COALESCE(h.total_hours, 0) < r.required_hours_per_week
    AND COALESCE(h.total_hours, 0) > 0;

  SELECT COUNT(*) INTO v_no_activity
  FROM enrollments e
  JOIN enrollment_requirements r ON r.enrollment_id = e.id
  LEFT JOIN (
    SELECT enrollment_id, SUM(hours) as total_hours
    FROM hour_logs
    WHERE date BETWEEN v_week_start AND v_week_end
    GROUP BY enrollment_id
  ) h ON h.enrollment_id = e.id
  WHERE e.status = 'active'
    AND COALESCE(h.total_hours, 0) = 0;

  -- Return summary
  RETURN QUERY SELECT v_total_checked, v_on_track, v_behind, v_no_activity, v_alerts_created;
END;
$$;

COMMENT ON FUNCTION run_weekly_hours_alerts IS 'Weekly compliance scan: checks hours vs requirements, creates alerts for behind/inactive students';

-- =====================================================
-- 8. MIDWEEK PROGRESS CHECK (WEDNESDAY)
-- =====================================================
CREATE OR REPLACE FUNCTION run_midweek_progress_check(p_today DATE DEFAULT CURRENT_DATE)
RETURNS TABLE(
  total_checked INTEGER,
  on_track INTEGER,
  behind INTEGER,
  alerts_created INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_start DATE := week_start(p_today);
  v_week_end DATE := v_week_start + 6;
  v_total_checked INTEGER := 0;
  v_on_track INTEGER := 0;
  v_behind INTEGER := 0;
  v_alerts_created INTEGER := 0;
  v_midweek_target NUMERIC;
BEGIN
  -- Midweek target = 50% of weekly requirement
  -- (Students should be at least halfway by Wednesday)

  SELECT COUNT(*) INTO v_total_checked
  FROM enrollments e
  JOIN enrollment_requirements r ON r.enrollment_id = e.id
  WHERE e.status = 'active';

  -- Insert midweek progress alerts
  WITH student_progress AS (
    SELECT
      e.id as enrollment_id,
      e.student_id,
      e.partner_owner_user_id,
      r.required_hours_per_week,
      COALESCE(SUM(h.hours), 0) as logged_hours,
      (r.required_hours_per_week * 0.5) as midweek_target
    FROM enrollments e
    JOIN enrollment_requirements r ON r.enrollment_id = e.id
    LEFT JOIN hour_logs h ON h.enrollment_id = e.id
      AND h.date BETWEEN v_week_start AND p_today
    WHERE e.status = 'active'
    GROUP BY e.id, e.student_id, e.partner_owner_user_id, r.required_hours_per_week
    HAVING COALESCE(SUM(h.hours), 0) < (r.required_hours_per_week * 0.5)
  )
  INSERT INTO alert_notifications (
    alert_type,
    severity,
    student_id,
    enrollment_id,
    partner_user_id,
    message,
    payload,
    created_at
  )
  SELECT
    'midweek_progress',
    CASE
      WHEN sp.logged_hours = 0 THEN 'medium'
      ELSE 'low'
    END as severity,
    sp.student_id,
    sp.enrollment_id,
    sp.partner_owner_user_id,
    'Midweek check: You have ' || sp.logged_hours || ' of ' || sp.required_hours_per_week || 
    ' hours. Target by Sunday: ' || sp.required_hours_per_week || ' hours.',
    jsonb_build_object(
      'week_start', v_week_start,
      'week_end', v_week_end,
      'required_hours', sp.required_hours_per_week,
      'logged_hours', sp.logged_hours,
      'midweek_target', sp.midweek_target,
      'hours_needed', sp.required_hours_per_week - sp.logged_hours
    ) as payload,
    NOW()
  FROM student_progress sp;

  GET DIAGNOSTICS v_alerts_created = ROW_COUNT;

  -- Count on-track and behind
  SELECT COUNT(*) INTO v_on_track
  FROM enrollments e
  JOIN enrollment_requirements r ON r.enrollment_id = e.id
  LEFT JOIN (
    SELECT enrollment_id, SUM(hours) as total_hours
    FROM hour_logs
    WHERE date BETWEEN v_week_start AND p_today
    GROUP BY enrollment_id
  ) h ON h.enrollment_id = e.id
  WHERE e.status = 'active'
    AND COALESCE(h.total_hours, 0) >= (r.required_hours_per_week * 0.5);

  v_behind := v_total_checked - v_on_track;

  RETURN QUERY SELECT v_total_checked, v_on_track, v_behind, v_alerts_created;
END;
$$;

COMMENT ON FUNCTION run_midweek_progress_check IS 'Wednesday check: alerts students who are behind midweek target (50% of weekly hours)';

-- =====================================================
-- 9. AUTO-RESOLVE ALERTS WHEN HOURS LOGGED
-- =====================================================
CREATE OR REPLACE FUNCTION resolve_hours_alerts_on_log()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_week_start DATE := week_start(NEW.date);
  v_week_end DATE := v_week_start + 6;
  v_total_hours NUMERIC;
  v_required_hours NUMERIC;
BEGIN
  -- Get total hours for this week
  SELECT COALESCE(SUM(hours), 0) INTO v_total_hours
  FROM hour_logs
  WHERE enrollment_id = NEW.enrollment_id
    AND date BETWEEN v_week_start AND v_week_end;

  -- Get required hours
  SELECT required_hours_per_week INTO v_required_hours
  FROM enrollment_requirements
  WHERE enrollment_id = NEW.enrollment_id;

  -- If student is now on track, resolve alerts
  IF v_total_hours >= v_required_hours THEN
    UPDATE alert_notifications
    SET 
      resolved_at = NOW(),
      resolved_by = NEW.student_id
    WHERE enrollment_id = NEW.enrollment_id
      AND alert_type IN ('weekly_hours_check', 'midweek_progress')
      AND resolved_at IS NULL
      AND created_at >= v_week_start;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hour_log_resolve_alerts ON hour_logs;
CREATE TRIGGER hour_log_resolve_alerts
  AFTER INSERT ON hour_logs
  FOR EACH ROW
  EXECUTE FUNCTION resolve_hours_alerts_on_log();

COMMENT ON TRIGGER hour_log_resolve_alerts ON hour_logs IS 'Auto-resolves weekly alerts when student logs enough hours';

-- =====================================================
-- 10. VIEW: WEEKLY COMPLIANCE DASHBOARD
-- =====================================================
CREATE OR REPLACE VIEW weekly_compliance_dashboard AS
SELECT
  e.id as enrollment_id,
  e.student_id,
  p.full_name as student_name,
  p.email as student_email,
  pr.name as program_name,
  r.required_hours_per_week,
  COALESCE(h.total_hours, 0) as logged_hours_this_week,
  r.required_hours_per_week - COALESCE(h.total_hours, 0) as hours_missing,
  CASE
    WHEN COALESCE(h.total_hours, 0) >= r.required_hours_per_week THEN 'On Track'
    WHEN COALESCE(h.total_hours, 0) = 0 THEN 'No Activity'
    ELSE 'Behind'
  END as status,
  get_last_activity_date(e.student_id) as last_activity,
  CASE 
    WHEN get_last_activity_date(e.student_id) IS NOT NULL 
    THEN CURRENT_DATE - get_last_activity_date(e.student_id)
    ELSE NULL
  END as days_since_activity,
  week_start(CURRENT_DATE) as week_start,
  week_start(CURRENT_DATE) + 6 as week_end,
  e.partner_owner_user_id,
  pp.full_name as partner_name
FROM enrollments e
JOIN enrollment_requirements r ON r.enrollment_id = e.id
JOIN profiles p ON e.student_id = p.id
LEFT JOIN programs pr ON e.program_id = pr.id
LEFT JOIN profiles pp ON e.partner_owner_user_id = pp.id
LEFT JOIN (
  SELECT 
    enrollment_id, 
    SUM(hours) as total_hours
  FROM hour_logs
  WHERE date BETWEEN week_start(CURRENT_DATE) AND (week_start(CURRENT_DATE) + 6)
  GROUP BY enrollment_id
) h ON h.enrollment_id = e.id
WHERE e.status = 'active'
ORDER BY 
  CASE
    WHEN COALESCE(h.total_hours, 0) = 0 THEN 1
    WHEN COALESCE(h.total_hours, 0) < r.required_hours_per_week THEN 2
    ELSE 3
  END,
  COALESCE(h.total_hours, 0) ASC;

COMMENT ON VIEW weekly_compliance_dashboard IS 'Real-time view of weekly compliance for all active enrollments';

-- =====================================================
-- 11. ENABLE ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE enrollment_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE hour_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 12. RLS POLICIES
-- =====================================================

-- Enrollment Requirements: Students see their own, partners see assigned
CREATE POLICY "Students can view their own enrollment requirements"
  ON enrollment_requirements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.id = enrollment_requirements.enrollment_id
        AND e.student_id = auth.uid()
    )
  );

CREATE POLICY "Partners can view assigned enrollment requirements"
  ON enrollment_requirements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.id = enrollment_requirements.enrollment_id
        AND e.partner_owner_user_id = auth.uid()
    )
  );

-- Hour Logs: Students can CRUD their own, partners can view/verify assigned
CREATE POLICY "Students can manage their own hour logs"
  ON hour_logs FOR ALL
  USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Partners can view and verify assigned student hour logs"
  ON hour_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.id = hour_logs.enrollment_id
        AND e.partner_owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Partners can verify hour logs"
  ON hour_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM enrollments e
      WHERE e.id = hour_logs.enrollment_id
        AND e.partner_owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    verified_by = auth.uid()
  );

-- Alert Notifications: Students see their own, partners see assigned
CREATE POLICY "Students can view their own alerts"
  ON alert_notifications FOR SELECT
  USING (auth.uid() = student_id);

CREATE POLICY "Partners can view assigned student alerts"
  ON alert_notifications FOR SELECT
  USING (auth.uid() = partner_user_id);

CREATE POLICY "Partners can resolve assigned student alerts"
  ON alert_notifications FOR UPDATE
  USING (auth.uid() = partner_user_id)
  WITH CHECK (resolved_by = auth.uid());

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- This migration creates:
-- ✅ Weekly hours-based compliance (Monday-Sunday)
-- ✅ Enrollment requirements per student
-- ✅ Hour logs with verification
-- ✅ Weekly + midweek alert scans
-- ✅ Auto-resolve when hours logged
-- ✅ Real-time compliance dashboard view
-- ✅ Full RLS security
--
-- Cron Schedule:
-- Wednesday 7:30 PM EST: run_midweek_progress_check()
-- Sunday 7:30 PM EST: run_weekly_hours_alerts()
-- =====================================================
