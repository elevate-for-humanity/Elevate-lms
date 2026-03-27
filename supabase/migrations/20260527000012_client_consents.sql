-- client_consents: stores signed engagement + §7216 consent records
-- Every SupersonicFastCash client must have a row here before accessing
-- upload-documents or the client portal.

CREATE TABLE IF NOT EXISTS public.client_consents (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name        text NOT NULL,
  ssn_last4        text NOT NULL CHECK (ssn_last4 ~ '^\d{4}$'),
  ip_address       text NOT NULL,
  user_agent       text,
  consent_version  text NOT NULL DEFAULT 'v1.0',
  signed_at        timestamptz NOT NULL DEFAULT now(),
  signature_text   text NOT NULL,
  -- snapshot of the exact document text they agreed to
  document_snapshot text NOT NULL
);

-- One active consent per user (latest wins — allow re-sign on version bump)
CREATE INDEX IF NOT EXISTS client_consents_client_id_idx ON public.client_consents(client_id);
CREATE INDEX IF NOT EXISTS client_consents_signed_at_idx  ON public.client_consents(signed_at DESC);

-- RLS: users can only read their own consent; inserts via service role only
ALTER TABLE public.client_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_consent"
  ON public.client_consents FOR SELECT
  USING (client_id = auth.uid());

-- No direct client INSERT — all writes go through the API route (service role)
