-- calculate_student_risk_status RPC
-- Computes and upserts a student's risk status based on lesson activity
-- and enrollment progress. Called by the at-risk-detection cron and the
-- dropout-risk analytics route.
-- Idempotent — safe to re-run.

-- Ensure student_risk_status has a unique constraint on user_id for upsert
ALTER TABLE public.student_risk_status
  ADD COLUMN IF NOT EXISTS risk_score    numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS risk_factors  jsonb   DEFAULT '[]';

-- Add unique constraint on user_id if not already present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'student_risk_status_user_id_key'
      AND conrelid = 'public.student_risk_status'::regclass
  ) THEN
    ALTER TABLE public.student_risk_status
      ADD CONSTRAINT student_risk_status_user_id_key UNIQUE (user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.calculate_student_risk_status(p_student_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_days_inactive   integer := 0;
  v_progress        numeric := 0;
  v_overdue         integer := 0;
  v_risk_score      numeric := 0;
  v_status          text;
  v_factors         jsonb   := '[]'::jsonb;
BEGIN
  -- Days since last lesson activity
  SELECT COALESCE(
    EXTRACT(DAY FROM NOW() - MAX(created_at))::int,
    999
  )
  INTO v_days_inactive
  FROM public.lesson_progress
  WHERE user_id = p_student_id;

  -- Average enrollment progress
  SELECT COALESCE(AVG(progress_percent), 0)
  INTO v_progress
  FROM public.program_enrollments
  WHERE user_id = p_student_id
    AND status = 'active';

  -- Overdue items (lesson_progress rows where due_date < now and not completed)
  SELECT COUNT(*)::int
  INTO v_overdue
  FROM public.lesson_progress
  WHERE user_id = p_student_id
    AND completed = false
    AND due_date < NOW();

  -- Risk score: weighted sum (0-100)
  v_risk_score :=
    LEAST(100,
      (CASE WHEN v_days_inactive > 14 THEN 40
            WHEN v_days_inactive > 7  THEN 20
            WHEN v_days_inactive > 3  THEN 10
            ELSE 0 END)
      + (CASE WHEN v_progress < 10 THEN 30
              WHEN v_progress < 30 THEN 15
              WHEN v_progress < 50 THEN 5
              ELSE 0 END)
      + LEAST(30, v_overdue * 5)
    );

  -- Status bucket
  v_status := CASE
    WHEN v_risk_score >= 70 THEN 'critical'
    WHEN v_risk_score >= 40 THEN 'at_risk'
    WHEN v_risk_score >= 20 THEN 'watch'
    ELSE 'on_track'
  END;

  -- Risk factors array
  IF v_days_inactive > 7 THEN
    v_factors := v_factors || jsonb_build_array(
      jsonb_build_object('factor', 'inactivity', 'days', v_days_inactive)
    );
  END IF;
  IF v_progress < 30 THEN
    v_factors := v_factors || jsonb_build_array(
      jsonb_build_object('factor', 'low_progress', 'pct', v_progress)
    );
  END IF;
  IF v_overdue > 0 THEN
    v_factors := v_factors || jsonb_build_array(
      jsonb_build_object('factor', 'overdue_items', 'count', v_overdue)
    );
  END IF;

  -- Upsert into student_risk_status
  INSERT INTO public.student_risk_status (
    user_id, status, days_since_activity, progress_percentage,
    overdue_count, risk_score, risk_factors, updated_at
  )
  VALUES (
    p_student_id, v_status, v_days_inactive, v_progress,
    v_overdue, v_risk_score, v_factors, NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    status               = EXCLUDED.status,
    days_since_activity  = EXCLUDED.days_since_activity,
    progress_percentage  = EXCLUDED.progress_percentage,
    overdue_count        = EXCLUDED.overdue_count,
    risk_score           = EXCLUDED.risk_score,
    risk_factors         = EXCLUDED.risk_factors,
    updated_at           = NOW();

  RETURN jsonb_build_object(
    'status',    v_status,
    'score',     v_risk_score,
    'days',      v_days_inactive,
    'progress',  v_progress,
    'overdue',   v_overdue,
    'factors',   v_factors
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_student_risk_status(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.calculate_student_risk_status(uuid) TO authenticated;
