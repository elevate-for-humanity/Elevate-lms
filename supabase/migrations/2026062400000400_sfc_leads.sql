ALTER TABLE public.sfc_leads ADD COLUMN IF NOT EXISTS service_type text;
ALTER TABLE public.sfc_leads ADD COLUMN IF NOT EXISTS referral_source text;
ALTER TABLE public.sfc_leads ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.sfc_leads ADD COLUMN IF NOT EXISTS converted_at timestamptz;
ALTER TABLE public.sfc_leads ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

-- Supersonic Fast Cash — canonical intake spine
-- Phase 2.2: every form on the SFC site writes one sfc_leads row.
-- Phase 3.3: documents attach to lead_id via sfc_documents.
-- Phase 3.4: appointments link back via sfc_leads.appointment_id.
-- Apply in Supabase Dashboard → SQL Editor

-- ── Leads ────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.sfc_leads (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),

  -- Identity
  first_name              text        NOT NULL,
  last_name               text        NOT NULL,
  email                   text        NOT NULL,
  phone                   text,
  preferred_contact_method text       CHECK (preferred_contact_method IN ('phone','email','text')) DEFAULT 'phone',

  -- Attribution
  source                  text        NOT NULL DEFAULT 'website',
                            CHECK (source IN ('calculator','service_page','contact','state_page','book_appointment','start','upload','referral','website')),
  source_detail           text,       -- e.g. 'tax-preparation-indiana', 'refund-advance'
  utm_campaign            text,
  utm_medium              text,

  -- Qualification
  service_type            text        CHECK (service_type IN ('tax_prep','refund_advance','bookkeeping','payroll','diy','audit_protection','cash_advance')),
  state                   text,
  filing_status           text        CHECK (filing_status IN ('single','married_joint','married_separate','head_of_household')),
  income_range            text        CHECK (income_range IN ('under_25k','25k_50k','50k_75k','75k_100k','over_100k')),
  refund_estimate         numeric(10,2),
  has_1099                boolean,
  has_dependents          boolean,
  dependents_count        int,
  needs_refund_advance    boolean,

  -- Pipeline status
  status                  text        NOT NULL DEFAULT 'new',
                            CHECK (status IN ('new','contacted','docs_pending','docs_received','in_preparation','filed','completed','lost')),

  -- Links
  appointment_id          uuid,       -- FK set after appointment is created
  notes                   text           -- one canonical lead per email; use upsert for duplicates
);

CREATE INDEX IF NOT EXISTS idx_sfc_leads_status      ON public.sfc_leads(status);
CREATE INDEX IF NOT EXISTS idx_sfc_leads_source      ON public.sfc_leads(source);
CREATE INDEX IF NOT EXISTS idx_sfc_leads_created_at  ON public.sfc_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sfc_leads_service     ON public.sfc_leads(service_type);

-- ── Documents ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.sfc_documents (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    timestamptz NOT NULL DEFAULT now(),

  lead_id       uuid        NOT NULL REFERENCES public.sfc_leads(id) ON DELETE CASCADE,
  file_url      text        NOT NULL,
  file_name     text,
  file_type     text,       -- 'pdf','jpg','png','heic'
  file_size     bigint,
  doc_category  text        CHECK (doc_category IN ('w2','1099','id','ssn_card','prior_return','other')),
  uploaded_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sfc_documents_lead_id ON public.sfc_documents(lead_id);

-- ── Row-level security ─────────────────────────────────────────────────────
-- Service-role writes (via admin client) are unrestricted.
-- Authenticated admin/staff can read all rows.
-- Public: no direct access — all mutations go through the API.

ALTER TABLE public.sfc_leads     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sfc_documents ENABLE ROW LEVEL SECURITY;

-- Admin read policy
DROP POLICY IF EXISTS sfc_leads_admin_read     ON public.sfc_leads;
DROP POLICY IF EXISTS sfc_documents_admin_read ON public.sfc_documents;

DO $$ BEGIN CREATE POLICY sfc_leads_admin_read ON public.sfc_leads
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin','super_admin','staff')
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE POLICY sfc_documents_admin_read ON public.sfc_documents
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin','super_admin','staff')
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Admin write policy (status updates, notes)
DROP POLICY IF EXISTS sfc_leads_admin_write     ON public.sfc_leads;

DO $$ BEGIN CREATE POLICY sfc_leads_admin_write ON public.sfc_leads
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('admin','super_admin','staff')
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Timestamp trigger ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.sfc_leads_set_updated_at()
  RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sfc_leads_updated_at ON public.sfc_leads;
CREATE TRIGGER sfc_leads_updated_at
  BEFORE UPDATE ON public.sfc_leads
  FOR EACH ROW EXECUTE FUNCTION public.sfc_leads_set_updated_at();

