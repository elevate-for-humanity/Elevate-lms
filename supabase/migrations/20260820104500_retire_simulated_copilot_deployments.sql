-- Preserve historical copilot configuration snapshots as audit history, then retire
-- the simulated deployment table. Real deployment/build evidence is ai_deployments.
INSERT INTO public.audit_logs (
  action,
  actor_id,
  target_type,
  target_id,
  metadata,
  created_at,
  actor_role,
  resource_type,
  resource_id,
  event_type,
  status,
  source
)
SELECT
  'copilot.configuration_archived',
  deployed_by,
  'copilot_configuration',
  id::text,
  jsonb_build_object(
    'copilot_type', copilot_type,
    'config', config,
    'previous_status', status,
    'deployed_at', deployed_at,
    'updated_at', updated_at,
    'reason', 'Retired simulated copilot deployment registry; not production deployment evidence'
  ),
  coalesce(deployed_at, now()),
  'admin',
  'copilot_configuration',
  id::text,
  'architecture_migration',
  'archived',
  'copilot_deployments'
FROM public.copilot_deployments;

DROP TABLE public.copilot_deployments;
