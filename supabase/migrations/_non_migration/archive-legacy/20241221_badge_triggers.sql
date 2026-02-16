-- ============================================================
-- BADGE AWARDING AUTOMATION
-- Automatically award badges when conditions are met
-- Safe to run multiple times (idempotent)
-- ============================================================

-- NOTE: This migration creates the trigger functions only.
-- You need to manually insert badges into your badges table first.
-- See the end of this file for the INSERT statements based on your schema.

-- Helper function to award badge by key (idempotent)
CREATE OR REPLACE FUNCTION public.award_badge_by_key(
  p_user_id uuid,
  p_badge_key text
)
RETURNS void
LANGUAGE plpgsql
SECURITY definer
SET search_path = public
AS $$
DECLARE
  v_badge_id uuid;
BEGIN
  -- Get badge ID from key
  SELECT id INTO v_badge_id FROM public.badges WHERE key = p_badge_key;
  
  IF v_badge_id IS NULL THEN
    RAISE NOTICE 'Badge with key % not found', p_badge_key;
    RETURN;
  END IF;

  -- Award badge (idempotent)
  INSERT INTO public.user_badges (user_id, badge_id, earned_at)
  VALUES (p_user_id, v_badge_id, NOW())
  ON CONFLICT (user_id, badge_id) DO NOTHING;
END;
$$;

-- 1) FIRST COURSE COMPLETED
CREATE OR REPLACE FUNCTION public.check_first_course_badge()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    IF (SELECT COUNT(*) FROM public.course_enrollments WHERE user_id = NEW.user_id AND status = 'completed') = 1 THEN
      PERFORM public.award_badge_by_key(NEW.user_id, 'first-course');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_first_course_badge ON public.course_enrollments;
CREATE TRIGGER trigger_first_course_badge
AFTER INSERT OR UPDATE ON public.course_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.check_first_course_badge();

-- 2) 5 COURSES COMPLETED
CREATE OR REPLACE FUNCTION public.check_five_courses_badge()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    IF (SELECT COUNT(*) FROM public.course_enrollments WHERE user_id = NEW.user_id AND status = 'completed') = 5 THEN
      PERFORM public.award_badge_by_key(NEW.user_id, 'five-courses');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_five_courses_badge ON public.course_enrollments;
CREATE TRIGGER trigger_five_courses_badge
AFTER INSERT OR UPDATE ON public.course_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.check_five_courses_badge();

-- 3) 10 COURSES COMPLETED
CREATE OR REPLACE FUNCTION public.check_ten_courses_badge()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    IF (SELECT COUNT(*) FROM public.course_enrollments WHERE user_id = NEW.user_id AND status = 'completed') = 10 THEN
      PERFORM public.award_badge_by_key(NEW.user_id, 'ten-courses');
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ten_courses_badge ON public.course_enrollments;
CREATE TRIGGER trigger_ten_courses_badge
AFTER INSERT OR UPDATE ON public.course_enrollments
FOR EACH ROW
EXECUTE FUNCTION public.check_ten_courses_badge();

-- 4) PERFECT SCORE (100% on assessment)
CREATE OR REPLACE FUNCTION public.check_perfect_score_badge()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.score = 100 AND (OLD.score IS NULL OR OLD.score != 100) THEN
    PERFORM public.award_badge_by_key(NEW.user_id, 'perfect-score');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_perfect_score_badge ON public.assessment_submissions;
CREATE TRIGGER trigger_perfect_score_badge
AFTER INSERT OR UPDATE ON public.assessment_submissions
FOR EACH ROW
EXECUTE FUNCTION public.check_perfect_score_badge();

-- 5) STREAK BADGES (7-day and 30-day)
-- Note: Requires user_streaks table to track consecutive login days
CREATE TABLE IF NOT EXISTS public.user_streaks (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak int DEFAULT 0,
  longest_streak int DEFAULT 0,
  last_login_date date,
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_streaks_user ON public.user_streaks(user_id);

ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_streaks' AND policyname='Users can view own streaks') THEN
    CREATE POLICY "Users can view own streaks" ON public.user_streaks FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='user_streaks' AND policyname='Service role can manage streaks') THEN
    CREATE POLICY "Service role can manage streaks" ON public.user_streaks FOR ALL USING ((auth.jwt() ->> 'role') = 'service_role');
  END IF;
END $$;

-- Function to update streak on login
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY definer
SET search_path = public
AS $$
DECLARE
  v_last_login date;
  v_current_streak int;
  v_longest_streak int;
  v_today date := CURRENT_DATE;
