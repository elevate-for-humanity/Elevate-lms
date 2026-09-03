#!/bin/bash
# Comprehensive TypeScript Fix Script
# Fixes all 179 TypeScript errors systematically

set -e

echo "🔧 COMPREHENSIVE TYPESCRIPT FIX"
echo "================================"
echo ""

# Create backup
BACKUP="typescript-fix-backup-$(date +%Y%m%d-%H%M%S)"
git branch "$BACKUP"
echo "✅ Backup created: $BACKUP"
echo ""

# Fix count
FIXED=0

echo "📝 Fixing TypeScript errors..."
echo ""

# The fixes will be applied through Node.js script for precision
node scripts/apply-typescript-fixes.js

echo ""
echo "✅ Fixed $FIXED TypeScript errors"
echo ""
echo "🧪 Running typecheck..."
npm run typecheck 2>&1 | tee /tmp/typecheck-after-fix.txt

REMAINING=$(grep -c "error TS" /tmp/typecheck-after-fix.txt || echo "0")
echo ""
echo "📊 Results:"
echo "  - Errors before: 179"
echo "  - Errors after: $REMAINING"
echo "  - Fixed: $((179 - REMAINING))"
echo ""

if [ "$REMAINING" -eq "0" ]; then
  echo "🎉 ALL TYPESCRIPT ERRORS FIXED!"
else
  echo "⚠️  $REMAINING errors remaining (will fix in next iteration)"
fi
