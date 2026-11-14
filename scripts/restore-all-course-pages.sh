#!/bin/bash

echo "Restoring all course pages from backups..."

# Find all backup files in courses directories
find app/courses -name "*.backup" -type f | while read backup; do
  original="${backup%.backup}"
  echo "Restoring: $original"
  cp "$backup" "$original"
done

find app/student/courses -name "*.backup" -type f | while read backup; do
  original="${backup%.backup}"
  echo "Restoring: $original"
  cp "$backup" "$original"
done

find app/program-holder/courses -name "*.backup" -type f | while read backup; do
  original="${backup%.backup}"
  echo "Restoring: $original"
  cp "$backup" "$original"
done

echo ""
echo "✅ All course pages restored from backups!"
echo ""
echo "Restored pages include:"
echo "  - Partner course catalog"
echo "  - HSI enrollment system"
echo "  - Course builder"
echo "  - Student course pages"
echo "  - Program holder course creation"
echo ""