BEGIN
  -- Get or create streak record
  SELECT last_login_date, current_streak, longest_streak
  INTO v_last_login, v_current_streak, v_longest_streak
  FROM public.user_streaks
  WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    -- First login
    INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_login_date)
    VALUES (p_user_id, 1, 1, v_today);
    RETURN;
  END IF;

  -- Already logged in today
  IF v_last_login = v_today THEN
    RETURN;
  END IF;

  -- Consecutive day
  IF v_last_login = v_today - INTERVAL '1 day' THEN
    v_current_streak := v_current_streak + 1;
    v_longest_streak := GREATEST(v_longest_streak, v_current_streak);
    
    -- Award streak badges
    IF v_current_streak = 7 THEN
      PERFORM public.award_badge_by_key(p_user_id, 'seven-day-streak');
    ELSIF v_current_streak = 30 THEN
      PERFORM public.award_badge_by_key(p_user_id, 'thirty-day-streak');
    END IF;
  ELSE
    -- Streak broken
    v_current_streak := 1;
  END IF;

  UPDATE public.user_streaks
  SET 
    current_streak = v_current_streak,
    longest_streak = v_longest_streak,
    last_login_date = v_today,
    updated_at = NOW()
  WHERE user_id = p_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_user_streak(uuid) TO authenticated;

-- 6) TIME-BASED BADGES (Early Bird, Night Owl)
-- Call this from your login/session refresh logic
CREATE OR REPLACE FUNCTION public.check_time_badges(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY definer
SET search_path = public
AS $$
DECLARE
  v_hour int := EXTRACT(HOUR FROM NOW());
BEGIN
  -- Early Bird (before 8am)
  IF v_hour < 8 THEN
    PERFORM public.award_badge_by_key(p_user_id, 'early-bird');
  END IF;

  -- Night Owl (after 10pm)
  IF v_hour >= 22 THEN
    PERFORM public.award_badge_by_key(p_user_id, 'night-owl');
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_time_badges(uuid) TO authenticated;

-- Comments
COMMENT ON FUNCTION public.award_badge_by_key IS 'Idempotent badge awarding by key - safe to call multiple times';
COMMENT ON FUNCTION public.update_user_streak IS 'Update user login streak and award streak badges';
COMMENT ON FUNCTION public.check_time_badges IS 'Check and award time-based badges (early bird, night owl)';
COMMENT ON TABLE public.user_streaks IS 'Tracks consecutive login days for streak badges';

-- ============================================================
-- MANUAL BADGE INSERTION
-- Run ONE of these based on your badges table schema
-- ============================================================

-- OPTION 1: If your badges table has (key, label, description, criteria) columns:
/*
INSERT INTO public.badges (key, label, description, criteria)
VALUES 
  ('first-course', 'First Course Completed', 'Complete your first course', '{"type": "course_completion", "count": 1}'::jsonb),
  ('five-courses', '5 Courses Completed', 'Complete 5 courses', '{"type": "course_completion", "count": 5}'::jsonb),
  ('ten-courses', '10 Courses Completed', 'Complete 10 courses', '{"type": "course_completion", "count": 10}'::jsonb),
  ('seven-day-streak', '7-Day Streak', 'Login for 7 consecutive days', '{"type": "login_streak", "days": 7}'::jsonb),
  ('thirty-day-streak', '30-Day Streak', 'Login for 30 consecutive days', '{"type": "login_streak", "days": 30}'::jsonb),
  ('perfect-score', 'Perfect Score', 'Score 100% on an assessment', '{"type": "assessment_score", "score": 100}'::jsonb),
  ('early-bird', 'Early Bird', 'Login before 8am', '{"type": "time_based", "hour": 8, "before": true}'::jsonb),
  ('night-owl', 'Night Owl', 'Login after 10pm', '{"type": "time_based", "hour": 22, "before": false}'::jsonb)
ON CONFLICT (key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  criteria = EXCLUDED.criteria;
*/

-- OPTION 2: If your badges table has (org_id, key, name, description) columns:
/*
-- Replace 'YOUR_ORG_ID_HERE' with your actual org UUID
INSERT INTO public.badges (org_id, key, name, description)
VALUES 
  ('YOUR_ORG_ID_HERE'::uuid, 'first-course', 'First Course Completed', 'Complete your first course'),
  ('YOUR_ORG_ID_HERE'::uuid, 'five-courses', '5 Courses Completed', 'Complete 5 courses'),
  ('YOUR_ORG_ID_HERE'::uuid, 'ten-courses', '10 Courses Completed', 'Complete 10 courses'),
  ('YOUR_ORG_ID_HERE'::uuid, 'seven-day-streak', '7-Day Streak', 'Login for 7 consecutive days'),
  ('YOUR_ORG_ID_HERE'::uuid, 'thirty-day-streak', '30-Day Streak', 'Login for 30 consecutive days'),
  ('YOUR_ORG_ID_HERE'::uuid, 'perfect-score', 'Perfect Score', 'Score 100% on an assessment'),
  ('YOUR_ORG_ID_HERE'::uuid, 'early-bird', 'Early Bird', 'Login before 8am'),
  ('YOUR_ORG_ID_HERE'::uuid, 'night-owl', 'Night Owl', 'Login after 10pm')
ON CONFLICT (org_id, key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;
*/

-- To check your badges table schema, run:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'badges' ORDER BY ordinal_position;
