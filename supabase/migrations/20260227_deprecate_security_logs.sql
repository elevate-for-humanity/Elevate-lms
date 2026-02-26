-- Deprecate security_logs table
-- This table has 0 rows, no triggers, no external consumers, and only one
-- non-standard column ("elevateforhumanity" TEXT). All security event logging
-- has been redirected to audit_logs with event_type = 'security'.
--
-- CI quality-gates.sh blocks any new code references to this table.
-- Safe to DROP after confirming no Supabase Dashboard automations reference it.

COMMENT ON TABLE public.security_logs IS 'DEPRECATED: Use audit_logs with event_type=security. Table has 0 rows and no useful schema. Blocked in CI.';
