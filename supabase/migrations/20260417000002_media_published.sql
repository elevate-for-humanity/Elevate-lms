-- W009: media table missing published column
-- Admin /admin/videos selects and filters on published to count published videos.
ALTER TABLE public.media
  ADD COLUMN IF NOT EXISTS published boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.media.published IS
  'Whether this media asset is visible in the admin video library';
