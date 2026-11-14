-- progress_entries → hour_entries sync tracking
--
-- Adds hour_entry_id to progress_entries so the clock-out sync is idempotent:
-- once a shift is synced to hour_entries, the FK prevents duplicate entries.
--
-- Also adds a DB-level index on admin_alerts(alert_type, created_at) for
-- the missed-clock-out cron query pattern.

-- 1. Track which hour_entries row was created from this shift
ALTER TABLE public.progress_entries
  ADD COLUMN IF NOT EXISTS hour_entry_id uuid REFERENCES public.hour_entries(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_progress_entries_hour_entry_id
  ON public.progress_entries(hour_entry_id)
  WHERE hour_entry_id IS NOT NULL;

-- 2. Index for missed-clock-out cron: open shifts older than N hours
CREATE INDEX IF NOT EXISTS idx_progress_entries_open_shifts
  ON public.progress_entries(clock_in_at)
  WHERE clock_out_at IS NULL AND clock_in_at IS NOT NULL;

-- 3. Index for admin_alerts queries by type + time (cron + dashboard)
CREATE INDEX IF NOT EXISTS idx_admin_alerts_type_created
  ON public.admin_alerts(alert_type, created_at DESC);

COMMENT ON COLUMN public.progress_entries.hour_entry_id IS
  'FK to hour_entries row created when this shift was synced on clock-out. NULL = not yet synced.';
