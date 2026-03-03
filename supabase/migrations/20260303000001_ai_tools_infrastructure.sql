-- AI Tools Infrastructure
-- Tables for video generation, image generation, TTS, course builder, and autopilot

-- ============================================================
-- 1. video_generation_jobs — tracks video-generator-v2 jobs
-- ============================================================
CREATE TABLE IF NOT EXISTS video_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT current_setting('app.current_tenant_id', true)::uuid,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','rendering','uploading','completed','failed')),
  config JSONB NOT NULL DEFAULT '{}',
  scenes JSONB NOT NULL DEFAULT '[]',
  voice TEXT DEFAULT 'onyx',
  resolution TEXT DEFAULT '1280x720',
  format TEXT DEFAULT '16:9',
  output_url TEXT,
  storage_path TEXT,
  duration_seconds NUMERIC(8,2),
  file_size_bytes BIGINT,
  error_message TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_video_gen_jobs_tenant ON video_generation_jobs(tenant_id);
CREATE INDEX idx_video_gen_jobs_status ON video_generation_jobs(status);
CREATE INDEX idx_video_gen_jobs_created ON video_generation_jobs(created_at DESC);

ALTER TABLE video_generation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage video generation jobs"
  ON video_generation_jobs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.tenant_id = video_generation_jobs.tenant_id
        AND p.role IN ('admin','super_admin')
    )
  );

-- ============================================================
-- 2. generated_images — tracks DALL-E / Stability AI outputs
-- ============================================================
CREATE TABLE IF NOT EXISTS generated_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT current_setting('app.current_tenant_id', true)::uuid,
  prompt TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'openai' CHECK (provider IN ('openai','stability','azure')),
  model TEXT DEFAULT 'dall-e-3',
  size TEXT DEFAULT '1024x1024',
  quality TEXT DEFAULT 'standard',
  style TEXT DEFAULT 'natural',
  image_url TEXT,
  storage_path TEXT,
  file_size_bytes BIGINT,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_generated_images_tenant ON generated_images(tenant_id);
CREATE INDEX idx_generated_images_created ON generated_images(created_at DESC);

ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage generated images"
  ON generated_images FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.tenant_id = generated_images.tenant_id
        AND p.role IN ('admin','super_admin')
    )
  );

-- ============================================================
-- 3. tts_audio_files — tracks text-to-speech outputs
-- ============================================================
CREATE TABLE IF NOT EXISTS tts_audio_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT current_setting('app.current_tenant_id', true)::uuid,
  text_input TEXT NOT NULL,
  voice TEXT NOT NULL DEFAULT 'onyx',
  model TEXT DEFAULT 'tts-1',
  speed NUMERIC(3,2) DEFAULT 1.0,
  output_format TEXT DEFAULT 'mp3',
  storage_path TEXT,
  audio_url TEXT,
  duration_seconds NUMERIC(8,2),
  file_size_bytes BIGINT,
  lesson_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_tts_audio_tenant ON tts_audio_files(tenant_id);
CREATE INDEX idx_tts_audio_lesson ON tts_audio_files(lesson_id) WHERE lesson_id IS NOT NULL;

ALTER TABLE tts_audio_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage TTS audio"
  ON tts_audio_files FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.tenant_id = tts_audio_files.tenant_id
        AND p.role IN ('admin','super_admin')
    )
  );

-- ============================================================
-- 4. media_assets — unified asset registry
-- ============================================================
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT current_setting('app.current_tenant_id', true)::uuid,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('video','image','audio','document','thumbnail')),
  title TEXT,
  description TEXT,
  storage_bucket TEXT,
  storage_path TEXT NOT NULL,
  public_url TEXT,
  mime_type TEXT,
  file_size_bytes BIGINT,
  width INTEGER,
  height INTEGER,
  duration_seconds NUMERIC(8,2),
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  source_job_id UUID,
  course_id UUID,
  lesson_id UUID,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_media_assets_tenant ON media_assets(tenant_id);
