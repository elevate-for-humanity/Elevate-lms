-- Add qualification_path to leads so funnel path (A/B/C) is queryable,
-- not just buried in a notes text field.
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS qualification_path TEXT CHECK (qualification_path IN ('A', 'B', 'C')),
  ADD COLUMN IF NOT EXISTS qualifier_unemployed TEXT,
  ADD COLUMN IF NOT EXISTS qualifier_indiana TEXT,
  ADD COLUMN IF NOT EXISTS qualifier_wants_cert TEXT;

CREATE INDEX IF NOT EXISTS idx_leads_qualification_path ON public.leads (qualification_path);
CREATE INDEX IF NOT EXISTS idx_leads_source ON public.leads (source);
