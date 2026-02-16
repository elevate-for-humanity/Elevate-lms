-- Create storage bucket for signed MOUs
INSERT INTO storage.buckets (id, name, public)
VALUES ('mous', 'mous', false)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read their own program holder's MOUs
CREATE POLICY "Program holders can read their own MOUs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'mous' AND
  (storage.foldername(name))[1] IN (
    SELECT ph.id::text
    FROM program_holders ph
    JOIN user_profiles up ON up.program_holder_id = ph.id
    WHERE up.user_id = auth.uid()
  )
);

-- Allow admins to read all MOUs
CREATE POLICY "Admins can read all MOUs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'mous' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow system to insert MOUs (via service role)
CREATE POLICY "System can insert MOUs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'mous');