CREATE INDEX idx_media_assets_type ON media_assets(asset_type);
CREATE INDEX idx_media_assets_course ON media_assets(course_id) WHERE course_id IS NOT NULL;
CREATE INDEX idx_media_assets_lesson ON media_assets(lesson_id) WHERE lesson_id IS NOT NULL;
CREATE INDEX idx_media_assets_tags ON media_assets USING GIN(tags);

ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage media assets"
  ON media_assets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.tenant_id = media_assets.tenant_id
        AND p.role IN ('admin','super_admin')
    )
  );

-- Students can view media linked to their enrolled courses
CREATE POLICY "Students view course media"
  ON media_assets FOR SELECT
  USING (
    course_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM student_enrollments se
      WHERE se.student_id = auth.uid()
        AND se.course_id = media_assets.course_id
        AND se.status = 'active'
    )
  );

-- ============================================================
-- 5. ai_generation_tasks — unified task queue for all AI ops
-- ============================================================
CREATE TABLE IF NOT EXISTS ai_generation_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT current_setting('app.current_tenant_id', true)::uuid,
  task_type TEXT NOT NULL CHECK (task_type IN ('video','image','tts','course','program','content','social_media')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','completed','failed','cancelled')),
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
  input_config JSONB NOT NULL DEFAULT '{}',
  output_result JSONB DEFAULT '{}',
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_tasks_tenant ON ai_generation_tasks(tenant_id);
CREATE INDEX idx_ai_tasks_status ON ai_generation_tasks(status) WHERE status IN ('queued','running');
CREATE INDEX idx_ai_tasks_type ON ai_generation_tasks(task_type);
CREATE INDEX idx_ai_tasks_priority ON ai_generation_tasks(priority DESC, created_at ASC) WHERE status = 'queued';

ALTER TABLE ai_generation_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage AI tasks"
  ON ai_generation_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.tenant_id = ai_generation_tasks.tenant_id
        AND p.role IN ('admin','super_admin')
    )
  );

-- ============================================================
-- 6. autopilot_runs — tracks autopilot execution runs
-- ============================================================
CREATE TABLE IF NOT EXISTS autopilot_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT current_setting('app.current_tenant_id', true)::uuid,
  run_type TEXT NOT NULL CHECK (run_type IN ('course_build','video_batch','content_refresh','link_check','media_enhance','sitemap','deploy_prep')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed','cancelled')),
  config JSONB DEFAULT '{}',
  tasks_total INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  tasks_failed INTEGER DEFAULT 0,
  log JSONB DEFAULT '[]',
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_autopilot_runs_tenant ON autopilot_runs(tenant_id);
CREATE INDEX idx_autopilot_runs_status ON autopilot_runs(status);

ALTER TABLE autopilot_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage autopilot runs"
  ON autopilot_runs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.tenant_id = autopilot_runs.tenant_id
        AND p.role IN ('admin','super_admin')
    )
  );

-- ============================================================
-- 7. course_generation_logs — tracks AI course builder output
-- ============================================================
CREATE TABLE IF NOT EXISTS course_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL DEFAULT current_setting('app.current_tenant_id', true)::uuid,
  course_title TEXT NOT NULL,
  prompt TEXT,
  model TEXT DEFAULT 'gpt-4o',
  generated_structure JSONB NOT NULL DEFAULT '{}',
  modules_count INTEGER DEFAULT 0,
  lessons_count INTEGER DEFAULT 0,
  applied_to_course_id UUID,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','applied','discarded')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_course_gen_logs_tenant ON course_generation_logs(tenant_id);

ALTER TABLE course_generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage course generation logs"
  ON course_generation_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
        AND p.tenant_id = course_generation_logs.tenant_id
        AND p.role IN ('admin','super_admin')
    )
  );

-- ============================================================
-- updated_at triggers
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'video_generation_jobs',
    'media_assets',
    'ai_generation_tasks'
  ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
      tbl
    );
  END LOOP;
END;
$$;
