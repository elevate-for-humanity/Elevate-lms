#!/usr/bin/env bash
set -e

echo "=================================="
echo "Database Migration Runner"
echo "=================================="
echo ""

# Check for required environment variables
if [ -z "$DATABASE_URL" ] && [ -z "$POSTGRES_URL" ]; then
  echo "❌ Error: DATABASE_URL or POSTGRES_URL not set"
  echo ""
  echo "Set one of these environment variables:"
  echo "  export DATABASE_URL='postgresql://user:pass@host:5432/dbname'"
  echo "  export POSTGRES_URL='postgresql://user:pass@host:5432/dbname'"
  exit 1
fi

# Use whichever is set
DB_URL="${DATABASE_URL:-$POSTGRES_URL}"

echo "✅ Database URL configured"
echo ""

# Migration directory
MIGRATIONS_DIR="supabase/migrations"

# Get list of active migrations (not in archive folders)
MIGRATIONS=$(find "$MIGRATIONS_DIR" -maxdepth 1 -name "*.sql" -type f | sort)

if [ -z "$MIGRATIONS" ]; then
  echo "❌ No migrations found in $MIGRATIONS_DIR"
  exit 1
fi

echo "Found migrations:"
echo "$MIGRATIONS" | while read -r file; do
  echo "  - $(basename "$file")"
done
echo ""

# Run migrations in order
echo "Running migrations..."
echo ""

SUCCESS=0
FAILED=0
SKIPPED=0

for migration in $MIGRATIONS; do
  filename=$(basename "$migration")
  migration_name="${filename%.sql}"
  
  echo "📋 Processing: $filename"
  
  # Check if migration was already applied
  APPLIED=$(psql "$DB_URL" -t -c "SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE version = '$migration_name');" 2>/dev/null || echo "f")
  
  if [ "$APPLIED" = " t" ]; then
    echo "   ⏭️  Already applied, skipping"
    ((SKIPPED++))
    echo ""
    continue
  fi
  
  # Run the migration
  if psql "$DB_URL" -f "$migration" 2>&1 | tee /tmp/migration_output.log; then
    echo "   ✅ Success"
    ((SUCCESS++))
    
    # Record migration (if not already recorded by the migration itself)
    psql "$DB_URL" -c "INSERT INTO schema_migrations (version, description) VALUES ('$migration_name', 'Applied via run-migrations.sh') ON CONFLICT (version) DO NOTHING;" >/dev/null 2>&1 || true
  else
    echo "   ❌ Failed"
    ((FAILED++))
    echo ""
    echo "Error output:"
    cat /tmp/migration_output.log
    echo ""
    echo "❌ Migration failed: $filename"
    echo "Fix the error and run again"
    exit 1
  fi
  
  echo ""
done

# Summary
echo "=================================="
echo "Migration Summary"
echo "=================================="
echo "✅ Successful: $SUCCESS"
echo "⏭️  Skipped: $SKIPPED"
echo "❌ Failed: $FAILED"
echo ""

if [ $FAILED -eq 0 ]; then
  echo "🎉 All migrations completed successfully!"
  exit 0
else
  echo "❌ Some migrations failed"
  exit 1
fi
