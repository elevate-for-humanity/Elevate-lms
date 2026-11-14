-- Applied to production via migration index_analytics_user_agent_search.
-- The Admin automation count hit the 2.5-second Data API timeout.
-- The existing pg_trgm extension lives in the extensions schema.
-- Verified with EXPLAIN ANALYZE: 1522.95 ms before, 70.89 ms after.
-- Live 7-day and 30-day report checks returned actual counts.
-- No records, RLS policies, roles or grants are changed.
BEGIN;
SET LOCAL lock_timeout = '2s';
SET LOCAL statement_timeout = '90s';
CREATE INDEX IF NOT EXISTS page_views_user_agent_trgm_idx
ON public.page_views USING gin (user_agent extensions.gin_trgm_ops);
COMMIT;
