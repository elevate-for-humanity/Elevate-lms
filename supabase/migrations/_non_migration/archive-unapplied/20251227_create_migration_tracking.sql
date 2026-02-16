-- ============================================
-- MIGRATION TRACKING SYSTEM
-- ============================================
-- Prevents duplicate migrations and tracks what's been applied
-- This is the foundation for clean migration management

-- Create migration tracking table
CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  description TEXT,
  checksum TEXT,
  execution_time_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at 
ON schema_migrations(applied_at);

COMMENT ON TABLE schema_migrations IS 'Tracks which migrations have been applied to prevent duplicates';
COMMENT ON COLUMN schema_migrations.version IS 'Migration filename without .sql extension';
COMMENT ON COLUMN schema_migrations.checksum IS 'MD5 hash of migration file content for verification';

-- Mark all existing migrations as applied (legacy migrations)
-- This prevents them from running again
INSERT INTO schema_migrations (version, description, applied_at)
VALUES
  ('20231214000000_create_digital_purchases', 'Legacy migration - pre-consolidation', NOW()),
  ('20231214000001_create_marketplace_tables', 'Legacy migration - pre-consolidation', NOW()),
  ('20231214000002_product_reports', 'Legacy migration - pre-consolidation', NOW()),
  ('20231214_indiana_enrollment_fields', 'Legacy migration - pre-consolidation', NOW()),
  ('20240108000000_create_products_table', 'Legacy migration - pre-consolidation', NOW()),
  ('20240109000000_create_courses_table', 'Legacy migration - pre-consolidation', NOW()),
  ('20240110000000_complete_schema', 'Legacy migration - pre-consolidation', NOW()),
  ('20240115_onboarding_tutorials', 'Legacy migration - pre-consolidation', NOW()),
  ('20240116_add_cip_soc_codes', 'Legacy migration - pre-consolidation', NOW()),
  ('20240116_content_moderation', 'Legacy migration - pre-consolidation', NOW()),
  ('20240116_seed_cip_soc_codes', 'Legacy migration - pre-consolidation', NOW()),
  ('20240117_webhooks', 'Legacy migration - pre-consolidation', NOW()),
  ('20240118_referrals', 'Legacy migration - pre-consolidation', NOW()),
  ('20240119_payments', 'Legacy migration - pre-consolidation', NOW()),
  ('20240120_invoicing', 'Legacy migration - pre-consolidation', NOW()),
  ('20251227_fix_schema_mismatches', 'Schema fixes for TypeScript compatibility', NOW()),
  ('20251227_create_migration_tracking', 'Migration tracking system', NOW())
ON CONFLICT (version) DO NOTHING;

-- Function to check if migration has been applied
CREATE OR REPLACE FUNCTION migration_applied(migration_version TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM schema_migrations WHERE version = migration_version
  );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION migration_applied IS 'Check if a migration has already been applied';

-- Function to record migration
CREATE OR REPLACE FUNCTION record_migration(
  migration_version TEXT,
  migration_description TEXT DEFAULT NULL,
  migration_checksum TEXT DEFAULT NULL,
  execution_time INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO schema_migrations (version, description, checksum, execution_time_ms)
  VALUES (migration_version, migration_description, migration_checksum, execution_time)
  ON CONFLICT (version) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION record_migration IS 'Record that a migration has been applied';

-- View to see migration history
CREATE OR REPLACE VIEW migration_history AS
SELECT 
  version,
  description,
  applied_at,
  execution_time_ms,
  CASE 
    WHEN description LIKE '%Legacy%' THEN 'legacy'
    ELSE 'tracked'
  END as migration_type
FROM schema_migrations
ORDER BY applied_at DESC;

COMMENT ON VIEW migration_history IS 'Human-readable view of migration history';
