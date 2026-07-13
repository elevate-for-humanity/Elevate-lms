-- Drop legacy org objects confirmed safe to remove (2026-03-28).
--
-- Verified before dropping:
--   organization_members: 0 rows, no RLS, no policies, no FK references,
--     no triggers, no views or functions referencing it, no organization_id
--     column (was never properly org-scoped). Canonical table is organization_users.
--
--   get_invite_by_token(text): exists in DB, 0 app callers, 0 function
--     references in pg_proc. Invite lookup now uses direct org_invites query
--     in /api/org/accept-invite. No callers in app, scripts, or migrations.
--
-- Decision recorded here so future developers do not recreate these objects.

BEGIN;

DROP FUNCTION IF EXISTS public.get_invite_by_token(text);

DROP TABLE IF EXISTS public.organization_members;

COMMIT;
