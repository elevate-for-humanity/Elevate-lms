-- Student lesson evidence submissions.
-- Learners submit text, file, image, video, audio, or URL evidence for practical lessons.
-- Instructor reviews and approves/rejects each submission.

CREATE TABLE IF NOT EXISTS public.student_lesson_evidence (
  id                   uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id              uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id            uuid NOT NULL,
  lesson_id            uuid NOT NULL,
  submission_mode      text NOT NULL CHECK (submission_mode IN ('text','file','image','video','audio','url')),
  body_text            text,
  file_url             text,
  media_url            text,
  external_url         text,
  status               text NOT NULL DEFAULT 'submitted'
                         CHECK (status IN ('submitted','under_review','approved','rejected','revision_requested')),
  evaluator_notes      text,
  attempt_number       integer NOT NULL DEFAULT 1,
  submitted_at         timestamptz DEFAULT now(),
  reviewed_at          timestamptz,
  reviewed_by          uuid REFERENCES auth.users(id),
  created_at           timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sle_user_lesson_idx ON public.student_lesson_evidence (user_id, lesson_id);
CREATE INDEX IF NOT EXISTS sle_course_idx      ON public.student_lesson_evidence (course_id);
CREATE INDEX IF NOT EXISTS sle_status_idx      ON public.student_lesson_evidence (status);

COMMENT ON TABLE public.student_lesson_evidence IS
  'Learner evidence submissions for practical lessons. Backed by /api/lms/evidence.';
