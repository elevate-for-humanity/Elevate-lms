-- student_practical_progress: tracks accumulated lab/practical hours per student per lesson.
-- Written by /api/lms/practical-progress (GET + POST + PATCH).

CREATE TABLE IF NOT EXISTS public.student_practical_progress (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id           uuid NOT NULL,
  accumulated_hours   numeric(6,2) DEFAULT 0,
  approved_attempts   integer DEFAULT 0,
  status              text DEFAULT 'in_progress'
                        CHECK (status IN ('in_progress', 'completed', 'failed')),
  last_updated_at     timestamptz DEFAULT now(),
  created_at          timestamptz DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS spp_user_idx   ON public.student_practical_progress (user_id);
CREATE INDEX IF NOT EXISTS spp_lesson_idx ON public.student_practical_progress (lesson_id);

COMMENT ON TABLE public.student_practical_progress IS
  'Accumulated lab/practical hours per student per lesson. Used by /api/lms/practical-progress.';
