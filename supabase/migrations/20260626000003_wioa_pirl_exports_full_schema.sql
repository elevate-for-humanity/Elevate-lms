-- Adds missing columns to the live wioa_pirl_exports table so the
-- admin PIRL export UI can track job status, validation results, and downloads.
-- The live table has: id, schema_id, quarter, fiscal_year, status, record_count,
-- file_url, errors, exported_by, exported_at, created_at
-- We add: error_count, warning_count, checksum_sha256, file_path, report_json,
--         created_by, started_at, completed_at

ALTER TABLE public.wioa_pirl_exports
  ADD COLUMN IF NOT EXISTS error_count      integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS warning_count    integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS checksum_sha256  text,
  ADD COLUMN IF NOT EXISTS file_path        text,
  ADD COLUMN IF NOT EXISTS report_json      jsonb,
  ADD COLUMN IF NOT EXISTS created_by       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS started_at       timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at     timestamptz;

-- Normalise status values (live DB may have nulls)
UPDATE public.wioa_pirl_exports
  SET status = 'completed'
  WHERE status IS NULL AND file_url IS NOT NULL;

UPDATE public.wioa_pirl_exports
  SET status = 'pending'
  WHERE status IS NULL;

-- Tighten status constraint
ALTER TABLE public.wioa_pirl_exports
  DROP CONSTRAINT IF EXISTS wioa_pirl_exports_status_check;

ALTER TABLE public.wioa_pirl_exports
  ADD CONSTRAINT wioa_pirl_exports_status_check
  CHECK (status IN ('pending','running','completed','failed'));

-- wioa_pirl_export_issues: add field_name if missing (live may have issue_type)
ALTER TABLE public.wioa_pirl_export_issues
  ADD COLUMN IF NOT EXISTS field_name text;

-- Backfill field_name from issue_type if that column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'wioa_pirl_export_issues'
      AND column_name  = 'issue_type'
  ) THEN
    UPDATE public.wioa_pirl_export_issues
      SET field_name = issue_type
      WHERE field_name IS NULL;
  END IF;
END $$;

-- Index for fast issue lookup by export
CREATE INDEX IF NOT EXISTS idx_wioa_pirl_export_issues_export_id
  ON public.wioa_pirl_export_issues(export_id);

-- RLS: admin-only
ALTER TABLE public.wioa_pirl_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wioa_pirl_export_issues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pirl_exports_admin_all" ON public.wioa_pirl_exports;
DO $$ BEGIN CREATE POLICY "pirl_exports_admin_all" ON public.wioa_pirl_exports FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DROP POLICY IF EXISTS "pirl_export_issues_admin_all" ON public.wioa_pirl_export_issues;
DO $$ BEGIN CREATE POLICY "pirl_export_issues_admin_all" ON public.wioa_pirl_export_issues FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin','super_admin','staff')
    )
  ); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
