-- Add signer_name, signer_email, role columns to signatures table.
-- The /api/signature/documents/[id]/sign route inserts these fields
-- but the original table only had user_id + signature_data columns.
-- signed_at already existed; added IF NOT EXISTS for safety.

ALTER TABLE public.signatures
  ADD COLUMN IF NOT EXISTS signer_name  text,
  ADD COLUMN IF NOT EXISTS signer_email text,
  ADD COLUMN IF NOT EXISTS role         text;
