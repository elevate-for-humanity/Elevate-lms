-- ============================================================
-- LEADERBOARD AGGREGATION VIEWS
-- Materialized views for fast leaderboard queries
-- Safe to run multiple times (idempotent)
-- ============================================================

-- Drop existing views if they exist
DROP MATERIALIZED VIEW IF EXISTS public.leaderboard_weekly CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.leaderboard_monthly CASCADE;
DROP MATERIALIZED VIEW IF EXISTS public.leaderboard_all_time CASCADE;

-- 1) WEEKLY LEADERBOARD
CREATE MATERIALIZED VIEW public.leaderboard_weekly AS
SELECT 
  u.id as user_id,
  u.raw_user_meta_data->>'full_name' as name,
  u.raw_user_meta_data->>'avatar_url' as avatar_url,
  tm.tenant_id,
  COALESCE(SUM(b.points), 0) as points,
  COUNT(DISTINCT ub.badge_id) as badges_count,
  COUNT(DISTINCT ce.course_id) FILTER (WHERE ce.status = 'completed') as courses_completed,
  COALESCE(us.current_streak, 0) as streak_days,
  ROW_NUMBER() OVER (PARTITION BY tm.tenant_id ORDER BY COALESCE(SUM(b.points), 0) DESC) as rank
FROM auth.users u
INNER JOIN public.tenant_memberships tm ON u.id = tm.user_id
LEFT JOIN public.user_badges ub ON u.id = ub.user_id AND ub.earned_at >= NOW() - INTERVAL '7 days'
LEFT JOIN public.badges b ON ub.badge_id = b.id
LEFT JOIN public.course_enrollments ce ON u.id = ce.user_id AND ce.updated_at >= NOW() - INTERVAL '7 days'
LEFT JOIN public.user_streaks us ON u.id = us.user_id
GROUP BY u.id, u.raw_user_meta_data, tm.tenant_id, us.current_streak;

CREATE UNIQUE INDEX idx_leaderboard_weekly_user_tenant ON public.leaderboard_weekly(user_id, tenant_id);
CREATE INDEX idx_leaderboard_weekly_tenant_rank ON public.leaderboard_weekly(tenant_id, rank);
CREATE INDEX idx_leaderboard_weekly_points ON public.leaderboard_weekly(points DESC);

-- 2) MONTHLY LEADERBOARD
CREATE MATERIALIZED VIEW public.leaderboard_monthly AS
SELECT 
  u.id as user_id,
  u.raw_user_meta_data->>'full_name' as name,
  u.raw_user_meta_data->>'avatar_url' as avatar_url,
  tm.tenant_id,
  COALESCE(SUM(b.points), 0) as points,
  COUNT(DISTINCT ub.badge_id) as badges_count,
  COUNT(DISTINCT ce.course_id) FILTER (WHERE ce.status = 'completed') as courses_completed,
  COALESCE(us.current_streak, 0) as streak_days,
  ROW_NUMBER() OVER (PARTITION BY tm.tenant_id ORDER BY COALESCE(SUM(b.points), 0) DESC) as rank
FROM auth.users u
INNER JOIN public.tenant_memberships tm ON u.id = tm.user_id
LEFT JOIN public.user_badges ub ON u.id = ub.user_id AND ub.earned_at >= NOW() - INTERVAL '30 days'
LEFT JOIN public.badges b ON ub.badge_id = b.id
LEFT JOIN public.course_enrollments ce ON u.id = ce.user_id AND ce.updated_at >= NOW() - INTERVAL '30 days'
LEFT JOIN public.user_streaks us ON u.id = us.user_id
GROUP BY u.id, u.raw_user_meta_data, tm.tenant_id, us.current_streak;

CREATE UNIQUE INDEX idx_leaderboard_monthly_user_tenant ON public.leaderboard_monthly(user_id, tenant_id);
CREATE INDEX idx_leaderboard_monthly_tenant_rank ON public.leaderboard_monthly(tenant_id, rank);
CREATE INDEX idx_leaderboard_monthly_points ON public.leaderboard_monthly(points DESC);

-- 3) ALL-TIME LEADERBOARD
CREATE MATERIALIZED VIEW public.leaderboard_all_time AS
SELECT 
  u.id as user_id,
  u.raw_user_meta_data->>'full_name' as name,
  u.raw_user_meta_data->>'avatar_url' as avatar_url,
  tm.tenant_id,
  COALESCE(SUM(b.points), 0) as points,
  COUNT(DISTINCT ub.badge_id) as badges_count,
  COUNT(DISTINCT ce.course_id) FILTER (WHERE ce.status = 'completed') as courses_completed,
  COALESCE(us.current_streak, 0) as streak_days,
  COALESCE(us.longest_streak, 0) as longest_streak,
  ROW_NUMBER() OVER (PARTITION BY tm.tenant_id ORDER BY COALESCE(SUM(b.points), 0) DESC) as rank
FROM auth.users u
INNER JOIN public.tenant_memberships tm ON u.id = tm.user_id
LEFT JOIN public.user_badges ub ON u.id = ub.user_id
LEFT JOIN public.badges b ON ub.badge_id = b.id
LEFT JOIN public.course_enrollments ce ON u.id = ce.user_id
LEFT JOIN public.user_streaks us ON u.id = us.user_id
GROUP BY u.id, u.raw_user_meta_data, tm.tenant_id, us.current_streak, us.longest_streak;

