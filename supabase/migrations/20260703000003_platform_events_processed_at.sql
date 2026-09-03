-- Add processed_at to platform_events so the workflow-event-processor
-- can track which events have been dispatched to the workflow engine.
-- Idempotent — safe to re-run.

ALTER TABLE public.platform_events
  ADD COLUMN IF NOT EXISTS processed_at timestamptz;

CREATE INDEX IF NOT EXISTS platform_events_unprocessed_idx
  ON public.platform_events (created_at)
  WHERE processed_at IS NULL;
