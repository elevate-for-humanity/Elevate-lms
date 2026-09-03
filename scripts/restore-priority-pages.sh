#!/bin/bash

# Restore priority pages from backups
echo "Restoring priority admin pages..."

# Check for backups and restore
for backup in app/admin/*/page.tsx.backup; do
  if [ -f "$backup" ]; then
    original="${backup%.backup}"
    echo "Restoring $original"
    cp "$backup" "$original"
  fi
done

echo "✅ Priority pages restored"
