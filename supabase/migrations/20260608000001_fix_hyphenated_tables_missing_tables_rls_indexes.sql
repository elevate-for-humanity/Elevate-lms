-- =============================================================================
-- Migration: fix hyphenated table names, create missing tables, fill RLS gaps,
--            add missing indexes
-- Apply in: Supabase Dashboard → SQL Editor
-- =============================================================================

-- ── 1. RENAME HYPHENATED TABLES TO UNDERSCORES ───────────────────────────────
-- Only rename if the hyphenated version exists and the underscore version does not.

DO $$
BEGIN
  -- enrollment-documents → enrollment_documents
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='enrollment-documents')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='enrollment_documents') THEN
    ALTER TABLE public."enrollment-documents" RENAME TO enrollment_documents;
  END IF;

  -- credential-uploads → credential_uploads
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='credential-uploads')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='credential_uploads') THEN
    ALTER TABLE public."credential-uploads" RENAME TO credential_uploads;
  END IF;

  -- apprentice-uploads → apprentice_uploads
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='apprentice-uploads')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='apprentice_uploads') THEN
    ALTER TABLE public."apprentice-uploads" RENAME TO apprentice_uploads;
  END IF;

  -- program-holder-documents → program_holder_documents
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='program-holder-documents')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='program_holder_documents') THEN
    ALTER TABLE public."program-holder-documents" RENAME TO program_holder_documents;
  END IF;

  -- partner-documents → partner_documents
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='partner-documents')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='partner_documents') THEN
    ALTER TABLE public."partner-documents" RENAME TO partner_documents;
  END IF;

  -- shop-onboarding → shop_onboarding
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='shop-onboarding')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='shop_onboarding') THEN
    ALTER TABLE public."shop-onboarding" RENAME TO shop_onboarding;
  END IF;

  -- course-content → course_content
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='course-content')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='course_content') THEN
    ALTER TABLE public."course-content" RENAME TO course_content;
  END IF;

  -- audit-archive → audit_archive
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='audit-archive')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='audit_archive') THEN
    ALTER TABLE public."audit-archive" RENAME TO audit_archive;
  END IF;

  -- tax-documents → tax_documents
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='tax-documents')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='tax_documents') THEN
    ALTER TABLE public."tax-documents" RENAME TO tax_documents;
  END IF;

  -- scorm-packages → scorm_packages
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='scorm-packages')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='scorm_packages') THEN
    ALTER TABLE public."scorm-packages" RENAME TO scorm_packages;
  END IF;

  -- course-videos → course_videos
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='course-videos')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='course_videos') THEN
    ALTER TABLE public."course-videos" RENAME TO course_videos;
  END IF;

  -- provider-exports → provider_exports
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='provider-exports')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='provider_exports') THEN
    ALTER TABLE public."provider-exports" RENAME TO provider_exports;
  END IF;

  -- sam-documents → sam_documents
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='sam-documents')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='sam_documents') THEN
    ALTER TABLE public."sam-documents" RENAME TO sam_documents;
  END IF;

  -- module-certificates → module_certificates (already exists as storage bucket — table may not exist)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='module-certificates')
     AND NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname='public' AND tablename='module_certificates') THEN
    ALTER TABLE public."module-certificates" RENAME TO module_certificates;
  END IF;
END $$;

-- ── 2. CREATE MISSING TABLES ─────────────────────────────────────────────────

