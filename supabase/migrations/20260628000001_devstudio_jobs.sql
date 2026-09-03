-- Dev Studio persistent job queue
-- Stores every command run from the Dev Studio Command tab so sessions
-- survive page reloads, disconnects, and browser refreshes.

CREATE TABLE IF NOT EXISTS public.devstudio_jobs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  command       text        NOT NULL,
  status        text        NOT NULL DEFAULT 'running'
                            CHECK (status IN ('running','completed','failed','cancelled')),
  log_lines     jsonb       NOT NULL DEFAULT '[]'::jsonb,
  tool_name     text,
  tool_args     jsonb,
  started_at    timestamptz NOT NULL DEFAULT now(),
  finished_at   timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Fix devstudio_chat_log schema — add missing columns the chat route expects
ALTER TABLE public.devstudio_chat_log
  ADD COLUMN IF NOT EXISTS user_message       text,
  ADD COLUMN IF NOT EXISTS assistant_response text,
  ADD COLUMN IF NOT EXISTS file_context       text,
  ADD COLUMN IF NOT EXISTS provider           text;

-- Indexes
CREATE INDEX IF NOT EXISTS devstudio_jobs_user_id_idx    ON public.devstudio_jobs(user_id);
CREATE INDEX IF NOT EXISTS devstudio_jobs_status_idx     ON public.devstudio_jobs(status);
CREATE INDEX IF NOT EXISTS devstudio_jobs_started_at_idx ON public.devstudio_jobs(started_at DESC);

-- RLS: admins can read/write their own jobs; super_admin can read all
ALTER TABLE public.devstudio_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "devstudio_jobs_own" ON public.devstudio_jobs
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "devstudio_jobs_super_admin_read" ON public.devstudio_jobs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );
