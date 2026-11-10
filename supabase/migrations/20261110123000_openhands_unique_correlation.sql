-- Serialize OpenHands correlation ownership across simultaneous Admin workers.
-- Existing rows are preserved. Deployment fails safely if historical duplicates
-- exist; operators must investigate them, not silently delete or rewrite tasks.
CREATE UNIQUE INDEX IF NOT EXISTS ai_tasks_openhands_correlation_unique
  ON public.ai_tasks (correlation_id)
  WHERE tool_name = 'openhands.execute'
    AND correlation_id IS NOT NULL;