-- at_risk_students — referenced in /admin/at-risk page
CREATE TABLE IF NOT EXISTS public.at_risk_students (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  enrollment_id     uuid REFERENCES public.program_enrollments(id) ON DELETE SET NULL,
  program_id        uuid REFERENCES public.programs(id) ON DELETE SET NULL,
  risk_level        text NOT NULL DEFAULT 'medium' CHECK (risk_level IN ('low','medium','high','critical')),
  risk_factors      jsonb DEFAULT '[]',
  last_activity_at  timestamptz,
  days_inactive     integer DEFAULT 0,
  progress_percent  numeric(5,2) DEFAULT 0,
  flagged_at        timestamptz DEFAULT now(),
  resolved_at       timestamptz,
  resolved_by       uuid REFERENCES public.profiles(id),
  notes             text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- student_interventions — follow-up actions for at-risk students
CREATE TABLE IF NOT EXISTS public.student_interventions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  at_risk_id      uuid REFERENCES public.at_risk_students(id) ON DELETE SET NULL,
  intervention_type text NOT NULL DEFAULT 'outreach' CHECK (intervention_type IN ('outreach','call','email','meeting','referral','other')),
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed','cancelled')),
  notes           text,
  outcome         text,
  assigned_to     uuid REFERENCES public.profiles(id),
  due_at          timestamptz,
  completed_at    timestamptz,
  created_by      uuid REFERENCES public.profiles(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- enrollment_documents — document uploads during enrollment
CREATE TABLE IF NOT EXISTS public.enrollment_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id   uuid REFERENCES public.program_enrollments(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type   text NOT NULL,
  file_name       text NOT NULL,
  file_path       text NOT NULL,
  file_size       integer,
  mime_type       text,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by     uuid REFERENCES public.profiles(id),
  reviewed_at     timestamptz,
  notes           text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- credential_uploads — certification credential uploads
CREATE TABLE IF NOT EXISTS public.credential_uploads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  certificate_id  uuid REFERENCES public.certificates(id) ON DELETE SET NULL,
  file_name       text NOT NULL,
  file_path       text NOT NULL,
  file_size       integer,
  mime_type       text,
  verified        boolean DEFAULT false,
  verified_by     uuid REFERENCES public.profiles(id),
  verified_at     timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- apprentice_uploads — apprentice hour submission documents
CREATE TABLE IF NOT EXISTS public.apprentice_uploads (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  submission_id   uuid,
  file_name       text NOT NULL,
  file_path       text NOT NULL,
  file_size       integer,
  mime_type       text,
  created_at      timestamptz DEFAULT now()
);

-- program_holder_documents — program holder identity/compliance docs
CREATE TABLE IF NOT EXISTS public.program_holder_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type   text NOT NULL,
  file_name       text NOT NULL,
  file_path       text NOT NULL,
  file_size       integer,
  mime_type       text,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  reviewed_by     uuid REFERENCES public.profiles(id),
  reviewed_at     timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- partner_documents — partner onboarding documents
CREATE TABLE IF NOT EXISTS public.partner_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id      uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type   text NOT NULL,
  file_name       text NOT NULL,
  file_path       text NOT NULL,
  file_size       integer,
  mime_type       text,
  status          text NOT NULL DEFAULT 'pending',
  created_at      timestamptz DEFAULT now()
);

-- shop_onboarding — shop seller onboarding state
CREATE TABLE IF NOT EXISTS public.shop_onboarding (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  step            text NOT NULL DEFAULT 'identity',
  completed_steps jsonb DEFAULT '[]',
  data            jsonb DEFAULT '{}',
  completed_at    timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- course_content — SCORM/xAPI content packages
CREATE TABLE IF NOT EXISTS public.course_content (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  package_type    text NOT NULL DEFAULT 'scorm' CHECK (package_type IN ('scorm','xapi','video','pdf')),
  title           text,
  file_path       text NOT NULL,
  file_size       bigint,
  manifest        jsonb DEFAULT '{}',
  version         text,
  created_by      uuid REFERENCES public.profiles(id),
  created_at      timestamptz DEFAULT now()
);

-- audit_archive — long-term audit log archive
CREATE TABLE IF NOT EXISTS public.audit_archive (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_id     uuid,
  table_name      text NOT NULL,
  action          text NOT NULL,
  actor_id        uuid,
  record_id       uuid,
  old_data        jsonb,
  new_data        jsonb,
  archived_at     timestamptz DEFAULT now()
);

-- tax_documents — tax client document uploads
CREATE TABLE IF NOT EXISTS public.tax_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type   text NOT NULL,
  tax_year        integer,
  file_name       text NOT NULL,
  file_path       text NOT NULL,
  file_size       integer,
  mime_type       text,
  status          text NOT NULL DEFAULT 'pending',
  created_at      timestamptz DEFAULT now()
);

-- scorm_packages — SCORM package registry
CREATE TABLE IF NOT EXISTS public.scorm_packages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id       uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  title           text NOT NULL,
  version         text DEFAULT '1.2',
  file_path       text NOT NULL,
  manifest        jsonb DEFAULT '{}',
  created_by      uuid REFERENCES public.profiles(id),
  created_at      timestamptz DEFAULT now()
);

-- course_videos — video assets attached to lessons
CREATE TABLE IF NOT EXISTS public.course_videos (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id       uuid REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  course_id       uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  title           text,
  video_url       text,
  storage_path    text,
  duration_seconds integer,
  thumbnail_url   text,
  transcript      text,
  generated_by    text DEFAULT 'manual' CHECK (generated_by IN ('manual','did','openai_tts','heygen','synthesia')),
  status          text DEFAULT 'ready' CHECK (status IN ('pending','processing','ready','failed')),
  created_by      uuid REFERENCES public.profiles(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- provider_exports — provider data export jobs
CREATE TABLE IF NOT EXISTS public.provider_exports (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  export_type     text NOT NULL,
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','complete','failed')),
  file_path       text,
  error           text,
  created_at      timestamptz DEFAULT now(),
  completed_at    timestamptz
);

-- sam_documents — SAM.gov registration documents
CREATE TABLE IF NOT EXISTS public.sam_documents (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type   text NOT NULL,
  file_name       text NOT NULL,
  file_path       text NOT NULL,
  uei             text,
  cage_code       text,
  expiry_date     date,
  verified        boolean DEFAULT false,
  created_at      timestamptz DEFAULT now()
);

-- video_generation_jobs — async video generation queue
CREATE TABLE IF NOT EXISTS public.video_generation_jobs (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id       uuid REFERENCES public.course_lessons(id) ON DELETE SET NULL,
  course_id       uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  provider        text NOT NULL DEFAULT 'did' CHECK (provider IN ('did','heygen','synthesia','openai_tts','ffmpeg')),
  status          text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','processing','complete','failed')),
  input           jsonb DEFAULT '{}',
  output_url      text,
  error           text,
  created_by      uuid REFERENCES public.profiles(id),
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

-- generated_images — DALL-E / AI generated images
CREATE TABLE IF NOT EXISTS public.generated_images (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt          text NOT NULL,
  image_url       text,
  storage_path    text,
  attached_to     text,
  attached_id     uuid,
  created_by      uuid REFERENCES public.profiles(id),
  created_at      timestamptz DEFAULT now()
);

-- tts_audio_files — OpenAI TTS generated audio
CREATE TABLE IF NOT EXISTS public.tts_audio_files (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id       uuid REFERENCES public.course_lessons(id) ON DELETE SET NULL,
  text_hash       text,
  voice           text DEFAULT 'onyx',
  storage_path    text NOT NULL,
  duration_seconds numeric(8,2),
  created_at      timestamptz DEFAULT now()
);

-- onboarding_progress — learner onboarding step tracking
CREATE TABLE IF NOT EXISTS public.onboarding_progress (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  step            text NOT NULL,
  completed       boolean DEFAULT false,
  data            jsonb DEFAULT '{}',
  completed_at    timestamptz,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
  UNIQUE(user_id, step)
);

-- ── 3. RLS POLICIES ──────────────────────────────────────────────────────────

ALTER TABLE public.at_risk_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollment_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credential_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apprentice_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.program_holder_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_onboarding ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scorm_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sam_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tts_audio_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "admin_full_access_at_risk_students" ON public.at_risk_students
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));

CREATE POLICY "admin_full_access_student_interventions" ON public.student_interventions
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));

