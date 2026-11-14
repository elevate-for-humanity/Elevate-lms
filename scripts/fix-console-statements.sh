#!/bin/bash
# Script to systematically replace console statements with logger

set -e

echo "🔧 Fixing console statements across the codebase..."

# Find all files with console statements
FILES=$(grep -rl "console\." lib/ app/ components/ --include="*.ts" --include="*.tsx" 2>/dev/null || true)

COUNT=0
for file in $FILES; do
  # Skip if file doesn't exist or is in node_modules
  if [[ ! -f "$file" ]] || [[ "$file" == *"node_modules"* ]]; then
    continue
  fi
  
  # Check if logger import already exists
  if ! grep -q "import.*logger.*from.*@/lib/logger" "$file"; then
    # Add logger import at the top (after other imports)
    if grep -q "^import" "$file"; then
      # Find the last import line and add after it
      sed -i "/^import/a import { logger } from '@/lib/logger';" "$file"
    else
      # No imports, add at the very top
      sed -i "1i import { logger } from '@/lib/logger';\n" "$file"
    fi
  fi
  
  COUNT=$((COUNT + 1))
  echo "  ✓ Processed $file"
  
  # Limit to first 50 files for now
  if [ $COUNT -ge 50 ]; then
    echo "  ⚠️  Processed 50 files, stopping for review..."
    break
  fi
done

echo "✅ Processed $COUNT files"
echo "⚠️  Note: Imports added, but console.* calls still need manual replacement"
echo "   Run: grep -rn 'console\.' lib/ app/ components/ to find remaining instances"
