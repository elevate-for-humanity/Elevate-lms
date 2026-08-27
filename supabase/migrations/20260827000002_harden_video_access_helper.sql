-- Move the RLS helper out of the exposed public API schema and add covering FK indexes.

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
      SELECT 1 FROM public.course_lessons lesson
      WHERE lesson.id = p_lesson_id AND lesson.course_id = p_course_id
    )
    AND (
      EXISTS (
        SELECT 1 FROM public.course_access access
        WHERE access.user_id = auth.uid()
          AND access.course_id = p_course_id
          AND (access.expires_at IS NULL OR access.expires_at > now())
      )
      OR EXISTS (
        SELECT 1 FROM public.course_enrollments enrollment
        WHERE enrollment.student_id = auth.uid()
          AND enrollment.course_id = p_course_id
          AND lower(COALESCE(enrollment.status, 'active')) NOT IN ('cancelled', 'canceled', 'refunded', 'withdrawn')
      )
    );
$$;

REVOKE ALL ON FUNCTION private.can_access_course_lesson(uuid, uuid) FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION private.can_access_course_lesson(uuid, uuid) TO authenticated;

ALTER POLICY learner_video_notes_select_own ON public.learner_video_notes
  USING (user_id = auth.uid() AND private.can_access_course_lesson(course_id, lesson_id));
ALTER POLICY learner_video_notes_insert_own ON public.learner_video_notes
  WITH CHECK (user_id = auth.uid() AND private.can_access_course_lesson(course_id, lesson_id));
ALTER POLICY learner_video_notes_update_own ON public.learner_video_notes
  USING (user_id = auth.uid() AND private.can_access_course_lesson(course_id, lesson_id))
  WITH CHECK (user_id = auth.uid() AND private.can_access_course_lesson(course_id, lesson_id));
ALTER POLICY learner_video_notes_delete_own ON public.learner_video_notes
  USING (user_id = auth.uid() AND private.can_access_course_lesson(course_id, lesson_id));
ALTER POLICY learner_video_progress_select_own ON public.learner_video_progress
  USING (user_id = auth.uid() AND private.can_access_course_lesson(course_id, lesson_id));
ALTER POLICY learner_video_progress_insert_own ON public.learner_video_progress
  WITH CHECK (user_id = auth.uid() AND private.can_access_course_lesson(course_id, lesson_id));
ALTER POLICY learner_video_progress_update_own ON public.learner_video_progress
  USING (user_id = auth.uid() AND private.can_access_course_lesson(course_id, lesson_id))
  WITH CHECK (user_id = auth.uid() AND private.can_access_course_lesson(course_id, lesson_id));

DROP FUNCTION IF EXISTS public.can_access_course_lesson(uuid, uuid);

CREATE INDEX IF NOT EXISTS learner_video_notes_course_idx ON public.learner_video_notes (course_id);
CREATE INDEX IF NOT EXISTS learner_video_notes_lesson_idx ON public.learner_video_notes (lesson_id);
CREATE INDEX IF NOT EXISTS learner_video_progress_course_idx ON public.learner_video_progress (course_id);
CREATE INDEX IF NOT EXISTS learner_video_progress_lesson_idx ON public.learner_video_progress (lesson_id);
