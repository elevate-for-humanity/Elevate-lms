-- Retire the unused pre-unification Studio workspace/repository schema.
-- Verified on 2026-08-20 before removal:
--   * every table below contained exactly zero rows;
--   * no active application/runtime code queried these tables;
--   * no public view or function referenced them;
--   * foreign keys were internal to this cluster except user ownership references.
-- Canonical Admin AI conversation data remains in studio_conversations and
-- devstudio_chat_log. Customer workspace/deployment tables are not part of this cleanup.

DROP TABLE IF EXISTS public.studio_terminal_commands;
DROP TABLE IF EXISTS public.studio_comments;
DROP TABLE IF EXISTS public.studio_commit_cache;
DROP TABLE IF EXISTS public.studio_favorites;
DROP TABLE IF EXISTS public.studio_recent_files;
DROP TABLE IF EXISTS public.studio_shares;
DROP TABLE IF EXISTS public.studio_files;
DROP TABLE IF EXISTS public.studio_terminal_sessions;
DROP TABLE IF EXISTS public.studio_settings;
DROP TABLE IF EXISTS public.studio_deploy_tokens;
DROP TABLE IF EXISTS public.studio_pr_tracking;
DROP TABLE IF EXISTS public.studio_repos;
DROP TABLE IF EXISTS public.studio_workspaces;