CREATE UNIQUE INDEX idx_leaderboard_all_time_user_tenant ON public.leaderboard_all_time(user_id, tenant_id);
CREATE INDEX idx_leaderboard_all_time_tenant_rank ON public.leaderboard_all_time(tenant_id, rank);
CREATE INDEX idx_leaderboard_all_time_points ON public.leaderboard_all_time(points DESC);

-- 4) REFRESH FUNCTION
CREATE OR REPLACE FUNCTION public.refresh_leaderboards()
RETURNS void
LANGUAGE plpgsql
SECURITY definer
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.leaderboard_weekly;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.leaderboard_monthly;
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.leaderboard_all_time;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_leaderboards() TO service_role;

-- 5) RLS POLICIES
ALTER MATERIALIZED VIEW public.leaderboard_weekly SET (security_invoker = on);
ALTER MATERIALIZED VIEW public.leaderboard_monthly SET (security_invoker = on);
ALTER MATERIALIZED VIEW public.leaderboard_all_time SET (security_invoker = on);

-- Note: Materialized views don't support RLS directly, but we can create views on top
CREATE OR REPLACE VIEW public.leaderboard_weekly_view AS
SELECT * FROM public.leaderboard_weekly
WHERE tenant_id = (
  SELECT tenant_id FROM public.tenant_memberships 
  WHERE user_id = auth.uid() 
  LIMIT 1
);

CREATE OR REPLACE VIEW public.leaderboard_monthly_view AS
SELECT * FROM public.leaderboard_monthly
WHERE tenant_id = (
  SELECT tenant_id FROM public.tenant_memberships 
  WHERE user_id = auth.uid() 
  LIMIT 1
);

CREATE OR REPLACE VIEW public.leaderboard_all_time_view AS
SELECT * FROM public.leaderboard_all_time
WHERE tenant_id = (
  SELECT tenant_id FROM public.tenant_memberships 
  WHERE user_id = auth.uid() 
  LIMIT 1
);

GRANT SELECT ON public.leaderboard_weekly_view TO authenticated;
GRANT SELECT ON public.leaderboard_monthly_view TO authenticated;
GRANT SELECT ON public.leaderboard_all_time_view TO authenticated;

-- 6) HELPER FUNCTION: Get user's leaderboard position
CREATE OR REPLACE FUNCTION public.get_my_leaderboard_position(
  p_timeframe text DEFAULT 'all'
)
RETURNS TABLE (
  rank bigint,
  points numeric,
  badges_count bigint,
  courses_completed bigint,
  streak_days int,
  total_users bigint
)
LANGUAGE plpgsql
SECURITY definer
SET search_path = public
AS $$
DECLARE
  v_tenant_id uuid;
BEGIN
  -- Get user's tenant
  SELECT tenant_id INTO v_tenant_id
  FROM public.tenant_memberships
  WHERE user_id = auth.uid()
  LIMIT 1;

  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'User not in any tenant';
  END IF;

  -- Return position based on timeframe
  IF p_timeframe = 'week' THEN
    RETURN QUERY
    SELECT 
      l.rank,
      l.points,
      l.badges_count,
      l.courses_completed,
      l.streak_days,
      (SELECT COUNT(*) FROM public.leaderboard_weekly WHERE tenant_id = v_tenant_id) as total_users
    FROM public.leaderboard_weekly l
    WHERE l.user_id = auth.uid() AND l.tenant_id = v_tenant_id;
  ELSIF p_timeframe = 'month' THEN
    RETURN QUERY
    SELECT 
      l.rank,
      l.points,
      l.badges_count,
      l.courses_completed,
      l.streak_days,
      (SELECT COUNT(*) FROM public.leaderboard_monthly WHERE tenant_id = v_tenant_id) as total_users
    FROM public.leaderboard_monthly l
    WHERE l.user_id = auth.uid() AND l.tenant_id = v_tenant_id;
  ELSE
    RETURN QUERY
    SELECT 
      l.rank,
      l.points,
      l.badges_count,
      l.courses_completed,
      l.streak_days,
      (SELECT COUNT(*) FROM public.leaderboard_all_time WHERE tenant_id = v_tenant_id) as total_users
    FROM public.leaderboard_all_time l
    WHERE l.user_id = auth.uid() AND l.tenant_id = v_tenant_id;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_my_leaderboard_position(text) TO authenticated;

-- Comments
COMMENT ON MATERIALIZED VIEW public.leaderboard_weekly IS 'Weekly leaderboard aggregated by tenant - refresh hourly';
COMMENT ON MATERIALIZED VIEW public.leaderboard_monthly IS 'Monthly leaderboard aggregated by tenant - refresh hourly';
COMMENT ON MATERIALIZED VIEW public.leaderboard_all_time IS 'All-time leaderboard aggregated by tenant - refresh hourly';
COMMENT ON FUNCTION public.refresh_leaderboards IS 'Refresh all leaderboard materialized views - call hourly via cron';
COMMENT ON FUNCTION public.get_my_leaderboard_position IS 'Get current user leaderboard position and stats';

-- Initial refresh
SELECT public.refresh_leaderboards();
