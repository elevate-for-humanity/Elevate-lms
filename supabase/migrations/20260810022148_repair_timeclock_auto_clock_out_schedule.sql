-- Repair the timeclock geofence cron after auto_clock_out_if_needed was
-- converted from an integer timeout argument to a per-entry UUID argument.
-- Keep the 15-minute rule in the sweep predicate and pass each matching entry id.

SELECT cron.schedule(
  'timeclock_auto_clock_out',
  '*/10 * * * *',
  $$
  SELECT public.auto_clock_out_if_needed(id)
  FROM public.progress_entries
  WHERE clock_out_at IS NULL
    AND outside_geofence_since IS NOT NULL
    AND now() - outside_geofence_since >= interval '15 minutes';
  $$
);
