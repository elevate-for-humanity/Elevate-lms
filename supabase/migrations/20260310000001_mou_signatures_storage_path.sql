-- Add signature_path column to mou_signatures
-- Stores the Supabase Storage path instead of raw base64 blob
ALTER TABLE public.mou_signatures
  ADD COLUMN IF NOT EXISTS signature_path TEXT;

-- Index for admin lookups by storage path
CREATE INDEX IF NOT EXISTS idx_mou_signatures_path ON public.mou_signatures (signature_path)
  WHERE signature_path IS NOT NULL;
