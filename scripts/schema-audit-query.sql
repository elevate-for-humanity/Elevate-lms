-- Schema Contract Audit: Extract column definitions for all audit/event tables
-- Run in Supabase Dashboard > SQL Editor
-- Paste full output back to agent

SELECT
  c.table_name,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.is_nullable,
  c.column_default,
  -- Check for FK constraints
  tc.constraint_type,
  ccu.table_name AS fk_references_table
FROM information_schema.columns c
LEFT JOIN information_schema.key_column_usage kcu
  ON c.table_name = kcu.table_name
  AND c.column_name = kcu.column_name
  AND c.table_schema = kcu.table_schema
LEFT JOIN information_schema.table_constraints tc
  ON kcu.constraint_name = tc.constraint_name
  AND tc.constraint_type = 'FOREIGN KEY'
LEFT JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE c.table_schema = 'public'
  AND c.table_name IN (
    -- Immutable audit tables
    'admin_audit_events',
    'audit_logs',
    'franchise_audit_log',
    'partner_audit_log',
    'compliance_audit_log',
    'ferpa_access_logs',
    'ai_audit_log',
    'license_audit_log',
    'security_logs',
    -- Event/decision tables
    'automated_decisions',
    'review_queue',
    'enrollment_events',
    'case_events',
    'license_events',
    'login_events',
    'payment_logs',
    'provisioning_events',
    'notification_logs',
    'email_logs',
    'user_activity_events',
    -- Governance tables
    'program_holder_verification',
    'unauthorized_access_log'
  )
ORDER BY c.table_name, c.ordinal_position;
