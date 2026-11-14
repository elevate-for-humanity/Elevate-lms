-- Add missing MOU signing columns to program_holders
ALTER TABLE public.program_holders
  ADD COLUMN IF NOT EXISTS mou_holder_name        TEXT,
  ADD COLUMN IF NOT EXISTS mou_holder_signed_at   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mou_holder_sig_url      TEXT;
