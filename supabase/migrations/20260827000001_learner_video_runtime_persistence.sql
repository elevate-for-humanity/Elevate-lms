-- Canonical learner-owned persistence for instructional video playback.

CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.can_access_course_lesson(
  p_course_id uuid,
  p_lesson_id uuid
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.course_lessons lesson
      WHERE lesson.id = p_lesson_id
        AND lesson.course_id = p_course_id
    )
    AND (
      EXISTS (
        SELECT 1
        FROM public.course_access access
        WHERE access.user_id = auth.uid()
          AND access.course_id = p_course_id
          AND (access.expires_at IS NULL OR access.expires_at > now())
      )
      OR EXISTS (
        SELECT 1
        FROM public.course_enrollments enrollment
        WHERE enrollment.student_id = auth.uid()
          AND enrollment.course_id = p_course_id
          AND lower(COALESCE(enrollment.status, 'active')) NOT IN ('cancelled', 'canceled', 'refunded', 'withdrawn')
      )
    );
$$;

REVOKE ALL ON FUNCTION private.can_access_course_lesson(uuid, uuid) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_access_course_lesson(uuid, uuid) TO authenticated;

CREATE TABLE IF NOT EXISTS public.learner_video_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  body text NOT NULL CHECK (length(btrim(body)) BETWEEN 1 AND 5000),
  position_seconds numeric(12, 3) NOT NULL DEFAULT 0 CHECK (position_seconds >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS learner_video_notes_owner_lesson_idx
  ON public.learner_video_notes (user_id, lesson_id, position_seconds);
CREATE INDEX IF NOT EXISTS learner_video_notes_course_idx ON public.learner_video_notes (course_id);
CREATE INDEX IF NOT EXISTS learner_video_notes_lesson_idx ON public.learner_video_notes (lesson_id);

CREATE TABLE IF NOT EXISTS public.learner_video_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id uuid NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  progress_percent integer NOT NULL DEFAULT 0 CHECK (progress_percent BETWEEN 0 AND 100),
  last_position_seconds numeric(12, 3) NOT NULL DEFAULT 0 CHECK (last_position_seconds >= 0),
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT learner_video_progress_user_lesson_key UNIQUE (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS learner_video_progress_owner_course_idx
  ON public.learner_video_progress (user_id, course_id);
CREATE INDEX IF NOT EXISTS learner_video_progress_course_idx ON public.learner_video_progress (course_id);
CREATE INDEX IF NOT EXISTS learner_video_progress_lesson_idx ON public.learner_video_progress (lesson_id);

ALTER TABLE public.learner_video_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learner_video_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS learner_video_notes_select_own ON public.learner_video_notes;
CREATE POLICY learner_video_notes_select_own ON public.learner_video_notes
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    AND private.can_access_course_lesson(course_id, lesson_id)
  );

DROP POLICY IF EXISTS learner_video_notes_insert_own ON public.learner_video_notes;
CREATE POLICY learner_video_notes_insert_own ON public.learner_video_notes
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND private.can_access_course_lesson(course_id, lesson_id)
  );

DROP POLICY IF EXISTS learner_video_notes_update_own ON public.learner_video_notes;
CREATE POLICY learner_video_notes_update_own ON public.learner_video_notes
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    AND private.can_access_course_lesson(course_id, lesson_id)
  )
  WITH CHECK (
    user_id = auth.uid()
    AND private.can_access_course_lesson(course_id, lesson_id)
  );

DROP POLICY IF EXISTS learner_video_notes_delete_own ON public.learner_video_notes;
CREATE POLICY learner_video_notes_delete_own ON public.learner_video_notes
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    AND private.can_access_course_lesson(course_id, lesson_id)
  );

DROP POLICY IF EXISTS learner_video_progress_select_own ON public.learner_video_progress;
CREATE POLICY learner_video_progress_select_own ON public.learner_video_progress
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    AND private.can_access_course_lesson(course_id, lesson_id)
  );

DROP POLICY IF EXISTS learner_video_progress_insert_own ON public.learner_video_progress;
CREATE POLICY learner_video_progress_insert_own ON public.learner_video_progress
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND private.can_access_course_lesson(course_id, lesson_id)
  );

DROP POLICY IF EXISTS learner_video_progress_update_own ON public.learner_video_progress;
CREATE POLICY learner_video_progress_update_own ON public.learner_video_progress
  FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    AND private.can_access_course_lesson(course_id, lesson_id)
  )
  WITH CHECK (
    user_id = auth.uid()
    AND private.can_access_course_lesson(course_id, lesson_id)
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.learner_video_notes TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.learner_video_progress TO authenticated;
