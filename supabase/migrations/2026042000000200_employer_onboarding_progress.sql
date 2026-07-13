-- employer_onboarding_progress
-- Tracks per-employer orientation step completion.
-- Written by /onboarding/employer/orientation (upsert on user_id).
-- Read by /admin/employers/onboarding to show orientation progress panel.

CREATE TABLE IF NOT EXISTS public.employer_onboarding_progress (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  employer_id           uuid        REFERENCES public.employers(id) ON DELETE SET NULL,
  orientation_viewed    boolean     NOT NULL DEFAULT false,
  orientation_viewed_at timestamptz,
  step                  text        NOT NULL DEFAULT 'orientation'
                                    CHECK (step IN ('orientation','profile','documents','verification','complete')),
  status                text        NOT NULL DEFAULT 'in_progress'
                                    CHECK (status IN ('pending','in_progress','completed')),
  completed_at          timestamptz,
  metadata              jsonb       DEFAULT '{}',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_emp_onboard_progress_user_id     ON public.employer_onboarding_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_emp_onboard_progress_employer_id ON public.employer_onboarding_progress(employer_id);
CREATE INDEX IF NOT EXISTS idx_emp_onboard_progress_status      ON public.employer_onboarding_progress(status);
CREATE INDEX IF NOT EXISTS idx_emp_onboard_progress_created_at  ON public.employer_onboarding_progress(created_at DESC);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_emp_onboard_progress_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_emp_onboard_progress_updated_at ON public.employer_onboarding_progress;
CREATE TRIGGER trg_emp_onboard_progress_updated_at
  BEFORE UPDATE ON public.employer_onboarding_progress
  FOR EACH ROW EXECUTE FUNCTION public.set_emp_onboard_progress_updated_at();

-- RLS: admins read all; employers read/write their own row
ALTER TABLE public.employer_onboarding_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_emp_onboard_progress" ON public.employer_onboarding_progress;
DROP POLICY IF EXISTS "user_own_emp_onboard_progress"  ON public.employer_onboarding_progress;

CREATE POLICY "admin_all_emp_onboard_progress" ON public.employer_onboarding_progress
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin','super_admin','staff')
    )
  );

CREATE POLICY "user_own_emp_onboard_progress" ON public.employer_onboarding_progress
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
