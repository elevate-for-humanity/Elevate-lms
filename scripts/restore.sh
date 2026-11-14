#!/bin/bash

set -e

echo "♻️  Starting database restore..."

if [ -z "$1" ]; then
  echo "Usage: ./restore.sh [backup_file]"
  echo "Example: ./restore.sh backups/backup_20240101_120000.sql.gz"
  exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "⚠️  WARNING: This will replace the current database!"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Restore cancelled"
  exit 0
fi

echo "📦 Restoring from: $BACKUP_FILE"

if [[ $BACKUP_FILE == *.gz ]]; then
  echo "🗜️  Decompressing backup..."
  gunzip -c $BACKUP_FILE | docker-compose exec -T postgres psql -U elevate elevate_db
else
  cat $BACKUP_FILE | docker-compose exec -T postgres psql -U elevate elevate_db
fi

if [ $? -eq 0 ]; then
  echo "✅ Database restored successfully"
else
  echo "❌ Restore failed"
  exit 1
fi
