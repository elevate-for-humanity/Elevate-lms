-- jotform_submissions
-- Persists raw inbound JotForm webhook payloads for downstream processing.
-- Apply: Supabase Dashboard → SQL Editor

CREATE TABLE IF NOT EXISTS public.jotform_submissions (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id        TEXT        NOT NULL,
  submission_id  TEXT        NOT NULL,
  answers        JSONB       NOT NULL DEFAULT '{}',
  raw_payload    JSONB       NOT NULL DEFAULT '{}',
  processed      BOOLEAN     NOT NULL DEFAULT false,
  processed_at   TIMESTAMPTZ,
  received_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (submission_id)
);

CREATE INDEX IF NOT EXISTS idx_jotform_sub_form_id      ON public.jotform_submissions (form_id);
CREATE INDEX IF NOT EXISTS idx_jotform_sub_processed    ON public.jotform_submissions (processed) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_jotform_sub_received_at  ON public.jotform_submissions (received_at DESC);

-- Admin/staff can read and process; no learner access needed.
ALTER TABLE public.jotform_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jotform_sub_admin_read" ON public.jotform_submissions;
CREATE POLICY "jotform_sub_admin_read" ON public.jotform_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'super_admin', 'staff')
    )
  );

GRANT ALL ON public.jotform_submissions TO service_role;
GRANT SELECT ON public.jotform_submissions TO authenticated;
