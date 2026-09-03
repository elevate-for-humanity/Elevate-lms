-- AI Planner Tables
--
-- Stores plan executions for audit trail and replay.
-- Apply in Supabase Dashboard → SQL Editor.

CREATE TABLE IF NOT EXISTS public.ai_plan_executions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id      text NOT NULL,
  goal         text NOT NULL,
  status       text NOT NULL DEFAULT 'pending', -- pending, running, done, failed
  steps        jsonb NOT NULL DEFAULT '[]',
  step_count   integer DEFAULT 0,
  done_count   integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  actor_id     uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  started_at   timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_plan_executions_actor_idx   ON public.ai_plan_executions (actor_id);
CREATE INDEX IF NOT EXISTS ai_plan_executions_status_idx  ON public.ai_plan_executions (status);
CREATE INDEX IF NOT EXISTS ai_plan_executions_created_idx ON public.ai_plan_executions (created_at DESC);
