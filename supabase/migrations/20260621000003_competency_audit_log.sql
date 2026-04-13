-- Audit trail for every instructor action on a competency check.
-- Every approve / reject / revision_requested action is recorded here.
-- This is the "proof of training" output required for DOL compliance.

CREATE TABLE IF NOT EXISTS public.competency_audit_log (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id   uuid        NOT NULL REFERENCES public.step_submissions(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id       uuid        REFERENCES public.course_lessons(id) ON DELETE SET NULL,
  course_id       uuid        REFERENCES public.courses(id) ON DELETE SET NULL,
  competency_key  text        DEFAULT NULL,
  action          text        NOT NULL CHECK (action IN ('approved','rejected','revision_requested','under_review')),
  actor_id        uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note            text        DEFAULT NULL,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_competency_audit_log_user
  ON public.competency_audit_log (user_id, lesson_id);

CREATE INDEX IF NOT EXISTS idx_competency_audit_log_actor
  ON public.competency_audit_log (actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_competency_audit_log_submission
  ON public.competency_audit_log (submission_id);

-- RLS: instructors and admins can read all; students can read their own
ALTER TABLE public.competency_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "instructors_read_audit_log" ON public.competency_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('instructor','admin','super_admin','staff')
    )
  );

CREATE POLICY "students_read_own_audit_log" ON public.competency_audit_log
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "instructors_insert_audit_log" ON public.competency_audit_log
  FOR INSERT WITH CHECK (
    actor_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('instructor','admin','super_admin','staff')
    )
  );

COMMENT ON TABLE public.competency_audit_log IS
  'Immutable audit trail of every instructor action on a competency check. Required for DOL apprenticeship compliance proof.';
