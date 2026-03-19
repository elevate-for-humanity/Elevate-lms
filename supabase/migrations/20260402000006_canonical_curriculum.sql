-- Canonical curriculum schema.
-- courses = VIEW over training_courses → replace with real TABLE
-- course_modules = real TABLE (keep, add index)
-- course_lessons = does not exist → create
-- training_courses = legacy archive (keep, not active read path)
-- curriculum_lessons = canonical content source → migrate into course_lessons

DO $$ BEGIN
  CREATE TYPE public.course_status AS ENUM ('draft','published','archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.lesson_type AS ENUM (
    'lesson','quiz','checkpoint','lab','assignment','exam','certification'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP VIEW IF EXISTS public.courses CASCADE;

CREATE TABLE public.courses (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id        UUID        REFERENCES public.programs(id) ON DELETE CASCADE,
  legacy_course_id  UUID,
  slug              TEXT        NOT NULL UNIQUE,
  title             TEXT        NOT NULL,
  short_description TEXT,
  description       TEXT,
  status            public.course_status NOT NULL DEFAULT 'draft',
  is_active         BOOLEAN     NOT NULL DEFAULT true,
  published_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_courses_program_id ON public.courses(program_id);
CREATE INDEX idx_courses_status     ON public.courses(status);
CREATE INDEX idx_courses_legacy_id  ON public.courses(legacy_course_id);

INSERT INTO public.courses (
  legacy_course_id, program_id, slug, title, short_description,
  description, status, is_active, published_at, created_at, updated_at
)
SELECT
  tc.id, p.id, tc.slug, tc.title, tc.summary, tc.description,
  'published'::public.course_status, true, now(), tc.created_at, tc.updated_at
FROM public.training_courses tc
LEFT JOIN public.programs p ON p.slug = tc.slug
WHERE tc.id = 'f0593164-55be-5867-98e7-8a86770a8dd0'
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.course_lessons (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id        UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  module_id        UUID        REFERENCES public.course_modules(id)   ON DELETE SET NULL,
  legacy_lesson_id UUID,
  slug             TEXT        NOT NULL,
  title            TEXT        NOT NULL,
  content          JSONB,
  lesson_type      public.lesson_type NOT NULL DEFAULT 'lesson',
  order_index      INTEGER     NOT NULL,
  passing_score    INTEGER,
  quiz_questions   JSONB,
  is_required      BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, slug),
  UNIQUE(course_id, order_index)
);

CREATE INDEX idx_course_lessons_course_id ON public.course_lessons(course_id);
CREATE INDEX idx_course_lessons_module_id ON public.course_lessons(module_id);

INSERT INTO public.course_lessons (
  course_id, module_id, legacy_lesson_id, slug, title,
  content, lesson_type, order_index, passing_score, quiz_questions, is_required
)
SELECT
  c.id,
  cm.id,
  cl.id,
  cl.lesson_slug,
  cl.lesson_title,
  to_jsonb(cl.script_text),
  CASE cl.step_type
    WHEN 'quiz'          THEN 'quiz'::public.lesson_type
    WHEN 'checkpoint'    THEN 'checkpoint'::public.lesson_type
    WHEN 'lab'           THEN 'lab'::public.lesson_type
    WHEN 'assignment'    THEN 'assignment'::public.lesson_type
    WHEN 'exam'          THEN 'exam'::public.lesson_type
    WHEN 'certification' THEN 'certification'::public.lesson_type
    ELSE 'lesson'::public.lesson_type
  END,
  (cl.module_order * 1000 + cl.lesson_order),
  cl.passing_score,
  cl.quiz_questions,
  true
FROM public.curriculum_lessons cl
JOIN public.courses c ON c.legacy_course_id = 'f0593164-55be-5867-98e7-8a86770a8dd0'
LEFT JOIN public.course_modules cm
  ON cm.course_id = c.id
  AND COALESCE(cm.order_index, cm."order") = cl.module_order
WHERE cl.course_id = 'f0593164-55be-5867-98e7-8a86770a8dd0'
  AND cl.status = 'published'
ON CONFLICT (course_id, slug) DO NOTHING;

CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_actor_user_id UUID, p_entity_type TEXT, p_entity_id UUID,
  p_action TEXT, p_details JSONB DEFAULT '{}'::JSONB
) RETURNS VOID LANGUAGE SQL AS $$
  INSERT INTO public.audit_logs (actor_user_id, entity_type, entity_id, action, details)
  VALUES (p_actor_user_id, p_entity_type, p_entity_id, p_action, COALESCE(p_details,'{}'));
