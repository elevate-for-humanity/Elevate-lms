-- Add webhook_key to workflows for external trigger support.
-- Unique per workflow — used as the URL key in /api/workflows/webhook/[key].
-- Idempotent — safe to re-run.

ALTER TABLE public.workflows
  ADD COLUMN IF NOT EXISTS webhook_key text UNIQUE;

CREATE INDEX IF NOT EXISTS workflows_webhook_key_idx
  ON public.workflows (webhook_key)
  WHERE webhook_key IS NOT NULL;