CREATE POLICY "admin_full_access_audit_archive" ON public.audit_archive
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin')));

CREATE POLICY "admin_full_access_video_generation_jobs" ON public.video_generation_jobs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));

CREATE POLICY "admin_full_access_generated_images" ON public.generated_images
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));

-- Users own their own rows
CREATE POLICY "users_own_enrollment_documents" ON public.enrollment_documents
  FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users_own_credential_uploads" ON public.credential_uploads
  FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users_own_apprentice_uploads" ON public.apprentice_uploads
  FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users_own_program_holder_documents" ON public.program_holder_documents
  FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users_own_partner_documents" ON public.partner_documents
  FOR ALL TO authenticated USING (partner_id = auth.uid());

CREATE POLICY "users_own_shop_onboarding" ON public.shop_onboarding
  FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users_own_tax_documents" ON public.tax_documents
  FOR ALL TO authenticated USING (client_id = auth.uid());

CREATE POLICY "users_own_sam_documents" ON public.sam_documents
  FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users_own_onboarding_progress" ON public.onboarding_progress
  FOR ALL TO authenticated USING (user_id = auth.uid());

CREATE POLICY "users_own_provider_exports" ON public.provider_exports
  FOR ALL TO authenticated USING (provider_id = auth.uid());

CREATE POLICY "users_own_tts_audio_files" ON public.tts_audio_files
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));

