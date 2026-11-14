-- =============================================================================
-- Phase 5.1: Unified audit view
--
-- Merges all 7 audit tables into one queryable surface with a consistent shape.
-- A compliance auditor can query a single view for any actor, entity, or time range.
--
-- Source tables unified:
--   1. audit_logs                (canonical)
--   2. admin_audit_events        (immutable admin actions)
--   3. compliance_audit_log      (compliance-specific)
--   4. partner_audit_log         (partner actions)
--   5. franchise_audit_log       (franchise actions)
--   6. course_audit_log          (course/LMS actions)
--   7. audit_failures            (failed audit writes)
-- =============================================================================

CREATE OR REPLACE VIEW public.unified_audit_log AS

-- 1. audit_logs (canonical)
SELECT
  id::TEXT                        AS id,
  'audit_logs'                    AS source_table,
  action                          AS event_type,
  user_id                         AS actor_user_id,
  NULL::TEXT                      AS actor_role,
  resource_type                   AS target_entity_type,
  resource_id::TEXT               AS target_entity_id,
  NULL::UUID                      AS tenant_id,
  details                         AS metadata,
  created_at
FROM public.audit_logs

UNION ALL

-- 2. admin_audit_events
SELECT
  id::TEXT,
  'admin_audit_events',
  action,
  actor_user_id,
  actor_role,
  entity                          AS target_entity_type,
  entity_id::TEXT                 AS target_entity_id,
  NULL::UUID                      AS tenant_id,
  COALESCE(after_state, before_state, '{}') AS metadata,
  created_at
FROM public.admin_audit_events

UNION ALL

-- 3. compliance_audit_log (inspect columns dynamically)
SELECT
  id::TEXT,
  'compliance_audit_log',
  event_type,
  user_id                         AS actor_user_id,
  NULL::TEXT                      AS actor_role,
  entity_type                     AS target_entity_type,
  entity_id::TEXT                 AS target_entity_id,
  tenant_id,
  metadata,
  created_at
FROM public.compliance_audit_log

UNION ALL

-- 4. partner_audit_log
SELECT
  id::TEXT,
  'partner_audit_log',
  action                          AS event_type,
  performed_by                    AS actor_user_id,
  NULL::TEXT                      AS actor_role,
  'partner'                       AS target_entity_type,
  partner_id::TEXT                AS target_entity_id,
  NULL::UUID                      AS tenant_id,
  details                         AS metadata,
  created_at
FROM public.partner_audit_log

UNION ALL

-- 5. franchise_audit_log
SELECT
  id::TEXT,
  'franchise_audit_log',
  action                          AS event_type,
  performed_by                    AS actor_user_id,
  NULL::TEXT                      AS actor_role,
  'franchise'                     AS target_entity_type,
  franchise_id::TEXT              AS target_entity_id,
  NULL::UUID                      AS tenant_id,
  details                         AS metadata,
  created_at
FROM public.franchise_audit_log

UNION ALL

-- 6. course_audit_log
SELECT
  id::TEXT,
  'course_audit_log',
  action                          AS event_type,
  actor_id                        AS actor_user_id,
  NULL::TEXT                      AS actor_role,
  entity_type                     AS target_entity_type,
  entity_id::TEXT                 AS target_entity_id,
  NULL::UUID                      AS tenant_id,
  metadata,
  created_at
FROM public.course_audit_log

UNION ALL

-- 7. audit_failures
SELECT
  id::TEXT,
  'audit_failures',
  'audit_failure'                 AS event_type,
  NULL::UUID                      AS actor_user_id,
  NULL::TEXT                      AS actor_role,
  'audit_system'                  AS target_entity_type,
  NULL::TEXT                      AS target_entity_id,
  NULL::UUID                      AS tenant_id,
  jsonb_build_object(
    'error', error_message,
    'original_action', original_action,
    'original_table', original_table
  )                               AS metadata,
  created_at
FROM public.audit_failures;

-- Index hint: the underlying tables already have indexes on created_at and user_id.
-- The view inherits query planning from those indexes.

-- Grant read to admin roles via service_role; no direct authenticated access
-- (query through API routes that enforce admin auth).
GRANT SELECT ON public.unified_audit_log TO service_role;

COMMENT ON VIEW public.unified_audit_log IS
  'Unified read surface across all 7 audit tables. '
  'Normalized to: source_table, event_type, actor_user_id, actor_role, '
  'target_entity_type, target_entity_id, tenant_id, metadata, created_at. '
  'Query via /api/admin/audit endpoint — do not expose directly to authenticated role.';
