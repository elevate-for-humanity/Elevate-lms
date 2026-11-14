#!/usr/bin/env bash
set -e

echo "=================================="
echo "Database Migration Rollback"
echo "=================================="
echo ""

if [ -z "$1" ]; then
  echo "Usage: $0 <migration_name>"
  echo ""
  echo "Example:"
  echo "  $0 20251228_add_scorm_tables"
  echo ""
  echo "Recent migrations:"
  psql "$DATABASE_URL" -c "SELECT version, applied_at FROM schema_migrations ORDER BY applied_at DESC LIMIT 10;" 2>/dev/null || echo "Cannot connect to database"
  exit 1
fi

MIGRATION_NAME="$1"
DB_URL="${DATABASE_URL:-$POSTGRES_URL}"

if [ -z "$DB_URL" ]; then
  echo "❌ Error: DATABASE_URL or POSTGRES_URL not set"
  exit 1
fi

echo "⚠️  WARNING: Rolling back migration: $MIGRATION_NAME"
echo ""
echo "This will:"
echo "  1. Look for a rollback file: supabase/migrations/rollback/${MIGRATION_NAME}.sql"
echo "  2. Execute the rollback SQL"
echo "  3. Remove the migration from schema_migrations table"
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
  echo "Cancelled"
  exit 0
fi

# Check for rollback file
ROLLBACK_FILE="supabase/migrations/rollback/${MIGRATION_NAME}.sql"

if [ -f "$ROLLBACK_FILE" ]; then
  echo ""
  echo "📋 Found rollback file: $ROLLBACK_FILE"
  echo "Executing rollback..."
  
  if psql "$DB_URL" -f "$ROLLBACK_FILE"; then
    echo "✅ Rollback SQL executed"
  else
    echo "❌ Rollback SQL failed"
    exit 1
  fi
else
  echo ""
  echo "⚠️  No rollback file found at: $ROLLBACK_FILE"
  echo ""
  echo "You'll need to manually rollback this migration."
  echo "Common rollback operations:"
  echo "  - DROP TABLE table_name;"
  echo "  - DROP FUNCTION function_name;"
  echo "  - ALTER TABLE table_name DROP COLUMN column_name;"
  echo ""
  read -p "Continue with removing from tracking table? (yes/no): " confirm2
  
  if [ "$confirm2" != "yes" ]; then
    echo "Cancelled"
    exit 0
  fi
fi

# Remove from tracking table
echo ""
echo "Removing from schema_migrations table..."

if psql "$DB_URL" -c "DELETE FROM schema_migrations WHERE version = '$MIGRATION_NAME';"; then
  echo "✅ Migration removed from tracking table"
  echo ""
  echo "🎉 Rollback complete!"
else
  echo "❌ Failed to remove from tracking table"
  exit 1
fi
