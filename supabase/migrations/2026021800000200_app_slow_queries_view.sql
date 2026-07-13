-- View: top slow app queries (excludes dashboard/meta noise).
-- Run `SELECT * FROM public.v_app_slow_queries LIMIT 20;` to see production bottlenecks.

CREATE OR REPLACE VIEW public.v_app_slow_queries AS
SELECT
  s.queryid,
  left(s.query, 200)                                    AS query_preview,
  s.calls,
  round((s.total_exec_time / 1000)::numeric, 2)         AS total_sec,
  round((s.mean_exec_time)::numeric, 2)                  AS avg_ms,
  round((s.max_exec_time)::numeric, 2)                   AS max_ms,
  s.rows                                                  AS total_rows,
  round(
    CASE WHEN s.shared_blks_hit + s.shared_blks_read = 0 THEN 0
         ELSE 100.0 * s.shared_blks_hit / (s.shared_blks_hit + s.shared_blks_read)
    END, 1
  )                                                       AS cache_hit_pct,
  r.rolname
FROM pg_stat_statements s
JOIN pg_roles r ON r.oid = s.userid
WHERE
  -- Exclude dashboard / schema introspection
  s.query NOT ILIKE '%pg_catalog%'
  AND s.query NOT ILIKE '%information_schema%'
  AND s.query NOT ILIKE '%pg_class%'
  AND s.query NOT ILIKE '%pg_namespace%'
  AND s.query NOT ILIKE '%pg_attribute%'
  AND s.query NOT ILIKE '%pg_constraint%'
  AND s.query NOT ILIKE '%pg_proc%'
  AND s.query NOT ILIKE '%pg_timezone_names%'
  AND s.query NOT ILIKE '%pg_stat_statements%'
  AND s.query NOT ILIKE '%pg_extension%'
  AND s.query NOT ILIKE '%pg_type%'
  AND s.query NOT ILIKE '%pg_index%'
  -- Exclude Supabase internal roles
  AND r.rolname NOT IN ('supabase_read_only_user', 'supabase_admin', 'supabase_storage_admin')
ORDER BY s.total_exec_time DESC;

COMMENT ON VIEW public.v_app_slow_queries IS 'Top slow queries from app code only (no dashboard/meta noise). Use to find production bottlenecks.';
