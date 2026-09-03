-- Audit trail for partner CSV exports
CREATE TABLE IF NOT EXISTS partner_export_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  shop_ids UUID[] NOT NULL DEFAULT '{}',
  row_count INTEGER NOT NULL DEFAULT 0,
  export_type TEXT NOT NULL DEFAULT 'completions_csv',
  exported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partner_export_logs_user ON partner_export_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_export_logs_exported_at ON partner_export_logs(exported_at DESC);

-- RLS: only admins and the exporting user can read their own logs
ALTER TABLE partner_export_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own export logs" ON partner_export_logs;
CREATE POLICY "Users can read own export logs"
  ON partner_export_logs FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own export logs" ON partner_export_logs;
CREATE POLICY "Users can insert own export logs"
  ON partner_export_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
