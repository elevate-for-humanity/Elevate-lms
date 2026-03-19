-- Drop the legacy notification_log table.
--
-- The single code reference (app/api/apprentice/email-alerts/route.ts) has been
-- updated to write to notification_logs (the canonical table). notification_log
-- had 0 rows and no inbound foreign keys, so this drop is safe.
--
-- See: supabase/migrations/20260216000002_drop_redundant_tables.sql (Phase 2)

DROP TABLE IF EXISTS public.notification_log;
