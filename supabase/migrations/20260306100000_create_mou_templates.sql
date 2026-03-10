-- Creates mou_templates if it does not exist.
-- The 20260218100000 migration assumes this table exists (ALTER only).
-- This migration must run first.

CREATE TABLE IF NOT EXISTS mou_templates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,          -- type discriminator: 'mou' | 'report'
  title       TEXT,
  content     TEXT,
  version     TEXT NOT NULL DEFAULT '1.0',
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Keep updated_at current on every row update
CREATE OR REPLACE FUNCTION update_mou_templates_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mou_templates_updated_at ON mou_templates;
CREATE TRIGGER trg_mou_templates_updated_at
  BEFORE UPDATE ON mou_templates
  FOR EACH ROW EXECUTE FUNCTION update_mou_templates_updated_at();

-- Admin-only RLS
ALTER TABLE mou_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_mou_templates" ON mou_templates;
CREATE POLICY "admin_all_mou_templates" ON mou_templates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('admin', 'super_admin')
    )
  );