-- Course content readable by enrolled users
CREATE POLICY "enrolled_users_read_course_content" ON public.course_content
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_manage_course_content" ON public.course_content
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));

CREATE POLICY "enrolled_users_read_course_videos" ON public.course_videos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_manage_course_videos" ON public.course_videos
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));

CREATE POLICY "enrolled_users_read_scorm_packages" ON public.scorm_packages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin_manage_scorm_packages" ON public.scorm_packages
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));

-- Admin read access on user-owned tables
CREATE POLICY "admin_read_enrollment_documents" ON public.enrollment_documents
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));

CREATE POLICY "admin_read_credential_uploads" ON public.credential_uploads
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));

CREATE POLICY "admin_read_tax_documents" ON public.tax_documents
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')));

-- ── 4. INDEXES ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_at_risk_students_user_id ON public.at_risk_students(user_id);
CREATE INDEX IF NOT EXISTS idx_at_risk_students_risk_level ON public.at_risk_students(risk_level);
CREATE INDEX IF NOT EXISTS idx_at_risk_students_resolved_at ON public.at_risk_students(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_student_interventions_user_id ON public.student_interventions(user_id);
CREATE INDEX IF NOT EXISTS idx_student_interventions_status ON public.student_interventions(status);
CREATE INDEX IF NOT EXISTS idx_enrollment_documents_user_id ON public.enrollment_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_documents_enrollment_id ON public.enrollment_documents(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_progress_user_id ON public.onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_video_generation_jobs_status ON public.video_generation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_video_generation_jobs_lesson_id ON public.video_generation_jobs(lesson_id);
CREATE INDEX IF NOT EXISTS idx_course_videos_lesson_id ON public.course_videos(lesson_id);
CREATE INDEX IF NOT EXISTS idx_course_videos_course_id ON public.course_videos(course_id);
CREATE INDEX IF NOT EXISTS idx_tts_audio_files_lesson_id ON public.tts_audio_files(lesson_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_attached_id ON public.generated_images(attached_id);

-- Existing table indexes that may be missing
CREATE INDEX IF NOT EXISTS idx_program_enrollments_user_id ON public.program_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_program_id ON public.program_enrollments(program_id);
CREATE INDEX IF NOT EXISTS idx_program_enrollments_status ON public.program_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON public.applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_email ON public.applications(email);
CREATE INDEX IF NOT EXISTS idx_course_lessons_course_id ON public.course_lessons(course_id);
CREATE INDEX IF NOT EXISTS idx_course_lessons_module_id ON public.course_lessons(module_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_id ON public.lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_lesson_id ON public.lesson_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON public.certificates(user_id);
