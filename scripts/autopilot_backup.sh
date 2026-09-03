#!/usr/bin/env bash
# Autopilot Backup Script - Phase 2 Rollback Automation
# Creates a compressed database snapshot before migrations
# Usage: ./scripts/autopilot_backup.sh POSTGRES_DB_URL

set -euo pipefail

DB_URL="${1:-}"
if [[ -z "$DB_URL" ]]; then
  echo "❌ Error: Missing database URL" >&2
  echo "Usage: $0 POSTGRES_DB_URL" >&2
  exit 1
fi

# Create backup directory
STAMP=$(date +"%Y%m%d_%H%M%S")
SNAP_DIR="supabase/backups"
mkdir -p "$SNAP_DIR"
SNAP_FILE="$SNAP_DIR/backup_$STAMP.sql.gz"

echo "==> Creating pre-migration snapshot: $SNAP_FILE"
echo "    Timestamp: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"

# Create backup with pg_dump
# --no-owner: Don't output commands to set ownership
# --no-privileges: Don't output commands to set privileges
# --clean: Include DROP commands before CREATE
# --if-exists: Use IF EXISTS with DROP commands
# --schema=lms: Only backup the lms schema (adjust as needed)
pg_dump \
  --no-owner \
  --no-privileges \
  --clean \
  --if-exists \
  --schema=lms \
  "$DB_URL" | gzip > "$SNAP_FILE"

# Verify backup was created
if [[ ! -f "$SNAP_FILE" ]]; then
  echo "❌ Error: Backup file was not created" >&2
  exit 1
fi

BACKUP_SIZE=$(du -h "$SNAP_FILE" | cut -f1)
echo "✅ Snapshot complete: $SNAP_FILE ($BACKUP_SIZE)"

# Keep only last 10 backups to save space
echo "==> Cleaning old backups (keeping last 10)..."
ls -t "$SNAP_DIR"/backup_*.sql.gz | tail -n +11 | xargs -r rm -f
echo "✅ Cleanup complete"

# Export backup filename for GitHub Actions
echo "BACKUP_FILE=$SNAP_FILE" >> "${GITHUB_OUTPUT:-/dev/null}"
echo "BACKUP_TIMESTAMP=$STAMP" >> "${GITHUB_OUTPUT:-/dev/null}"

exit 0
