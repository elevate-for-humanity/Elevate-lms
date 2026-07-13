-- ---------------------------------------------------------------------------
-- Partner site inspections
-- Tracks DOL apprenticeship site inspection records for barbershop partners.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.partner_site_inspections (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id        UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  inspected_by      UUID REFERENCES public.profiles(id),
  inspected_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  status            TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending','approved','failed','waived')),
  notes             TEXT,
  inspection_type   TEXT NOT NULL DEFAULT 'initial' CHECK (inspection_type IN ('initial','annual','follow_up','virtual')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_site_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage site inspections"
  ON public.partner_site_inspections FOR ALL TO authenticated
  USING (is_admin_role())
  WITH CHECK (is_admin_role());

CREATE POLICY "Partners can view their own inspections"
  ON public.partner_site_inspections FOR SELECT TO authenticated
  USING (
    partner_id IN (
      SELECT partner_id FROM public.partner_users WHERE user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_partner_site_inspections_partner_id
  ON public.partner_site_inspections(partner_id);

CREATE TRIGGER trg_partner_site_inspections_updated_at
  BEFORE UPDATE ON public.partner_site_inspections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
