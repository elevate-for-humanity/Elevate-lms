-- 20260629000003_inactive_learners_rpc.sql
-- admin_inactive_learners(inactive_days, limit)
--
-- Replaces a 4-query chain:
--   1. fetch active enrollments (up to 100 rows)
--   2. fetch recent lesson_progress per user
--   3. fetch profiles for inactive user_ids
--   4. fetch program names for inactive program_ids
--
-- This single JOIN does all four steps server-side and returns only the
-- rows the dashboard needs, fully enriched.
--
-- inactive_days: learners with no lesson_progress.updated_at in this many days
-- limit_n:       max rows to return (dashboard uses 20)

CREATE OR REPLACE FUNCTION public.admin_inactive_learners(
  inactive_days int     DEFAULT 3,
  limit_n       int     DEFAULT 20
)
RETURNS TABLE (
  enrollment_id  uuid,
  user_id        uuid,
  program_id     uuid,
  enrolled_at    timestamptz,
  full_name      text,
  email          text,
  program_title  text,
  last_activity  timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pe.id                                          AS enrollment_id,
    pe.user_id,
    pe.program_id,
    pe.enrolled_at,
    COALESCE(p.full_name, p.first_name || ' ' || p.last_name, p.email) AS full_name,
    p.email,
    COALESCE(prog.title, prog.name, pe.program_id::text)               AS program_title,
    MAX(lp.updated_at)                             AS last_activity
  FROM public.program_enrollments pe
  LEFT JOIN public.profiles        p    ON p.id    = pe.user_id
  LEFT JOIN public.programs        prog ON prog.id = pe.program_id
  LEFT JOIN public.lesson_progress lp   ON lp.user_id = pe.user_id
  WHERE pe.enrollment_state = 'active'
    AND pe.user_id IS NOT NULL
  GROUP BY pe.id, pe.user_id, pe.program_id, pe.enrolled_at,
           p.full_name, p.first_name, p.last_name, p.email,
           prog.title, prog.name
  HAVING MAX(lp.updated_at) IS NULL
      OR MAX(lp.updated_at) < NOW() - (inactive_days || ' days')::interval
  ORDER BY last_activity ASC NULLS FIRST
  LIMIT limit_n;
$$;

GRANT EXECUTE ON FUNCTION public.admin_inactive_learners(int, int)
  TO service_role;
