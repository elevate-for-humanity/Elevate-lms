-- Dev Studio document uploads
-- Tracks files uploaded via the Dev Studio Documents tab (stored in S3/R2).

CREATE TABLE IF NOT EXISTS public.devstudio_documents (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid        REFERENCES public.profiles(id) ON DELETE SET NULL,
  name                   text        NOT NULL,
  original_name          text        NOT NULL,
  s3_key                 text        NOT NULL,
  bucket                 text        NOT NULL,
  size_bytes             bigint,
  content_type           text,
  ext                    text,
  signed_url             text,
  signed_url_expires_at  timestamptz,
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS devstudio_documents_user_id_idx ON public.devstudio_documents(user_id);
CREATE INDEX IF NOT EXISTS devstudio_documents_created_at_idx ON public.devstudio_documents(created_at DESC);

ALTER TABLE public.devstudio_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "devstudio_documents_own" ON public.devstudio_documents
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "devstudio_documents_admin_read" ON public.devstudio_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );
