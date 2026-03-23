-- Migration: practical requirements, evidence capture, skill signoffs
--
-- Adds the operational tables that make hands-on training enforceable.
-- Without these, labs/practicum/clinical are narrative-only.
--
-- Tables added:
--   practical_requirements     — per-lesson practical config (hours, attempts, rubric)
--   student_lesson_evidence    — learner evidence submissions (text/file/media/url)
--   student_skill_signoffs     — evaluator skill sign-off records
--   student_practical_progress — accumulated hours/attempts per learner per lesson
--   course_publish_audits      — machine-readable publish audit results
--
-- Apply in Supabase Dashboard → SQL Editor after 20260503000017.

-- ── 1. practical_requirements ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.practical_requirements (
  id                          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id                   UUID        NOT NULL UNIQUE REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  practical_type              TEXT        NOT NULL
    CHECK (practical_type IN ('lab','simulation','practicum','externship','clinical','observation','capstone')),
  required_hours              NUMERIC     NOT NULL DEFAULT 0 CHECK (required_hours >= 0),
  required_attempts           INTEGER     NOT NULL DEFAULT 0 CHECK (required_attempts >= 0),
  requires_evaluator_approval BOOLEAN     NOT NULL DEFAULT false,
  requires_skill_signoff      BOOLEAN     NOT NULL DEFAULT false,
  allowed_submission_modes    TEXT[]      NOT NULL DEFAULT '{}',
  instructions                TEXT        NOT NULL DEFAULT '',
  rubric_json                 JSONB       NOT NULL DEFAULT '[]'::jsonb,
  safety_guidance             TEXT        NOT NULL DEFAULT '',
  materials_needed            TEXT[]      NOT NULL DEFAULT '{}',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_practical_requirements_lesson_id
  ON public.practical_requirements(lesson_id);

-- ── 2. student_lesson_evidence ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.student_lesson_evidence (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id       UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id       UUID        NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  submission_mode TEXT        NOT NULL
    CHECK (submission_mode IN ('text','file','image','video','audio','url')),
  body_text       TEXT,
  file_url        TEXT,
  media_url       TEXT,
  external_url    TEXT,
  status          TEXT        NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted','under_review','approved','rejected','revision_requested')),
  evaluator_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  evaluator_notes TEXT,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at     TIMESTAMPTZ,
  attempt_number  INTEGER     NOT NULL DEFAULT 1
);

CREATE INDEX IF NOT EXISTS idx_student_evidence_user_lesson
  ON public.student_lesson_evidence(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_student_evidence_course_id
  ON public.student_lesson_evidence(course_id);
CREATE INDEX IF NOT EXISTS idx_student_evidence_status
  ON public.student_lesson_evidence(status);

-- ── 3. student_skill_signoffs ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.student_skill_signoffs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id     UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id     UUID        NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  skill_code    TEXT        NOT NULL,
  evaluator_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  status        TEXT        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  notes         TEXT        NOT NULL DEFAULT '',
  signed_off_at TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id, skill_code)
);

CREATE INDEX IF NOT EXISTS idx_skill_signoffs_user_lesson
  ON public.student_skill_signoffs(user_id, lesson_id);
CREATE INDEX IF NOT EXISTS idx_skill_signoffs_evaluator
  ON public.student_skill_signoffs(evaluator_id);

-- ── 4. student_practical_progress ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.student_practical_progress (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id         UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id         UUID        NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  accumulated_hours NUMERIC     NOT NULL DEFAULT 0 CHECK (accumulated_hours >= 0),
  approved_attempts INTEGER     NOT NULL DEFAULT 0 CHECK (approved_attempts >= 0),
  status            TEXT        NOT NULL DEFAULT 'not_started'
    CHECK (status IN ('not_started','in_progress','completed')),
  last_updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_practical_progress_user_course
  ON public.student_practical_progress(user_id, course_id);

-- ── 5. course_publish_audits ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.course_publish_audits (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id    UUID        NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  publishable  BOOLEAN     NOT NULL,
  issues_json  JSONB       NOT NULL DEFAULT '[]'::jsonb,
  audited_by   UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_publish_audits_course_id
  ON public.course_publish_audits(course_id);
CREATE INDEX IF NOT EXISTS idx_course_publish_audits_created_at
  ON public.course_publish_audits(created_at DESC);

-- ── 6. DB function: check practical completion for a learner ─────────────────

CREATE OR REPLACE FUNCTION public.learner_practicals_complete(
  p_user_id   UUID,
  p_course_id UUID
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_required_count  INTEGER;
  v_completed_count INTEGER;
BEGIN
  -- Count lessons that require evidence approval
  SELECT COUNT(*) INTO v_required_count
  FROM public.course_lessons
  WHERE course_id = p_course_id
    AND requires_evidence = true;

  IF v_required_count = 0 THEN RETURN true; END IF;

  -- Count lessons where the learner has at least one approved evidence submission
  SELECT COUNT(DISTINCT lesson_id) INTO v_completed_count
  FROM public.student_lesson_evidence
  WHERE user_id   = p_user_id
    AND course_id = p_course_id
    AND status    = 'approved';

  RETURN v_completed_count >= v_required_count;
END;
$$;

-- DB function: check skill signoffs complete
CREATE OR REPLACE FUNCTION public.learner_signoffs_complete(
  p_user_id   UUID,
  p_course_id UUID
) RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_required INTEGER;
  v_approved INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_required
  FROM public.course_lessons
  WHERE course_id = p_course_id AND requires_signoff = true;

  IF v_required = 0 THEN RETURN true; END IF;

  SELECT COUNT(DISTINCT lesson_id) INTO v_approved
  FROM public.student_skill_signoffs
  WHERE user_id   = p_user_id
    AND course_id = p_course_id
    AND status    = 'approved';

  RETURN v_approved >= v_required;
END;
$$;

-- ── 7. RLS ────────────────────────────────────────────────────────────────────

ALTER TABLE public.practical_requirements       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_lesson_evidence      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_skill_signoffs       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_practical_progress   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_publish_audits        ENABLE ROW LEVEL SECURITY;

-- practical_requirements: public read (learners need instructions)
CREATE POLICY "Authenticated read practical_requirements"
  ON public.practical_requirements FOR SELECT
  USING (auth.role() IN ('authenticated','service_role'));
CREATE POLICY "Service role practical_requirements"
  ON public.practical_requirements
  USING (auth.role() = 'service_role');

-- student_lesson_evidence: learner owns their rows; evaluators/admins via service_role
CREATE POLICY "Learner read own evidence"
  ON public.student_lesson_evidence FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY "Learner insert own evidence"
  ON public.student_lesson_evidence FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role evidence"
  ON public.student_lesson_evidence
  USING (auth.role() = 'service_role');

-- student_skill_signoffs: learner read own; evaluator/admin via service_role
CREATE POLICY "Learner read own signoffs"
  ON public.student_skill_signoffs FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY "Service role signoffs"
  ON public.student_skill_signoffs
  USING (auth.role() = 'service_role');

-- student_practical_progress: learner read own
CREATE POLICY "Learner read own practical progress"
  ON public.student_practical_progress FOR SELECT
  USING (auth.uid() = user_id OR auth.role() = 'service_role');
CREATE POLICY "Service role practical progress"
  ON public.student_practical_progress
  USING (auth.role() = 'service_role');

-- course_publish_audits: admin/service_role only
CREATE POLICY "Service role publish audits"
  ON public.course_publish_audits
  USING (auth.role() = 'service_role');

-- ── 8. Grants ─────────────────────────────────────────────────────────────────

GRANT SELECT ON public.practical_requirements     TO authenticated;
GRANT ALL    ON public.practical_requirements     TO service_role;
GRANT SELECT, INSERT ON public.student_lesson_evidence TO authenticated;
GRANT ALL    ON public.student_lesson_evidence    TO service_role;
GRANT SELECT ON public.student_skill_signoffs     TO authenticated;
GRANT ALL    ON public.student_skill_signoffs     TO service_role;
GRANT SELECT ON public.student_practical_progress TO authenticated;
GRANT ALL    ON public.student_practical_progress TO service_role;
GRANT ALL    ON public.course_publish_audits      TO service_role;
