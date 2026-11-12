-- Read-only: blocked PARIS repairs grouped by error code. Run before
-- requeue_fixed_paris_repairs(text[]); only requeue codes whose cause is fixed.
SELECT error_code, count(*) AS repairs, min(updated_at) AS oldest, max(updated_at) AS newest,
  max(attempt_count) AS max_attempt_count
FROM public.paris_code_repairs WHERE status = 'blocked'
GROUP BY error_code ORDER BY repairs DESC;
