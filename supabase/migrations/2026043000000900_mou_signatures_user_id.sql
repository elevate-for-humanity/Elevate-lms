-- Add user_id to mou_signatures so the PDF download route can look up
-- a signature by the authenticated user.
ALTER TABLE public.mou_signatures
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mou_signatures_user_id
  ON public.mou_signatures (user_id);

-- Allow authenticated users to read their own signature
DROP POLICY IF EXISTS "Users can read own mou_signature" ON public.mou_signatures;
CREATE POLICY "Users can read own mou_signature"
  ON public.mou_signatures
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own signature
DROP POLICY IF EXISTS "Users can insert own mou_signature" ON public.mou_signatures;
CREATE POLICY "Users can insert own mou_signature"
  ON public.mou_signatures
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);
