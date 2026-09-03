-- Track automated follow-up emails sent to applicants in funded statuses.
-- Used by /api/cron/funding-followup to avoid duplicate sends and to
-- surface "call required" flags in the admin dashboard after 2 attempts.

CREATE TABLE IF NOT EXISTS public.application_followups (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id    UUID        NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  followup_type     TEXT        NOT NULL CHECK (followup_type IN ('icc_nudge', 'review_reassurance')),
  followup_number   INTEGER     NOT NULL CHECK (followup_number IN (1, 2)),
  sent_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  email_subject     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- One follow-up per number per application (prevents duplicate sends on retry)
CREATE UNIQUE INDEX IF NOT EXISTS idx_application_followups_unique
  ON public.application_followups (application_id, followup_number);

-- Admin dashboard: find all applications that need manual outreach
CREATE INDEX IF NOT EXISTS idx_application_followups_app
  ON public.application_followups (application_id);

-- RLS: admins only
ALTER TABLE public.application_followups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage application_followups" ON public.application_followups;
CREATE POLICY "Admins can manage application_followups" ON public.application_followups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

COMMENT ON TABLE public.application_followups IS
  'Automated follow-up email log for pending_funding and pending_admin_review applications. '
  'Max 2 follow-ups per application — after that, next_step is set to call_required.';
