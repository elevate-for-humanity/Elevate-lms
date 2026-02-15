-- Drop confirmed redundant tables
-- Evidence: duplication audit 2026-02-15, all verified via row counts, column comparison, and FK analysis
--
-- SAFE TO DROP (0 rows, 0 inbound FKs, 0 code references):
--   lms_security_audit_log  — duplicate of security_audit_logs
--
-- REQUIRES CODE MIGRATION FIRST (marked with TODO):
--   notification_log        — 0 rows, 1 code ref (app/api/apprentice/email-alerts/route.ts → notification_logs)
--   tenant_memberships      — 1 row,  1 code ref (app/api/stripe/checkout/route.ts → tenant_members)
--   public.users            — 671 rows, 8 code refs → profiles (17 real orphans need profiles created)
--   user_profiles           — 0 rows, 39 code refs → should become a view over profiles
--
-- NOT DUPLICATES (different purpose, keep both):
--   public.sso_providers    — app-level OIDC config with tenant_id, client_secret, OAuth URLs
--   auth.sso_providers      — Supabase internal SAML/SSO (5 cols)

-- ============================================================
-- PHASE 1: Safe immediate drops (no code references)
-- ============================================================

DROP TABLE IF EXISTS public.lms_security_audit_log;

-- ============================================================
-- PHASE 2: After code migration (do NOT run until code is updated)
-- ============================================================

-- TODO: Update app/api/apprentice/email-alerts/route.ts to use 'notification_logs'
-- DROP TABLE IF EXISTS public.notification_log;

-- TODO: Migrate 1 row from tenant_memberships to tenant_members
-- TODO: Update app/api/stripe/checkout/route.ts to use 'tenant_members'
-- DROP TABLE IF EXISTS public.tenant_memberships;

-- TODO: Create profiles rows for 17 real orphan users
-- TODO: Update 8 code paths from 'users' to 'profiles'
-- DROP TABLE IF EXISTS public.users;

-- TODO: Either populate user_profiles or replace with a view over profiles
-- TODO: Update 39 code paths or create view: CREATE VIEW user_profiles AS SELECT id, id as user_id, ... FROM profiles
-- DROP TABLE IF EXISTS public.user_profiles;
