-- Update program_holders table for two-step MOU signing
-- Remove old fields and add new ones for holder + admin signatures

ALTER TABLE program_holders
  DROP COLUMN IF EXISTS signed_mou_url;

ALTER TABLE program_holders
  ADD COLUMN IF NOT EXISTS mou_holder_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mou_holder_name TEXT,
  ADD COLUMN IF NOT EXISTS mou_holder_sig_url TEXT,
  ADD COLUMN IF NOT EXISTS mou_admin_signed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mou_admin_name TEXT,
  ADD COLUMN IF NOT EXISTS mou_admin_sig_url TEXT,
  ADD COLUMN IF NOT EXISTS mou_final_pdf_url TEXT;

-- Update mou_status to support new workflow
-- 'not_sent' -> 'pending' -> 'signed_by_holder' -> 'fully_executed'
COMMENT ON COLUMN program_holders.mou_status IS 'MOU workflow status: not_sent, pending, signed_by_holder, fully_executed';

-- Create storage bucket for agreements (signatures and final PDFs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('agreements', 'agreements', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read their own program holder's signatures
CREATE POLICY "Program holders can read their own agreements"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'agreements' AND
  (storage.foldername(name))[1] = 'program_holders' AND
  (storage.foldername(name))[2] IN (
    SELECT ph.id::text
    FROM program_holders ph
    JOIN user_profiles up ON up.program_holder_id = ph.id
    WHERE up.user_id = auth.uid()
  )
);

-- Allow admins to read all agreements
CREATE POLICY "Admins can read all agreements"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'agreements' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow system to insert agreements (via service role)
CREATE POLICY "System can insert agreements"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'agreements');

-- Allow system to update agreements (for upsert)
CREATE POLICY "System can update agreements"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'agreements');
