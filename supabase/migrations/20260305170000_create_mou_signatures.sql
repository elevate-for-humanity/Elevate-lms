-- Create mou_signatures table (was missing — only ALTER TABLE statements existed)
CREATE TABLE IF NOT EXISTS public.mou_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signer_name TEXT NOT NULL,
  signer_title TEXT,
  signature_data TEXT,
  signed_at TIMESTAMPTZ DEFAULT now(),
  agreed_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  supervisor_name TEXT,
  supervisor_license TEXT,
  compensation_model TEXT,
  compensation_rate TEXT,
  mou_version TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mou_signatures_signer ON public.mou_signatures (signer_name);
CREATE INDEX IF NOT EXISTS idx_mou_signatures_signed_at ON public.mou_signatures (signed_at);

ALTER TABLE public.mou_signatures ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
DROP POLICY IF EXISTS "Service role full access on mou_signatures" ON public.mou_signatures;
CREATE POLICY "Service role full access on mou_signatures"
  ON public.mou_signatures
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Anon can insert (public form submission)
DROP POLICY IF EXISTS "Anon can insert mou_signatures" ON public.mou_signatures;
CREATE POLICY "Anon can insert mou_signatures"
  ON public.mou_signatures
  FOR INSERT
  WITH CHECK (true);
