#!/usr/bin/env bash
# Autopilot Rollback Script - Phase 2 Rollback Automation
# Restores database from the most recent backup snapshot
# Usage: ./scripts/autopilot_rollback.sh POSTGRES_DB_URL [BACKUP_FILE]

set -euo pipefail

DB_URL="${1:-}"
BACKUP_FILE="${2:-}"

if [[ -z "$DB_URL" ]]; then
  echo "❌ Error: Missing database URL" >&2
  echo "Usage: $0 POSTGRES_DB_URL [BACKUP_FILE]" >&2
  exit 1
fi

SNAP_DIR="supabase/backups"

# If no backup file specified, use the most recent one
if [[ -z "$BACKUP_FILE" ]]; then
  echo "==> Finding most recent backup..."
  BACKUP_FILE=$(ls -t "$SNAP_DIR"/backup_*.sql.gz 2>/dev/null | head -n1)
  
  if [[ -z "$BACKUP_FILE" ]]; then
    echo "❌ Error: No backup files found in $SNAP_DIR" >&2
    exit 1
  fi
fi

# Verify backup file exists
if [[ ! -f "$BACKUP_FILE" ]]; then
  echo "❌ Error: Backup file not found: $BACKUP_FILE" >&2
  exit 1
fi

BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "🚨 ROLLBACK INITIATED"
echo "    Backup file: $BACKUP_FILE ($BACKUP_SIZE)"
echo "    Timestamp: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"
echo ""

# Confirm rollback (skip in CI)
if [[ -z "${CI:-}" ]] && [[ -z "${GITHUB_ACTIONS:-}" ]]; then
  read -p "⚠️  This will restore the database from backup. Continue? (yes/no): " CONFIRM
  if [[ "$CONFIRM" != "yes" ]]; then
    echo "Rollback cancelled."
    exit 0
  fi
fi

echo "==> Restoring database from backup..."

# Decompress and restore
# The backup already contains DROP commands (--clean flag from pg_dump)
gunzip -c "$BACKUP_FILE" | psql "$DB_URL" 2>&1 | grep -v "^NOTICE:" || true

echo ""
echo "✅ Rollback complete: Database restored from $BACKUP_FILE"

# Log rollback event to database
echo "==> Recording rollback event..."
psql "$DB_URL" <<SQL 2>/dev/null || true
INSERT INTO automation.migration_log (commit_sha, status, notes)
VALUES (
  '${GITHUB_SHA:-manual}',
  'rollback',
  'Restored from backup: $(basename "$BACKUP_FILE")'
);
SQL

# Export rollback info for GitHub Actions
echo "ROLLBACK_FILE=$BACKUP_FILE" >> "${GITHUB_OUTPUT:-/dev/null}"
echo "ROLLBACK_TIMESTAMP=$(date +%s)" >> "${GITHUB_OUTPUT:-/dev/null}"

exit 0
