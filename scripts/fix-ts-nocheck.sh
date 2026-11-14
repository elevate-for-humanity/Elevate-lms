#!/bin/bash
# Fix all @ts-nocheck files by removing the directive
# This will expose TypeScript errors so we can see what needs fixing

set -e

echo "🔍 Finding all files with @ts-nocheck..."

# Find all files with @ts-nocheck
FILES=$(grep -rl "@ts-nocheck" app lib components --include="*.ts" --include="*.tsx" 2>/dev/null || true)

if [ -z "$FILES" ]; then
  echo "✅ No files with @ts-nocheck found"
  exit 0
fi

COUNT=$(echo "$FILES" | wc -l)
echo "📝 Found $COUNT files with @ts-nocheck"

echo ""
echo "🔧 Removing @ts-nocheck from all files..."

# Remove @ts-nocheck from each file
for file in $FILES; do
  if [ -f "$file" ]; then
    # Remove lines containing @ts-nocheck (with or without comments)
    sed -i '/^[[:space:]]*\/\/[[:space:]]*@ts-nocheck/d' "$file"
    echo "  ✓ Fixed: $file"
  fi
done

echo ""
echo "✅ Removed @ts-nocheck from $COUNT files"
echo ""
echo "⚠️  Note: This will expose TypeScript errors."
echo "   Run 'npm run typecheck' to see what needs fixing."
echo ""
echo "💡 Next steps:"
echo "   1. Run: npm run typecheck 2>&1 | tee typescript-errors.log"
echo "   2. Review errors in typescript-errors.log"
echo "   3. Fix critical errors in API routes first"
echo "   4. Add targeted @ts-expect-error where needed"
