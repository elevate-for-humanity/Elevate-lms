-- exam_enforcement_holds: blocks retakes until hold is cleared.
-- Written by the proctor session PATCH route on exam fail.
-- Idempotent — safe to re-run.

CREATE TABLE IF NOT EXISTS public.exam_enforcement_holds (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id      uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id       uuid,
  enrollment_id   uuid,
  exam_session_id uuid,
  hold_type       text NOT NULL DEFAULT 'retake_cooldown'
    CHECK (hold_type IN ('retake_cooldown', 'manual', 'payment_required', 'instructor_review')),
  reason          text,
  hold_until      timestamptz,
  cleared_at      timestamptz,
  cleared_by      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by      uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS exam_enforcement_holds_student_idx
  ON public.exam_enforcement_holds (student_id)
  WHERE cleared_at IS NULL;

ALTER TABLE public.exam_enforcement_holds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access_holds" ON public.exam_enforcement_holds
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin','super_admin','staff','instructor')
  ));

CREATE POLICY "student_read_own_holds" ON public.exam_enforcement_holds
  FOR SELECT TO authenticated
  USING (student_id = auth.uid());
