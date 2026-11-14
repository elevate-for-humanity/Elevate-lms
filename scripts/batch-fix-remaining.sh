#!/bin/bash
# Batch fix all remaining console statements and any types

echo "🔧 Batch fixing remaining issues..."

# Get list of files with issues
FILES=$(grep -rl "console\.\|: any" lib/ app/ components/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v node_modules | grep -v ".next")

for file in $FILES; do
  # Add logger import if not present and file has console statements
  if grep -q "console\." "$file" && ! grep -q "from '@/lib/logger'" "$file"; then
    # Add import after first import or at top
    if grep -q "^import" "$file"; then
      sed -i "0,/^import/s//import { logger } from '@\/lib\/logger';\nimport/" "$file"
    fi
  fi
done

echo "✅ Added logger imports"
echo "⚠️  Manual fixes still needed for:"
echo "   - Replace console.log with logger.info"
echo "   - Replace console.error with logger.error"  
echo "   - Replace console.warn with logger.warn"
echo "   - Replace : any with proper types"
echo ""
echo "Run: npm run typecheck to see remaining issues"