$$;

CREATE OR REPLACE FUNCTION public.course_is_publishable(p_course_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql AS $$
DECLARE v_title TEXT; v_slug TEXT; v_mc INTEGER; v_lc INTEGER;
BEGIN
  SELECT title, slug INTO v_title, v_slug FROM public.courses WHERE id = p_course_id;
  IF v_title IS NULL OR btrim(v_title)='' THEN RETURN false; END IF;
  IF v_slug  IS NULL OR btrim(v_slug) ='' THEN RETURN false; END IF;
  SELECT COUNT(*) INTO v_mc FROM public.course_modules WHERE course_id = p_course_id;
  SELECT COUNT(*) INTO v_lc FROM public.course_lessons  WHERE course_id = p_course_id;
  RETURN v_mc > 0 AND v_lc > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.publish_course(p_course_id UUID)
RETURNS public.courses LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_course        public.courses;
  v_module_count  INTEGER;
  v_null_ct_count INTEGER;
  v_gating_count  INTEGER;
  v_mod           RECORD;
  v_lesson_count  INTEGER;
BEGIN
  -- 1. Basic publishability (title, slug, ≥1 module, ≥1 lesson)
  IF NOT public.course_is_publishable(p_course_id) THEN
    RAISE EXCEPTION 'PUBLISH_BLOCKED: course % needs title, slug, at least one module, and at least one lesson', p_course_id;
  END IF;

  -- 2. Every lesson must have a non-null lesson_type (content_type)
  SELECT COUNT(*) INTO v_null_ct_count
  FROM public.course_lessons
  WHERE course_id = p_course_id
    AND (lesson_type IS NULL);

  IF v_null_ct_count > 0 THEN
    RAISE EXCEPTION 'PUBLISH_BLOCKED: % lesson(s) in course % have NULL lesson_type — fix before publishing',
      v_null_ct_count, p_course_id;
  END IF;

  -- 3. Every module must have at least one lesson
  FOR v_mod IN
    SELECT cm.id, cm.title
    FROM public.course_modules cm
    WHERE cm.course_id = p_course_id
  LOOP
    SELECT COUNT(*) INTO v_lesson_count
    FROM public.course_lessons
    WHERE module_id = v_mod.id;

    IF v_lesson_count = 0 THEN
      RAISE EXCEPTION 'PUBLISH_BLOCKED: module "%" (%) has no lessons', v_mod.title, v_mod.id;
    END IF;
  END LOOP;

  -- 4. Gating rules must exist (at least one per course)
  SELECT COUNT(*) INTO v_gating_count
  FROM public.module_completion_rules
  WHERE course_id = p_course_id;

  SELECT COUNT(*) INTO v_module_count
  FROM public.course_modules
  WHERE course_id = p_course_id;

  -- Only enforce gating rules when there are multiple modules
  IF v_module_count > 1 AND v_gating_count = 0 THEN
    RAISE EXCEPTION 'PUBLISH_BLOCKED: course % has % modules but no module_completion_rules — add gating rules before publishing',
      p_course_id, v_module_count;
  END IF;

  -- All checks passed — publish
  UPDATE public.courses
  SET status = 'published', published_at = now(), updated_at = now()
  WHERE id = p_course_id
  RETURNING * INTO v_course;

  RETURN v_course;
END;
$$;

ALTER TABLE public.courses        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published courses"
  ON public.courses FOR SELECT USING (status='published' AND is_active=true);
CREATE POLICY "Service role courses"
  ON public.courses USING (auth.role()='service_role');
CREATE POLICY "Authenticated read published lessons"
  ON public.course_lessons FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.courses c
            WHERE c.id=course_lessons.course_id AND c.status='published' AND c.is_active=true));
CREATE POLICY "Service role lessons"
  ON public.course_lessons USING (auth.role()='service_role');

GRANT SELECT ON public.courses        TO authenticated, anon;
GRANT ALL    ON public.courses        TO service_role;
GRANT SELECT ON public.course_lessons TO authenticated, anon;
GRANT ALL    ON public.course_lessons TO service_role;
