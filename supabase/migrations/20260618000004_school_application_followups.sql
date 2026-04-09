-- Tracks follow-up emails sent to school applicants.
-- Prevents duplicate sends across cron runs (idempotency key: application_id + sequence).

CREATE TABLE IF NOT EXISTS public.school_application_followups (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.school_applications(id) ON DELETE CASCADE,
  sequence       TEXT NOT NULL CHECK (sequence IN ('24h', '72h', '96h')),
  sent_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (application_id, sequence)
);

CREATE INDEX idx_school_followups_application ON public.school_application_followups(application_id);
CREATE INDEX idx_school_followups_sent_at     ON public.school_application_followups(sent_at DESC);

ALTER TABLE public.school_application_followups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access followups"
  ON public.school_application_followups FOR ALL
  TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Admin can view followups"
  ON public.school_application_followups FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'super_admin', 'staff')
    )
  );
