#!/bin/bash

# Database Backup Script for Supabase

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

echo "Starting database backup..."

# Backup using Supabase CLI (if available)
if command -v supabase &> /dev/null; then
    echo "Using Supabase CLI..."
    supabase db dump -f $BACKUP_FILE
    echo "Backup completed: $BACKUP_FILE"
else
    echo "Supabase CLI not found. Install with: npm install -g supabase"
    echo "Alternative: Use Supabase Dashboard > Database > Backups"
fi

# Keep only last 7 days of backups
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete

echo "Backup process complete"
