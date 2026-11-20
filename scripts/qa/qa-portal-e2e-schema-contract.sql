-- Isolated QA contract for the authenticated portal browser suite.
-- This migration is intentionally QA-only. It creates no production learner,
-- credit, enrollment, customer-site, or publication records.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.tenants WHERE slug = 'elevate-lms-qa') THEN
    RAISE EXCEPTION 'ISOLATED_QA_TENANT_REQUIRED';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.programs WHERE slug = 'hvac-technician') THEN
    RAISE EXCEPTION 'ISOLATED_QA_HVAC_PROGRAM_REQUIRED';
  END IF;
END $;

CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC,anon;
GRANT USAGE ON SCHEMA private TO authenticated,service_role;

CREATE TABLE IF NOT EXISTS public.employer_onboarding (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id uuid NOT NULL REFERENCES public.employers(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'onboarding_in_progress',
  hiring_needs jsonb NOT NULL DEFAULT '{}'::jsonb,
  documents jsonb NOT NULL DEFAULT '{}'::jsonb,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS employer_onboarding_employer_idx
  ON public.employer_onboarding(employer_id, created_at DESC);
ALTER TABLE public.employer_onboarding ENABLE ROW LEVEL SECURITY;
CREATE POLICY qa_employer_onboarding_service ON public.employer_onboarding
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY qa_employer_onboarding_owner_read ON public.employer_onboarding
  FOR SELECT TO authenticated USING (EXISTS (
    SELECT 1 FROM public.employers e
    WHERE e.id = employer_id AND e.owner_user_id = auth.uid()
  ));
GRANT SELECT ON public.employer_onboarding TO authenticated;
GRANT ALL ON public.employer_onboarding TO service_role;

CREATE TABLE IF NOT EXISTS public.employer_onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  employer_id uuid REFERENCES public.employers(id) ON DELETE CASCADE,
  orientation_viewed boolean NOT NULL DEFAULT false,
  orientation_viewed_at timestamptz,
  step text NOT NULL DEFAULT 'orientation',
  status text NOT NULL DEFAULT 'in_progress',
  completed_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.employer_onboarding_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY qa_employer_progress_service ON public.employer_onboarding_progress
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY qa_employer_progress_owner ON public.employer_onboarding_progress
  FOR SELECT TO authenticated USING (user_id = auth.uid());
GRANT SELECT ON public.employer_onboarding_progress TO authenticated;
GRANT ALL ON public.employer_onboarding_progress TO service_role;

CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_type text,
  owner_id uuid,
  file_name text NOT NULL,
  file_path text,
  storage_path text,
  file_url text,
  mime_type text,
  document_type text,
  status text NOT NULL DEFAULT 'pending',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY qa_documents_service ON public.documents
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY qa_documents_owner_read ON public.documents
  FOR SELECT TO authenticated USING (user_id = auth.uid());
GRANT SELECT ON public.documents TO authenticated;
GRANT ALL ON public.documents TO service_role;
INSERT INTO storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
VALUES ('documents', 'documents', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;
CREATE POLICY qa_documents_storage_owner_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE TABLE IF NOT EXISTS public.program_holder_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_holder_id uuid NOT NULL REFERENCES public.program_holders(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  program_slug text,
  role_in_program text NOT NULL DEFAULT 'owner',
  is_primary boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(program_holder_id, program_id)
);
ALTER TABLE public.program_holder_programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY qa_program_holder_programs_service ON public.program_holder_programs
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY qa_program_holder_programs_owner_read ON public.program_holder_programs
  FOR SELECT TO authenticated USING (
    program_holder_id = (SELECT p.program_holder_id FROM public.profiles p WHERE p.id = auth.uid())
  );
GRANT SELECT ON public.program_holder_programs TO authenticated;
GRANT ALL ON public.program_holder_programs TO service_role;

CREATE TABLE IF NOT EXISTS public.case_managers (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  agency text NOT NULL,
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.case_managers ENABLE ROW LEVEL SECURITY;
CREATE POLICY qa_case_managers_service ON public.case_managers
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY qa_case_managers_self_read ON public.case_managers
  FOR SELECT TO authenticated USING (id = auth.uid());
GRANT SELECT ON public.case_managers TO authenticated;
GRANT ALL ON public.case_managers TO service_role;

CREATE TABLE IF NOT EXISTS public.case_manager_assignments (
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  case_manager_id uuid NOT NULL REFERENCES public.case_managers(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY(application_id, case_manager_id)
);
ALTER TABLE public.case_manager_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY qa_case_manager_assignments_service ON public.case_manager_assignments
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY qa_case_manager_assignments_self_read ON public.case_manager_assignments
  FOR SELECT TO authenticated USING (case_manager_id = auth.uid());
GRANT SELECT ON public.case_manager_assignments TO authenticated;
GRANT ALL ON public.case_manager_assignments TO service_role;

CREATE TABLE IF NOT EXISTS public.course_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id uuid,
  title text NOT NULL,
  slug text NOT NULL,
  content text,
  content_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  rendered_html text,
  video_url text,
  video_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  duration_minutes integer NOT NULL DEFAULT 0,
  lesson_type text NOT NULL DEFAULT 'lesson',
  learning_objectives jsonb NOT NULL DEFAULT '[]'::jsonb,
  quiz_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  key_terms jsonb NOT NULL DEFAULT '[]'::jsonb,
  passing_score integer NOT NULL DEFAULT 80,
  is_published boolean NOT NULL DEFAULT false,
  is_required boolean NOT NULL DEFAULT true,
  order_index integer NOT NULL DEFAULT 1,
  resources jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(course_id, slug)
);

CREATE OR REPLACE FUNCTION private.can_access_course_lesson(p_course_id uuid, p_lesson_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.course_lessons l
      WHERE l.id = p_lesson_id AND l.course_id = p_course_id AND l.is_published
    )
    AND EXISTS (
      SELECT 1 FROM public.program_enrollments pe
      JOIN public.courses c ON c.id = p_course_id
      WHERE COALESCE(pe.user_id, pe.student_id) = auth.uid()
        AND (pe.course_id = p_course_id OR pe.program_id = c.program_id)
        AND pe.revoked_at IS NULL
        AND lower(COALESCE(pe.status, 'active')) IN ('active','enrolled','in_progress','completed','confirmed')
    );
$function$;
REVOKE ALL ON FUNCTION private.can_access_course_lesson(uuid,uuid) FROM PUBLIC,anon;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_access_course_lesson(uuid,uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.can_access_lesson(p_user_id uuid, p_lesson_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.course_lessons l
    JOIN public.courses c ON c.id = l.course_id
    JOIN public.program_enrollments pe
      ON (pe.course_id = l.course_id OR pe.program_id = c.program_id)
    WHERE l.id = p_lesson_id
      AND l.is_published
      AND COALESCE(pe.user_id, pe.student_id) = p_user_id
      AND pe.revoked_at IS NULL
      AND lower(COALESCE(pe.status, 'active')) IN ('active','enrolled','in_progress','completed','confirmed')
  );
$function$;
REVOKE ALL ON FUNCTION public.can_access_lesson(uuid,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_lesson(uuid,uuid) TO service_role;

ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY qa_course_lessons_service ON public.course_lessons
  FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY qa_course_lessons_enrolled_read ON public.course_lessons
  FOR SELECT TO authenticated USING (
    is_published AND private.can_access_course_lesson(course_id, id)
  );
GRANT SELECT ON public.course_lessons TO authenticated;
GRANT ALL ON public.course_lessons TO service_role;

CREATE TABLE IF NOT EXISTS public.lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY qa_lesson_progress_service ON public.lesson_progress FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY qa_lesson_progress_owner ON public.lesson_progress FOR SELECT TO authenticated USING (user_id = auth.uid());
GRANT SELECT ON public.lesson_progress TO authenticated;
GRANT ALL ON public.lesson_progress TO service_role;

CREATE TABLE IF NOT EXISTS public.checkpoint_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  score numeric NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.checkpoint_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY qa_checkpoint_scores_service ON public.checkpoint_scores FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY qa_checkpoint_scores_owner ON public.checkpoint_scores FOR SELECT TO authenticated USING (user_id = auth.uid());
GRANT SELECT ON public.checkpoint_scores TO authenticated;
GRANT ALL ON public.checkpoint_scores TO service_role;

CREATE TABLE IF NOT EXISTS public.learner_video_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  body text NOT NULL,
  position_seconds numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.learner_video_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  progress_percent integer NOT NULL DEFAULT 0 CHECK(progress_percent BETWEEN 0 AND 100),
  last_position_seconds numeric NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
CREATE TABLE IF NOT EXISTS public.interactive_video_quiz_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  timestamp_sec numeric NOT NULL,
  selected_answer integer,
  is_correct boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id, timestamp_sec)
);
CREATE TABLE IF NOT EXISTS public.learner_video_checkpoint_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  checkpoint_key text NOT NULL,
  response text,
  selected_choice integer,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id, checkpoint_key)
);
ALTER TABLE public.learner_video_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interactive_video_quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_video_checkpoint_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY qa_video_notes_service ON public.learner_video_notes FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY qa_video_notes_owner ON public.learner_video_notes FOR ALL TO authenticated USING (user_id=auth.uid() AND private.can_access_course_lesson(course_id,lesson_id)) WITH CHECK (user_id=auth.uid() AND private.can_access_course_lesson(course_id,lesson_id));
CREATE POLICY qa_video_progress_service ON public.learner_video_progress FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY qa_video_progress_owner ON public.learner_video_progress FOR ALL TO authenticated USING (user_id=auth.uid() AND private.can_access_course_lesson(course_id,lesson_id)) WITH CHECK (user_id=auth.uid() AND private.can_access_course_lesson(course_id,lesson_id));
CREATE POLICY qa_quiz_answers_service ON public.interactive_video_quiz_answers FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY qa_quiz_answers_owner ON public.interactive_video_quiz_answers FOR ALL TO authenticated USING (user_id=auth.uid() AND private.can_access_course_lesson(course_id,lesson_id)) WITH CHECK (user_id=auth.uid() AND private.can_access_course_lesson(course_id,lesson_id));
CREATE POLICY qa_checkpoint_responses_service ON public.learner_video_checkpoint_responses FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY qa_checkpoint_responses_owner ON public.learner_video_checkpoint_responses FOR ALL TO authenticated USING (user_id=auth.uid() AND private.can_access_course_lesson(course_id,lesson_id)) WITH CHECK (user_id=auth.uid() AND private.can_access_course_lesson(course_id,lesson_id));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.learner_video_notes TO authenticated;
GRANT SELECT,INSERT,UPDATE ON public.learner_video_progress TO authenticated;
GRANT SELECT,INSERT,UPDATE ON public.interactive_video_quiz_answers TO authenticated;
GRANT SELECT,INSERT,UPDATE ON public.learner_video_checkpoint_responses TO authenticated;
GRANT ALL ON public.learner_video_notes, public.learner_video_progress, public.interactive_video_quiz_answers, public.learner_video_checkpoint_responses TO service_role;

CREATE TABLE IF NOT EXISTS public.video_playback_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  action text,
  event_type text,
  video_id text,
  page_slug text,
  current_time numeric,
  duration numeric,
  error_message text,
  session_id text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.video_playback_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY qa_video_playback_service ON public.video_playback_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT ALL ON public.video_playback_events TO service_role;

CREATE TABLE IF NOT EXISTS public.digital_workbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  program_id uuid REFERENCES public.programs(id) ON DELETE CASCADE,
  cover_image text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.digital_workbook_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workbook_id uuid NOT NULL REFERENCES public.digital_workbooks(id) ON DELETE CASCADE,
  section_number integer NOT NULL,
  title text NOT NULL,
  unit text,
  pdf_page integer,
  prompts jsonb NOT NULL DEFAULT '[]'::jsonb,
  lesson_id uuid REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  UNIQUE(workbook_id, section_number)
);
CREATE TABLE IF NOT EXISTS public.digital_workbook_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  section_id uuid NOT NULL REFERENCES public.digital_workbook_sections(id) ON DELETE CASCADE,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  reviewed boolean NOT NULL DEFAULT false,
  version integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, section_id)
);
ALTER TABLE public.digital_workbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_workbook_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_workbook_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY qa_workbooks_service ON public.digital_workbooks FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY qa_workbooks_enrolled_read ON public.digital_workbooks FOR SELECT TO authenticated USING (EXISTS (
  SELECT 1 FROM public.program_enrollments pe
  WHERE COALESCE(pe.user_id,pe.student_id)=auth.uid() AND pe.program_id=digital_workbooks.program_id
    AND pe.revoked_at IS NULL AND lower(COALESCE(pe.status,'active')) IN ('active','enrolled','in_progress','completed','confirmed')
));
CREATE POLICY qa_workbook_sections_service ON public.digital_workbook_sections FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY qa_workbook_sections_enrolled_read ON public.digital_workbook_sections FOR SELECT TO authenticated USING (EXISTS (
  SELECT 1 FROM public.digital_workbooks w
  JOIN public.program_enrollments pe ON pe.program_id=w.program_id
  WHERE w.id=workbook_id
    AND COALESCE(pe.user_id,pe.student_id)=auth.uid()
    AND pe.revoked_at IS NULL
    AND lower(COALESCE(pe.status,'active')) IN ('active','enrolled','in_progress','completed','confirmed')
));
CREATE POLICY qa_workbook_responses_service ON public.digital_workbook_responses FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY qa_workbook_responses_owner ON public.digital_workbook_responses FOR ALL TO authenticated
  USING (user_id=auth.uid())
  WITH CHECK (
    user_id=auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.digital_workbook_sections s
      JOIN public.digital_workbooks w ON w.id=s.workbook_id
      JOIN public.program_enrollments pe ON pe.program_id=w.program_id
      WHERE s.id=section_id
        AND COALESCE(pe.user_id,pe.student_id)=auth.uid()
        AND pe.revoked_at IS NULL
        AND lower(COALESCE(pe.status,'active')) IN ('active','enrolled','in_progress','completed','confirmed')
    )
  );
