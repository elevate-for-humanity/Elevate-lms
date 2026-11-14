CREATE SCHEMA IF NOT EXISTS maintenance;
CREATE TABLE IF NOT EXISTS maintenance.storage_bucket_cleanup_archive (
  archived_at timestamptz NOT NULL DEFAULT now(),
  bucket_id text NOT NULL,
  bucket_row jsonb NOT NULL,
  archive_reason text NOT NULL
);
REVOKE ALL ON SCHEMA maintenance FROM public, anon, authenticated;
REVOKE ALL ON maintenance.storage_bucket_cleanup_archive FROM public, anon, authenticated;
