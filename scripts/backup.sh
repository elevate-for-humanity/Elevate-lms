#!/bin/bash

set -e

echo "💾 Starting database backup..."

BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

mkdir -p $BACKUP_DIR

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL environment variable not set"
  exit 1
fi

echo "📦 Creating backup: $BACKUP_FILE"

docker-compose exec -T postgres pg_dump -U elevate elevate_db > $BACKUP_FILE

if [ $? -eq 0 ]; then
  echo "✅ Backup created successfully: $BACKUP_FILE"
  
  gzip $BACKUP_FILE
  echo "🗜️  Backup compressed: $BACKUP_FILE.gz"
  
  find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete
  echo "🧹 Cleaned up backups older than 7 days"
  
  echo "📊 Current backups:"
  ls -lh $BACKUP_DIR
else
  echo "❌ Backup failed"
  exit 1
fi
