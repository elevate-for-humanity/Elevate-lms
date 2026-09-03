#!/bin/bash
# monitor-repository-health.sh
# Continuous monitoring for repository cleanliness
# Run this periodically to ensure no old files creep back in

set -e

echo "🔍 REPOSITORY HEALTH MONITOR"
echo "================================"
echo ""

ISSUES_FOUND=0

# Check 1: Durable.co files
echo "1. Checking for Durable.co files..."
DURABLE_FILES=$(find . -maxdepth 1 -name "*durable*" -o -name "*Durable*" 2>/dev/null | wc -l)
if [ "$DURABLE_FILES" -gt 0 ]; then
  echo "   ❌ Found $DURABLE_FILES Durable.co files in root"
  find . -maxdepth 1 -name "*durable*" -o -name "*Durable*" 2>/dev/null
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
  echo "   ✅ No Durable.co files in root"
fi
echo ""

# Check 2: Durable.co source files
echo "2. Checking for Durable.co source files..."
DURABLE_SRC=$(find src/ -name "*Durable*" 2>/dev/null | wc -l)
if [ "$DURABLE_SRC" -gt 0 ]; then
  echo "   ❌ Found $DURABLE_SRC Durable.co source files"
  find src/ -name "*Durable*" 2>/dev/null
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
  echo "   ✅ No Durable.co source files"
fi
echo ""

# Check 3: Old bundles
echo "3. Checking for old bundles..."
BUNDLES=$(ls -1 *.zip *.tar.gz 2>/dev/null | wc -l)
if [ "$BUNDLES" -gt 0 ]; then
  echo "   ❌ Found $BUNDLES old bundles"
  ls -1 *.zip *.tar.gz 2>/dev/null
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
  echo "   ✅ No old bundles"
fi
echo ""

# Check 4: Custom CSS files
echo "4. Checking for custom CSS files..."
CUSTOM_CSS=$(ls -1 src/styles/*.css 2>/dev/null | wc -l)
if [ "$CUSTOM_CSS" -gt 0 ]; then
  echo "   ⚠️  Found $CUSTOM_CSS custom CSS files"
  ls -1 src/styles/*.css 2>/dev/null
  echo "   (This may be intentional - verify they're needed)"
else
  echo "   ✅ No custom CSS files"
fi
echo ""

# Check 5: Excessive documentation
echo "5. Checking documentation count..."
DOC_COUNT=$(find . -maxdepth 1 -name "*.md" -type f | wc -l)
if [ "$DOC_COUNT" -gt 20 ]; then
  echo "   ⚠️  Found $DOC_COUNT MD files in root (consider archiving)"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
  echo "   ✅ Documentation count reasonable ($DOC_COUNT files)"
fi
echo ""

# Check 6: Excessive scripts
echo "6. Checking script count..."
SCRIPT_COUNT=$(find . -maxdepth 1 -name "*.sh" -type f | wc -l)
if [ "$SCRIPT_COUNT" -gt 10 ]; then
  echo "   ⚠️  Found $SCRIPT_COUNT shell scripts in root (consider archiving)"
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
  echo "   ✅ Script count reasonable ($SCRIPT_COUNT files)"
fi
echo ""

# Check 7: Build size
echo "7. Checking build size..."
if [ -d "dist" ]; then
  BUILD_SIZE=$(du -sm dist/ | cut -f1)
  if [ "$BUILD_SIZE" -gt 20 ]; then
    echo "   ⚠️  Build size is ${BUILD_SIZE}MB (consider optimization)"
  else
    echo "   ✅ Build size is ${BUILD_SIZE}MB (reasonable)"
  fi
else
  echo "   ⚠️  dist/ directory not found (run build)"
fi
echo ""

# Check 8: Durable.co references in code
echo "8. Checking for Durable.co references in code..."
DURABLE_REFS=$(grep -r "durable\.co" . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | grep -v node_modules | grep -v dist | grep -v docs/archive | wc -l)
if [ "$DURABLE_REFS" -gt 0 ]; then
  echo "   ❌ Found $DURABLE_REFS Durable.co references in code"
  grep -r "durable\.co" . --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | grep -v node_modules | grep -v dist | grep -v docs/archive | head -5
  ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
  echo "   ✅ No Durable.co references in code"
fi
echo ""

# Check 9: Duplicate configs
echo "9. Checking for duplicate configs..."
DUPLICATE_CONFIGS=0

if [ -f ".eslintrc.json" ] && [ -f ".eslintrc.cjs" ]; then
  echo "   ⚠️  Duplicate ESLint configs found"
  DUPLICATE_CONFIGS=$((DUPLICATE_CONFIGS + 1))
fi

if [ -f ".prettierrc.json" ] && [ -f ".prettierrc" ]; then
  echo "   ⚠️  Duplicate Prettier configs found"
  DUPLICATE_CONFIGS=$((DUPLICATE_CONFIGS + 1))
fi

if [ -f "vitest.config.js" ] && [ -f "vitest.config.ts" ]; then
  echo "   ⚠️  Duplicate Vitest configs found"
  DUPLICATE_CONFIGS=$((DUPLICATE_CONFIGS + 1))
fi

if [ "$DUPLICATE_CONFIGS" -eq 0 ]; then
  echo "   ✅ No duplicate configs"
else
  ISSUES_FOUND=$((ISSUES_FOUND + DUPLICATE_CONFIGS))
fi
echo ""

# Check 10: Node modules size
echo "10. Checking node_modules size..."
if [ -d "node_modules" ]; then
  NODE_SIZE=$(du -sm node_modules/ | cut -f1)
  if [ "$NODE_SIZE" -gt 1000 ]; then
    echo "   ⚠️  node_modules is ${NODE_SIZE}MB (consider pruning)"
  else
    echo "   ✅ node_modules is ${NODE_SIZE}MB (reasonable)"
  fi
else
  echo "   ⚠️  node_modules not found (run pnpm install)"
fi
echo ""

# Summary
echo "================================"
echo "HEALTH CHECK SUMMARY"
echo "================================"
echo ""

if [ "$ISSUES_FOUND" -eq 0 ]; then
  echo "✅ Repository is HEALTHY"
  echo "   No issues found"
  exit 0
else
  echo "⚠️  Repository needs attention"
  echo "   Issues found: $ISSUES_FOUND"
  echo ""
  echo "Run cleanup script to fix issues:"
  echo "   ./master-cleanup.sh"
  exit 1
fi