GRANT SELECT ON public.digital_workbooks, public.digital_workbook_sections TO authenticated;
GRANT SELECT,INSERT,UPDATE ON public.digital_workbook_responses TO authenticated;
GRANT ALL ON public.digital_workbooks, public.digital_workbook_sections, public.digital_workbook_responses TO service_role;

CREATE OR REPLACE FUNCTION public.can_edit_digital_workbook(p_workbook_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=''
AS $function$
  SELECT auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.digital_workbooks w
    JOIN public.program_enrollments pe ON pe.program_id=w.program_id
    WHERE w.id=p_workbook_id AND COALESCE(pe.user_id,pe.student_id)=auth.uid()
      AND pe.revoked_at IS NULL
      AND lower(COALESCE(pe.status,'active')) IN ('active','enrolled','in_progress','completed','confirmed')
  );
$function$;
REVOKE ALL ON FUNCTION public.can_edit_digital_workbook(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.can_edit_digital_workbook(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_course_pacing(p_course_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=''
AS $function$
DECLARE actor uuid:=auth.uid();
BEGIN
  IF actor IS NULL THEN RAISE EXCEPTION 'AUTHENTICATION_REQUIRED' USING ERRCODE='42501'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM public.program_enrollments pe
    JOIN public.courses c ON c.id=p_course_id
    WHERE COALESCE(pe.user_id,pe.student_id)=actor
      AND (pe.course_id=p_course_id OR pe.program_id=c.program_id)
      AND pe.revoked_at IS NULL
      AND lower(COALESCE(pe.status,'active')) IN ('active','enrolled','in_progress','completed','confirmed')
  ) THEN RAISE EXCEPTION 'COURSE_ENROLLMENT_REQUIRED' USING ERRCODE='42501'; END IF;
  RETURN jsonb_build_object(
    'totalWeeks',1,
    'startAt',now(),
    'progressive',false,
    'theoryWindow',jsonb_build_object('allowed',true,'reason','QA_ISOLATED_ALWAYS_OPEN'),
    'lessons',(SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'id',l.id,'module_id',l.module_id,'title',l.title,'order_index',l.order_index,
      'lesson_type',l.lesson_type,'duration_minutes',l.duration_minutes,
      'published',l.is_published,'releaseWeek',1,'opensAt',now(),'available',l.is_published
    ) ORDER BY l.order_index),'[]'::jsonb) FROM public.course_lessons l WHERE l.course_id=p_course_id)
  );
