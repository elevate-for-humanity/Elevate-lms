CREATE SCHEMA IF NOT EXISTS maintenance;
REVOKE ALL ON SCHEMA maintenance FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS maintenance.migration_history_dedup_archive (
  archived_at timestamptz NOT NULL DEFAULT now(),
  version text NOT NULL,
  statements text[],
  name text,
  created_by text,
  idempotency_key text,
  rollback text[],
  archive_reason text NOT NULL
);
REVOKE ALL ON maintenance.migration_history_dedup_archive FROM PUBLIC, anon, authenticated;
