-- Partner policy acknowledgments table for barbershop (and future) partner onboarding
CREATE TABLE IF NOT EXISTS partner_policy_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_name TEXT NOT NULL,
  signer_name TEXT NOT NULL,
  policies_acknowledged TEXT[] NOT NULL DEFAULT '{}',
  acknowledged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for lookups by shop
CREATE INDEX IF NOT EXISTS idx_partner_policy_ack_shop
  ON partner_policy_acknowledgments (shop_name);

-- Add barber-specific columns to mou_signatures if not present
ALTER TABLE public.mou_signatures ADD COLUMN IF NOT EXISTS supervisor_name TEXT;
ALTER TABLE public.mou_signatures ADD COLUMN IF NOT EXISTS supervisor_license TEXT;
ALTER TABLE public.mou_signatures ADD COLUMN IF NOT EXISTS compensation_model TEXT;
ALTER TABLE public.mou_signatures ADD COLUMN IF NOT EXISTS compensation_rate TEXT;
ALTER TABLE public.mou_signatures ADD COLUMN IF NOT EXISTS mou_version TEXT;

-- RLS: allow inserts from service role (API routes use admin client)
ALTER TABLE partner_policy_acknowledgments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on partner_policy_acknowledgments"
  ON partner_policy_acknowledgments
  FOR ALL
  USING (true)
  WITH CHECK (true);
