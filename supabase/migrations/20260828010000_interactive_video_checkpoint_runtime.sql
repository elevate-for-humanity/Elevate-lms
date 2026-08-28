-- Durable, access-aware persistence for every instructional-video checkpoint.

ALTER TABLE public.interactive_video_quiz_answers
  ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE;

UPDATE public.interactive_video_quiz_answers answer
SET course_id = lesson.course_id
FROM public.course_lessons lesson
WHERE lesson.id = answer.lesson_id
  AND answer.course_id IS NULL;

ALTER TABLE public.interactive_video_quiz_answers
  DROP CONSTRAINT IF EXISTS interactive_video_quiz_answers_lesson_id_fkey;
ALTER TABLE public.interactive_video_quiz_answers
  ADD CONSTRAINT interactive_video_quiz_answers_lesson_id_fkey
  FOREIGN KEY (lesson_id) REFERENCES public.course_lessons(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS interactive_video_quiz_answers_course_idx
  ON public.interactive_video_quiz_answers(course_id, lesson_id, user_id);

DROP POLICY IF EXISTS users_own_video_quiz_answers ON public.interactive_video_quiz_answers;
DROP POLICY IF EXISTS own_interactive_video_quiz_answers ON public.interactive_video_quiz_answers;
CREATE POLICY interactive_video_quiz_answers_select_own
  ON public.interactive_video_quiz_answers FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND course_id IS NOT NULL
    AND private.can_access_course_lesson(course_id, lesson_id)
  );
CREATE POLICY interactive_video_quiz_answers_insert_own
  ON public.interactive_video_quiz_answers FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND course_id IS NOT NULL
    AND private.can_access_course_lesson(course_id, lesson_id)
  );
CREATE POLICY interactive_video_quiz_answers_update_own
  ON public.interactive_video_quiz_answers FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND course_id IS NOT NULL
    AND private.can_access_course_lesson(course_id, lesson_id)
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND course_id IS NOT NULL
    AND private.can_access_course_lesson(course_id, lesson_id)
  );

CREATE TABLE IF NOT EXISTS public.learner_video_checkpoint_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  checkpoint_key text NOT NULL CHECK (length(btrim(checkpoint_key)) BETWEEN 3 AND 240),
  checkpoint_type text NOT NULL CHECK (checkpoint_type IN ('hotspot','scenario','reflection','key-concept')),
  response jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_correct boolean,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT learner_video_checkpoint_response_unique UNIQUE(user_id, lesson_id, checkpoint_key)
);

CREATE INDEX IF NOT EXISTS learner_video_checkpoint_owner_lesson_idx
  ON public.learner_video_checkpoint_responses(user_id, lesson_id, checkpoint_key);
CREATE INDEX IF NOT EXISTS learner_video_checkpoint_course_idx
  ON public.learner_video_checkpoint_responses(course_id, lesson_id);

ALTER TABLE public.learner_video_checkpoint_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY learner_video_checkpoint_select_own
  ON public.learner_video_checkpoint_responses FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND private.can_access_course_lesson(course_id, lesson_id)
  );
CREATE POLICY learner_video_checkpoint_insert_own
  ON public.learner_video_checkpoint_responses FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND private.can_access_course_lesson(course_id, lesson_id)
  );
CREATE POLICY learner_video_checkpoint_update_own
  ON public.learner_video_checkpoint_responses FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    AND private.can_access_course_lesson(course_id, lesson_id)
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND private.can_access_course_lesson(course_id, lesson_id)
  );

GRANT SELECT, INSERT, UPDATE ON public.interactive_video_quiz_answers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.learner_video_checkpoint_responses TO authenticated;
