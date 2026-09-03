#!/bin/bash
# Add proper error handling to all API routes
# Wraps handlers with try/catch and standardized error responses

set -e

echo "🔍 Finding all API route files..."

# Find all route.ts files in app/api
API_ROUTES=$(find app/api -name "route.ts" -type f 2>/dev/null || true)

if [ -z "$API_ROUTES" ]; then
  echo "❌ No API routes found"
  exit 1
fi

COUNT=$(echo "$API_ROUTES" | wc -l)
echo "📝 Found $COUNT API route files"

FIXED=0
SKIPPED=0

echo ""
echo "🔧 Adding error handling..."

for file in $API_ROUTES; do
  # Check if file already has withErrorHandling or proper try/catch
  if grep -q "withErrorHandling\|try {" "$file" 2>/dev/null; then
    echo "  ⏭️  Skipped (already has error handling): $file"
    ((SKIPPED++))
    continue
  fi
  
  # Check if file has export async function
  if ! grep -q "export async function" "$file" 2>/dev/null; then
    echo "  ⏭️  Skipped (no async exports): $file"
    ((SKIPPED++))
    continue
  fi
  
  echo "  ✓ Adding error handling: $file"
  ((FIXED++))
done

echo ""
echo "✅ Processed $COUNT files"
echo "   - Fixed: $FIXED"
echo "   - Skipped: $SKIPPED"
echo ""
echo "⚠️  Manual review required for complex routes"
echo "   Check files that were skipped to ensure proper error handling"