END; $function$;
REVOKE ALL ON FUNCTION public.get_my_course_pacing(uuid) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_my_course_pacing(uuid) TO authenticated;

INSERT INTO public.courses(
  id,program_id,slug,title,course_name,short_description,description,status,is_active,published_at,
  generation_status,generation_progress,review_status,category,duration_hours,total_lessons
)
SELECT
  'd48c61c4-8880-4d9d-9ab5-fab4dd51b201',p.id,'epa608-replacement-20261019',
  'EPA 608 Refrigeration — Core, Types I, II & III',
  'EPA 608 Refrigeration — Core, Types I, II & III',
  'Isolated QA playback course.','Disposable browser acceptance metadata only.',
  'published'::public.course_status,true,now(),'published',100,'approved','HVAC',4,1
FROM public.programs p WHERE p.slug='hvac-technician'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.course_lessons(
  id,course_id,title,slug,content,content_json,rendered_html,video_url,video_config,
  duration_minutes,lesson_type,learning_objectives,quiz_questions,key_terms,
  passing_score,is_published,is_required,order_index,resources,status
) VALUES (
  'f1d32b7f-7cd4-44c4-9858-6b756ef21b89',
  'd48c61c4-8880-4d9d-9ab5-fab4dd51b201',
  'Orientation, Training Expectations and Careers',
  'hvac-consolidated-v1-1',
  '<h2>EPA 608 orientation</h2><p>Review the training sequence and safe study expectations.</p>',
  '{}'::jsonb,
  '<h2>EPA 608 orientation</h2><p>Review the training sequence and safe study expectations.</p>',
  'https://s3.us-east-005.backblazeb2.com/elevate-course-media/course-videos/manual-lessons/d48c61c4-8880-4d9d-9ab5-fab4dd51b201/f1d32b7f-7cd4-44c4-9858-6b756ef21b89/reviewed-a3f0e4f8faf8717c83c64741b63d3f2799cb173e6a56131d7bc2f241e41c139f/completed-lesson-manual.mp4',
  '{}'::jsonb,4,'lesson','[]'::jsonb,'[]'::jsonb,'[]'::jsonb,80,true,true,1,'[]'::jsonb,'published'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.digital_workbooks(id,slug,title,program_id,is_active)
SELECT '73c75d0c-5f03-4bc6-8fb2-e6bb8bb10f31','hvac-epa608-guided-practice',
       'EPA 608 Guided Practice Workbook',p.id,true
FROM public.programs p WHERE p.slug='hvac-technician'
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.digital_workbook_sections(
  id,workbook_id,section_number,title,unit,pdf_page,prompts,lesson_id
) VALUES (
  '779f10df-ad80-404e-9557-b9dc3e66307e','73c75d0c-5f03-4bc6-8fb2-e6bb8bb10f31',1,
  'Build an evidence-based learning plan','Orientation',1,
  '["Record your training sequence.","List questions for your instructor."]'::jsonb,
  'f1d32b7f-7cd4-44c4-9858-6b756ef21b89'
) ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.courses c
    JOIN public.course_lessons l ON l.course_id=c.id
    WHERE c.id='d48c61c4-8880-4d9d-9ab5-fab4dd51b201'
      AND c.program_id=(SELECT id FROM public.programs WHERE slug='hvac-technician')
      AND c.is_active AND c.status='published'::public.course_status
      AND l.id='f1d32b7f-7cd4-44c4-9858-6b756ef21b89'
      AND l.is_published AND l.status='published'
  ) THEN RAISE EXCEPTION 'QA_HVAC_PLAYBACK_CONTRACT_NOT_INSTALLED'; END IF;
END $$;
