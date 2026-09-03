-- Tracks follow-up emails sent to school applicants.
-- Prevents duplicate sends across cron runs (idempotency key: application_id + sequence).

CREATE TABLE IF NOT EXISTS public.school_application_followups (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.school_applications(id) ON DELETE CASCADE,
  sequence       TEXT NOT NULL CHECK (sequence IN ('24h', '72h', '96h')),
  sent_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_school_followups_application_v2 ON public.school_application_followups(application_id);
CREATE INDEX IF NOT EXISTS idx_school_followups_sent_at     ON public.school_application_followups(sent_at DESC);

ALTER TABLE public.school_application_followups ENABLE ROW LEVEL SECURITY;

DROP policy if exists "Service role full access followups" on public.school_application_followups;
CREATE policy "Service role full access followups" on public.school_application_followups FOR ALL
  TO service_role USING (true) WITH CHECK (true);

DROP policy if exists "Admin can view followups" on public.school_application_followups;
CREATE policy "Admin can view followups" on public.school_application_followups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff')
    )
  );

