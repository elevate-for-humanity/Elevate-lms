-- The underlying geofence evidence remains in workflow events. Keep one open
-- operational alert per training entry and action, including concurrent attempts.
CREATE UNIQUE INDEX IF NOT EXISTS admin_alerts_open_geofence_entry_action_uidx
ON public.admin_alerts (progress_entry_id, (coalesce(metadata->>'action', '')))
WHERE alert_type = 'geofence_violation' AND resolved IS NOT TRUE
  AND progress_entry_id IS NOT NULL;
