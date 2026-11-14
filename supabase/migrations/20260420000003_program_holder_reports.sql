-- program_holder_reports
-- Generic report store for program holders.
-- Referenced by /program-holder/reports with fallback to apprentice_weekly_reports.
-- Columns match the shape the page maps from apprentice_weekly_reports fallback:
--   id, title, status, created_at, hours_worked, report_type

CREATE TABLE IF NOT EXISTS public.program_holder_reports (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  program_holder_id   uuid        NOT NULL REFERENCES public.program_holders(id) ON DELETE CASCADE,
  user_id             uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  title               text        NOT NULL,
  report_type         text        NOT NULL DEFAULT 'general'
                                  CHECK (report_type IN ('general','weekly','monthly','compliance','financial','incident')),
  status              text        NOT NULL DEFAULT 'pending'
                                  CHECK (status IN ('pending','submitted','under_review','approved','rejected')),
  content             text,
  hours_worked        numeric(6,2),
  period_start        date,
  period_end          date,
  submitted_at        timestamptz,
  reviewed_at         timestamptz,
  reviewed_by         uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewer_notes      text,
  attachments         jsonb       DEFAULT '[]',
  metadata            jsonb       DEFAULT '{}',
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ph_reports_program_holder_id ON public.program_holder_reports(program_holder_id);
CREATE INDEX IF NOT EXISTS idx_ph_reports_status            ON public.program_holder_reports(status);
CREATE INDEX IF NOT EXISTS idx_ph_reports_created_at        ON public.program_holder_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ph_reports_report_type       ON public.program_holder_reports(report_type);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_ph_reports_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS trg_ph_reports_updated_at ON public.program_holder_reports;
CREATE TRIGGER trg_ph_reports_updated_at
  BEFORE UPDATE ON public.program_holder_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_ph_reports_updated_at();

-- RLS: admins read all; program holders read/write their own
ALTER TABLE public.program_holder_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_ph_reports"        ON public.program_holder_reports;
DROP POLICY IF EXISTS "ph_own_reports_select"        ON public.program_holder_reports;
DROP POLICY IF EXISTS "ph_own_reports_insert_update" ON public.program_holder_reports;

CREATE POLICY "admin_all_ph_reports" ON public.program_holder_reports
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('admin','super_admin','staff')
    )
  );

CREATE POLICY "ph_own_reports_select" ON public.program_holder_reports
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id
        AND ph.user_id = auth.uid()
    )
  );

CREATE POLICY "ph_own_reports_insert_update" ON public.program_holder_reports
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.program_holders ph
      WHERE ph.id = program_holder_id
        AND ph.user_id = auth.uid()
    )
  );
