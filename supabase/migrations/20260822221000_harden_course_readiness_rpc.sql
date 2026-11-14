-- Remove unnecessary elevated execution from learner readiness.
-- The underlying course_lessons and checkpoint_scores tables already enforce RLS,
-- and the caller remains restricted to their own checkpoint rows through auth.uid().
CREATE OR REPLACE FUNCTION public.get_my_course_readiness(p_course_id uuid)
RETURNS TABLE (
  domain_key text,
  latest_score integer,
  passing_score integer,
  passed boolean,
  attempt_count bigint,
  last_attempt_at timestamptz
)
LANGUAGE sql
SECURITY INVOKER
SET search_path TO 'public', 'pg_temp'
AS $function$
  WITH course_domains AS (
    SELECT DISTINCT cl.domain_key
    FROM public.course_lessons cl
    WHERE cl.course_id = p_course_id
      AND nullif(trim(cl.domain_key), '') IS NOT NULL
  ),
  ranked AS (
    SELECT
      cl.domain_key,
      cs.score,
      cs.passing_score,
      cs.passed,
      cs.created_at,
      row_number() OVER (
        PARTITION BY cl.domain_key
        ORDER BY cs.created_at DESC, cs.attempt_number DESC, cs.id DESC
      ) AS rn,
      count(*) OVER (PARTITION BY cl.domain_key) AS attempts
    FROM public.checkpoint_scores cs
    JOIN public.course_lessons cl ON cl.id = cs.lesson_id
    WHERE cs.course_id = p_course_id
      AND cs.user_id = auth.uid()
      AND nullif(trim(cl.domain_key), '') IS NOT NULL
  )
  SELECT
    d.domain_key,
    r.score AS latest_score,
    r.passing_score,
    coalesce(r.passed, false) AS passed,
    coalesce(r.attempts, 0)::bigint AS attempt_count,
    r.created_at AS last_attempt_at
  FROM course_domains d
  LEFT JOIN ranked r ON r.domain_key = d.domain_key AND r.rn = 1
  ORDER BY d.domain_key;
$function$;

REVOKE ALL ON FUNCTION public.get_my_course_readiness(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_course_readiness(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_my_course_readiness(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_course_readiness(uuid) TO service_role;
