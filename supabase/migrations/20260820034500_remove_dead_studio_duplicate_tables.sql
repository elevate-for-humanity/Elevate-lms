-- Remove verified dead Studio persistence duplicates.
-- Evidence before removal: zero rows, no runtime repo references, no DB function/view refs,
-- no incoming foreign keys. Canonical conversation persistence remains studio_conversations;
-- canonical AI deployment tracking remains ai_deployments; canonical workflow state remains
-- workflows + workflow_runs.

DROP TABLE IF EXISTS public.dev_studio_conversations;
DROP TABLE IF EXISTS public.studio_chat_history;
DROP TABLE IF EXISTS public.studio_sessions;
DROP TABLE IF EXISTS public.studio_deployments;
DROP TABLE IF EXISTS public.studio_workflow_tracking;
