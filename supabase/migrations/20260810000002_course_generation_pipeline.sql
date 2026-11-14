-- Migration: Create Course Generation Pipeline tables
-- Purpose: Async AI course generation with Supabase storage + Cloudflare R2 for media

CREATE TABLE IF NOT EXISTS course_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id),
  title VARCHAR(500) NOT NULL,
  occupation VARCHAR(255),
  soc_code VARCHAR(20),
  credential_type VARCHAR(100),
  target_hours INTEGER,
  delivery_mode VARCHAR(50) DEFAULT 'online', -- 'online', 'hybrid', 'in-person'
  target_audience TEXT,
  status VARCHAR(50) DEFAULT 'queued', -- 'queued', 'planning', 'generating', 'saving', 'reviewing', 'published', 'failed'
  progress_percent INTEGER DEFAULT 0,
  current_step VARCHAR(100),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  settings JSONB DEFAULT '{}', -- AI model settings, auto-publish preference
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generated_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES course_generation_jobs(id) ON DELETE SET NULL,
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  subtitle VARCHAR(1000),
  description TEXT,
  occupation VARCHAR(255),
  soc_code VARCHAR(20),
  credential_type VARCHAR(100),
  target_hours INTEGER,
  delivery_mode VARCHAR(50),
  target_audience TEXT,
  category VARCHAR(100),
  difficulty_level VARCHAR(50) DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced'
  language VARCHAR(20) DEFAULT 'en',
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'review', 'approved', 'published', 'archived'
  thumbnail_url VARCHAR(1000),
  banner_url VARCHAR(1000),
  version VARCHAR(50) DEFAULT '1.0',
  estimated_duration VARCHAR(100),
  passing_score INTEGER DEFAULT 70,
  completion_rule VARCHAR(50) DEFAULT 'all_lessons', -- 'all_lessons', 'required_lessons', 'minimum_score'
  total_modules INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  total_quizzes INTEGER DEFAULT 0,
  total_hours DECIMAL(5,2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  reviewed_by UUID REFERENCES auth.users(id),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generated_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES generated_courses(id) ON DELETE CASCADE,
  job_id UUID REFERENCES course_generation_jobs(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  objectives JSONB DEFAULT '[]',
  estimated_hours DECIMAL(5,2) DEFAULT 0,
  is_required BOOLEAN DEFAULT true,
  unlock_after_days INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generated_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES generated_modules(id) ON DELETE CASCADE,
  course_id UUID REFERENCES generated_courses(id) ON DELETE CASCADE,
  job_id UUID REFERENCES course_generation_jobs(id) ON DELETE SET NULL,
  lesson_number INTEGER NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  content_type VARCHAR(50) DEFAULT 'reading', -- 'video', 'reading', 'quiz', 'assignment', 'activity', 'lab'
  content TEXT, -- HTML/Markdown content
  summary TEXT,
  objectives JSONB DEFAULT '[]',
  reflection_prompt TEXT,
  duration_minutes INTEGER DEFAULT 30,
  is_required BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generated_quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES generated_lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES generated_courses(id) ON DELETE CASCADE,
  job_id UUID REFERENCES course_generation_jobs(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  max_attempts INTEGER DEFAULT 3,
  shuffle_questions BOOLEAN DEFAULT false,
  show_correct_answers BOOLEAN DEFAULT true,
  questions JSONB DEFAULT '[]', -- Array of question objects
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generated_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES generated_lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES generated_courses(id) ON DELETE CASCADE,
  job_id UUID REFERENCES course_generation_jobs(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  instructions TEXT,
  rubric TEXT,
  submission_type VARCHAR(50) DEFAULT 'file_upload', -- 'file_upload', 'text', 'url', 'quiz'
  max_file_size_mb INTEGER DEFAULT 10,
  allowed_file_types JSONB DEFAULT '["pdf", "doc", "docx", "jpg", "png"]',
  due_days_after_start INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS generated_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES generated_courses(id) ON DELETE CASCADE,
  module_id UUID REFERENCES generated_modules(id) ON DELETE SET NULL,
  lesson_id UUID REFERENCES generated_lessons(id) ON DELETE SET NULL,
  job_id UUID REFERENCES course_generation_jobs(id) ON DELETE SET NULL,
  title VARCHAR(500) NOT NULL,
  resource_type VARCHAR(50) NOT NULL, -- 'pdf', 'worksheet', 'template', 'scorm', 'video', 'link', 'other'
  description TEXT,
  content_url VARCHAR(1000), -- R2 URL for files
  content_text TEXT, -- For links, embedded content
  file_size_bytes INTEGER,
  mime_type VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES generated_courses(id) ON DELETE CASCADE,
  job_id UUID REFERENCES course_generation_jobs(id) ON DELETE SET NULL,
  asset_type VARCHAR(50) NOT NULL, -- 'video', 'audio', 'image', 'document', 'scorm', 'other'
  filename VARCHAR(500) NOT NULL,
  original_filename VARCHAR(500),
  storage_key VARCHAR(1000) NOT NULL, -- R2 storage key
  public_url VARCHAR(1000), -- R2 public URL
  private_url VARCHAR(1000), -- R2 signed URL (for limited access)
  file_size_bytes INTEGER,
  mime_type VARCHAR(100),
  duration_seconds INTEGER, -- For video/audio
  thumbnail_url VARCHAR(1000),
  status VARCHAR(50) DEFAULT 'uploading', -- 'uploading', 'processing', 'ready', 'failed'
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS course_publish_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES generated_courses(id) ON DELETE CASCADE,
  job_id UUID REFERENCES course_generation_jobs(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL, -- 'created', 'draft_saved', 'submitted_review', 'approved', 'published', 'unpublished', 'archived'
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  notes TEXT,
  changed_by UUID REFERENCES auth.users(id),
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_course_jobs_status ON course_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_course_jobs_tenant ON course_generation_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_generated_courses_status ON generated_courses(status);
CREATE INDEX IF NOT EXISTS idx_generated_courses_tenant ON generated_courses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_generated_modules_course ON generated_modules(course_id);
CREATE INDEX IF NOT EXISTS idx_generated_lessons_module ON generated_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_generated_lessons_course ON generated_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_generated_quizzes_lesson ON generated_quizzes(lesson_id);
CREATE INDEX IF NOT EXISTS idx_course_media_course ON course_media_assets(course_id);
CREATE INDEX IF NOT EXISTS idx_course_publish_course ON course_publish_logs(course_id);

-- Row Level Security
ALTER TABLE course_generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE generated_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_publish_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY course_jobs_tenant ON course_generation_jobs FOR ALL 
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY generated_courses_tenant ON generated_courses FOR ALL 
  USING (tenant_id = current_setting('app.tenant_id')::UUID);
CREATE POLICY generated_modules_tenant ON generated_modules FOR ALL 
  USING (module_id IN (SELECT id FROM generated_courses WHERE tenant_id = current_setting('app.tenant_id')::UUID));
CREATE POLICY generated_lessons_tenant ON generated_lessons FOR ALL 
  USING (course_id IN (SELECT id FROM generated_courses WHERE tenant_id = current_setting('app.tenant_id')::UUID));
CREATE POLICY generated_quizzes_tenant ON generated_quizzes FOR ALL 
  USING (course_id IN (SELECT id FROM generated_courses WHERE tenant_id = current_setting('app.tenant_id')::UUID));
CREATE POLICY generated_assignments_tenant ON generated_assignments FOR ALL 
  USING (course_id IN (SELECT id FROM generated_courses WHERE tenant_id = current_setting('app.tenant_id')::UUID));
CREATE POLICY generated_resources_tenant ON generated_resources FOR ALL 
  USING (course_id IN (SELECT id FROM generated_courses WHERE tenant_id = current_setting('app.tenant_id')::UUID));
CREATE POLICY course_media_tenant ON course_media_assets FOR ALL 
  USING (course_id IN (SELECT id FROM generated_courses WHERE tenant_id = current_setting('app.tenant_id')::UUID));
CREATE POLICY course_publish_tenant ON course_publish_logs FOR ALL 
  USING (course_id IN (SELECT id FROM generated_courses WHERE tenant_id = current_setting('app.tenant_id')::UUID));

COMMENT ON TABLE course_generation_jobs IS 'AI course generation job queue and tracking';
COMMENT ON TABLE generated_courses IS 'AI-generated course metadata';
COMMENT ON TABLE generated_modules IS 'Course modules/lessons structure';
COMMENT ON TABLE generated_lessons IS 'Individual lesson content';
COMMENT ON TABLE generated_quizzes IS 'Quiz questions and settings';
COMMENT ON TABLE generated_assignments IS 'Assignment instructions and rubrics';
COMMENT ON TABLE generated_resources IS 'Course resources (PDFs, worksheets, etc.)';
COMMENT ON TABLE course_media_assets IS 'Media files stored in Cloudflare R2';
COMMENT ON TABLE course_publish_logs IS 'Audit log for course publishing actions';