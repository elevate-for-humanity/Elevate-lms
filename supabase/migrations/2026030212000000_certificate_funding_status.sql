-- Add funding_status to certificate tables.
-- When a refund/void occurs after certificate issuance, the certificate
-- is flagged rather than revoked. The credential itself remains valid
-- (training was delivered) but the funding status is marked for audit.
--
-- Values: 'funded' (default), 'refunded', 'voided', 'disputed'

ALTER TABLE public.certificates
  ADD COLUMN IF NOT EXISTS funding_status TEXT NOT NULL DEFAULT 'funded',
  ADD COLUMN IF NOT EXISTS funding_status_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS funding_status_reason TEXT;

ALTER TABLE public.issued_certificates
  ADD COLUMN IF NOT EXISTS funding_status TEXT NOT NULL DEFAULT 'funded',
  ADD COLUMN IF NOT EXISTS funding_status_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS funding_status_reason TEXT;

-- module_certificates and program_completion_certificates may not exist
-- in all environments, so use DO blocks
DO $$ BEGIN
  ALTER TABLE public.program_completion_certificates
    ADD COLUMN IF NOT EXISTS funding_status TEXT NOT NULL DEFAULT 'funded',
    ADD COLUMN IF NOT EXISTS funding_status_changed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS funding_status_reason TEXT;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.partner_certificates
    ADD COLUMN IF NOT EXISTS funding_status TEXT NOT NULL DEFAULT 'funded',
    ADD COLUMN IF NOT EXISTS funding_status_changed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS funding_status_reason TEXT;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.module_certificates
    ADD COLUMN IF NOT EXISTS funding_status TEXT NOT NULL DEFAULT 'funded',
    ADD COLUMN IF NOT EXISTS funding_status_changed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS funding_status_reason TEXT;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- Index for reconciliation queries
CREATE INDEX IF NOT EXISTS idx_certificates_funding_status
  ON public.certificates (funding_status) WHERE funding_status != 'funded';

CREATE INDEX IF NOT EXISTS idx_issued_certificates_funding_status
  ON public.issued_certificates (funding_status) WHERE funding_status != 'funded';

COMMENT ON COLUMN public.certificates.funding_status IS
  'Payment funding status. Certificates are NOT revoked on refund (training was delivered), but flagged for audit.';
