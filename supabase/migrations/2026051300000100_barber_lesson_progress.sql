-- barber_lesson_progress
-- Tracks per-user lesson completion for the barber apprenticeship program.
-- Mirrors the structure of public.lesson_progress but is barber-specific,
-- allowing barber-program queries without cross-program join noise.
--
-- Apply: Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.barber_lesson_progress (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id     UUID,
  lesson_id     TEXT        NOT NULL,
  lesson_slug   TEXT,
  completed     BOOLEAN     NOT NULL DEFAULT false,
  completed_at  TIMESTAMPTZ,
  score         NUMERIC,
  time_spent_s  INTEGER,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, lesson_id)
);

CREATE INDEX IF NOT EXISTS idx_barber_lp_user_id
  ON public.barber_lesson_progress (user_id);

CREATE INDEX IF NOT EXISTS idx_barber_lp_course_id
  ON public.barber_lesson_progress (course_id);

-- RLS
ALTER TABLE public.barber_lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "barber_lp_own_read"   ON public.barber_lesson_progress;
DROP POLICY IF EXISTS "barber_lp_own_write"  ON public.barber_lesson_progress;
DROP POLICY IF EXISTS "barber_lp_admin_all"  ON public.barber_lesson_progress;

CREATE POLICY "barber_lp_own_read" ON public.barber_lesson_progress
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "barber_lp_own_write" ON public.barber_lesson_progress
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "barber_lp_admin_all" ON public.barber_lesson_progress
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff', 'instructor')
    )
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON public.barber_lesson_progress TO authenticated;
GRANT ALL ON public.barber_lesson_progress TO service_role;
